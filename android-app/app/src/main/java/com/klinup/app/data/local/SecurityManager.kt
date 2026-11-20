package com.klinup.app.data.local

import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.klinup.app.BuildConfig
import com.klinup.app.data.models.User
import com.klinup.app.data.remote.SupabaseClientProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

enum class AutoLockTimeout(val minutes: Int, val label: String) {
    MIN_2(2, "2 min"),
    MIN_5(5, "5 min"),
    MIN_15(15, "15 min");

    val millis: Long get() = minutes * 60_000L
}

sealed class PinVerificationResult {
    data object Success : PinVerificationResult()
    data class InvalidPin(val remainingAttempts: Int, val cooldownSeconds: Long = 0L) : PinVerificationResult()
    data class LockedOut(val remainingSeconds: Long) : PinVerificationResult()
    data object NotConfigured : PinVerificationResult()
}

/**
 * Gestionnaire de sécurité matériel (Android Keystore AES-256-GCM) :
 * - Chiffrement de la session utilisateur et des compteurs anti-bruteforce.
 * - Comparaison de PIN en temps constant (anti-timing attack) sans PIN par défaut "000000".
 * - Verrouillage progressif (backoff) et blocage de 15 minutes après 5 échecs.
 * - Verrouillage automatique de session après inactivité en arrière-plan.
 */
object SecurityManager {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val KEY_ALIAS = "klinup_master_aes256_key"
    private const val TRANSFORMATION = "AES/GCM/NoPadding"
    private const val GCM_TAG_BITS = 128

    private const val VAULT_PREFS = "klinup_secure_vault"
    private const val KEY_SESSION_USER = "enc_session_user"
    private const val KEY_SESSION_ISSUED_AT = "enc_session_issued_at"
    private const val KEY_LAST_BACKGROUND_AT = "enc_last_bg_at"
    private const val KEY_SESSION_LOCKED = "enc_session_locked"
    private const val KEY_AUTO_LOCK_TIMEOUT = "auto_lock_timeout"
    private const val KEY_SCREEN_SHIELD = "screen_shield_enabled"
    private const val KEY_BIOMETRIC_ENABLED = "biometric_lock_enabled"
    private const val KEY_FACE_UNLOCK_ENABLED = "face_unlock_enabled"

    const val MAX_PIN_ATTEMPTS = 5
    private const val COOLDOWN_4TH_ATTEMPT_MS = 30_000L          // 30 secondes au 4e échec
    private const val LOCKOUT_DURATION_MS = 15 * 60_000L         // 15 minutes au 5e échec
    private const val MAX_SESSION_TTL_MS = 30L * 24L * 60L * 60_000L // 30 jours (évite toute perte après veille prolongée)

    private lateinit var prefs: SharedPreferences
    private var appContext: Context? = null

    private val _isSessionLocked = MutableStateFlow(false)
    val isSessionLocked: StateFlow<Boolean> = _isSessionLocked.asStateFlow()

    private val _lockedUser = MutableStateFlow<User?>(null)
    val lockedUser: StateFlow<User?> = _lockedUser.asStateFlow()

    private val _autoLockTimeout = MutableStateFlow(AutoLockTimeout.MIN_5)
    val autoLockTimeout: StateFlow<AutoLockTimeout> = _autoLockTimeout.asStateFlow()

    private val _screenShieldEnabled = MutableStateFlow(false)
    val screenShieldEnabled: StateFlow<Boolean> = _screenShieldEnabled.asStateFlow()

    private val _biometricEnabled = MutableStateFlow(false)
    val biometricEnabled: StateFlow<Boolean> = _biometricEnabled.asStateFlow()

    private val _faceUnlockEnabled = MutableStateFlow(false)
    val faceUnlockEnabled: StateFlow<Boolean> = _faceUnlockEnabled.asStateFlow()

    fun init(context: Context) {
        appContext = context.applicationContext
        prefs = context.getSharedPreferences(VAULT_PREFS, Context.MODE_PRIVATE)
        ensureMasterKey()
        _autoLockTimeout.value = runCatching {
            AutoLockTimeout.valueOf(
                prefs.getString(KEY_AUTO_LOCK_TIMEOUT, AutoLockTimeout.MIN_5.name)!!
            )
        }.getOrDefault(AutoLockTimeout.MIN_5)
        _screenShieldEnabled.value = prefs.getBoolean(KEY_SCREEN_SHIELD, false)
        _biometricEnabled.value = prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)
        _faceUnlockEnabled.value = prefs.getBoolean(KEY_FACE_UNLOCK_ENABLED, false)
    }

    fun setAutoLockTimeout(timeout: AutoLockTimeout) {
        _autoLockTimeout.value = timeout
        prefs.edit().putString(KEY_AUTO_LOCK_TIMEOUT, timeout.name).apply()
    }

    fun setScreenShieldEnabled(enabled: Boolean) {
        _screenShieldEnabled.value = enabled
        prefs.edit().putBoolean(KEY_SCREEN_SHIELD, enabled).apply()
    }

    fun setBiometricEnabled(enabled: Boolean) {
        _biometricEnabled.value = enabled
        if (::prefs.isInitialized) {
            prefs.edit().putBoolean(KEY_BIOMETRIC_ENABLED, enabled).apply()
        }
    }

    fun setFaceUnlockEnabled(enabled: Boolean) {
        _faceUnlockEnabled.value = enabled
        if (::prefs.isInitialized) {
            prefs.edit().putBoolean(KEY_FACE_UNLOCK_ENABLED, enabled).apply()
        }
    }

    fun hasFingerprintHardware(context: Context): Boolean {
        return context.packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
    }

    fun hasFaceHardware(context: Context): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q &&
            context.packageManager.hasSystemFeature(PackageManager.FEATURE_FACE)
    }

    fun isBiometricAvailable(context: Context): Boolean {
        val manager = androidx.biometric.BiometricManager.from(context)
        val authenticators = androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG or
            androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
        return manager.canAuthenticate(authenticators) == androidx.biometric.BiometricManager.BIOMETRIC_SUCCESS
    }

    fun isFingerprintAvailable(context: Context): Boolean {
        return isBiometricAvailable(context) &&
            (hasFingerprintHardware(context) || !hasFaceHardware(context))
    }

    fun isFaceUnlockAvailable(context: Context): Boolean {
        return isBiometricAvailable(context) && hasFaceHardware(context)
    }

    fun showBiometricPrompt(
        activity: androidx.fragment.app.FragmentActivity,
        title: String = "Déverrouiller KLIN UP",
        subtitle: String = "Utilisez votre empreinte digitale ou reconnaissance faciale pour accéder à l'application",
        negativeButtonText: String = "Utiliser le code PIN",
        failureMessage: String = "Biométrie non reconnue. Réessayez ou utilisez votre code PIN.",
        onSuccess: () -> Unit,
        onCancel: () -> Unit = {},
        onError: (String) -> Unit
    ) {
        val executor = androidx.core.content.ContextCompat.getMainExecutor(activity)
        val prompt = androidx.biometric.BiometricPrompt(
            activity,
            executor,
            object : androidx.biometric.BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: androidx.biometric.BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    if (errorCode == androidx.biometric.BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                        errorCode == androidx.biometric.BiometricPrompt.ERROR_USER_CANCELED ||
                        errorCode == androidx.biometric.BiometricPrompt.ERROR_CANCELED
                    ) {
                        onCancel()
                    } else {
                        onCancel()
                        onError(errString.toString())
                    }
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    onError(failureMessage)
                }
            }
        )
        val promptInfo = androidx.biometric.BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText(negativeButtonText)
            .setConfirmationRequired(false)
            .setAllowedAuthenticators(
                androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
            )
            .build()
        prompt.authenticate(promptInfo)
    }

    // ─── Android Keystore AES-256-GCM ──────────────────────────────────────────

    private fun getOrCreateSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val existing = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry
        if (existing != null) return existing.secretKey

        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            ANDROID_KEYSTORE
        )
        val spec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setRandomizedEncryptionRequired(true)
            .build()
        keyGenerator.init(spec)
        return keyGenerator.generateKey()
    }

    private fun ensureMasterKey() {
        runCatching { getOrCreateSecretKey() }
    }

    private fun encrypt(plainText: String): String? = runCatching {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey())
        val iv = cipher.iv
        val cipherBytes = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))
        val combined = ByteArray(1 + iv.size + cipherBytes.size)
        combined[0] = iv.size.toByte()
        System.arraycopy(iv, 0, combined, 1, iv.size)
        System.arraycopy(cipherBytes, 0, combined, 1 + iv.size, cipherBytes.size)
        Base64.encodeToString(combined, Base64.NO_WRAP)
    }.getOrNull()

    private fun decrypt(encoded: String?): String? {
        if (encoded.isNullOrBlank()) return null
        return runCatching {
            val combined = Base64.decode(encoded, Base64.NO_WRAP)
            val ivSize = combined[0].toInt() and 0xFF
            if (ivSize <= 0 || combined.size <= 1 + ivSize) return null
            val iv = combined.copyOfRange(1, 1 + ivSize)
            val cipherBytes = combined.copyOfRange(1 + ivSize, combined.size)
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateSecretKey(),
                GCMParameterSpec(GCM_TAG_BITS, iv)
            )
            String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8)
        }.getOrNull()
    }

    private fun putEncrypted(key: String, value: String) {
        val enc = encrypt(value) ?: return
        prefs.edit().putString(key, enc).apply()
    }

    private fun getDecrypted(key: String): String? = decrypt(prefs.getString(key, null))

    // ─── Protection Anti-Bruteforce & Verrouillage de Compte ──────────────────

    private fun attemptsKey(accountKey: String) = "bf_attempts_${sha256Hex(accountKey.lowercase().trim()).take(24)}"
    private fun lockUntilKey(accountKey: String) = "bf_lock_${sha256Hex(accountKey.lowercase().trim()).take(24)}"

    fun getLockoutRemainingSeconds(accountKey: String): Long {
        if (!::prefs.isInitialized) return 0L
        val lockUntil = getDecrypted(lockUntilKey(accountKey))?.toLongOrNull() ?: 0L
        val now = System.currentTimeMillis()
        if (lockUntil <= now) return 0L
        return ((lockUntil - now) + 999L) / 1000L
    }

    fun getFailedAttempts(accountKey: String): Int {
        if (!::prefs.isInitialized) return 0
        return getDecrypted(attemptsKey(accountKey))?.toIntOrNull() ?: 0
    }

    fun recordFailedPinAttempt(accountKey: String): PinVerificationResult {
        val currentAttempts = getFailedAttempts(accountKey) + 1
        val now = System.currentTimeMillis()

        return when {
            currentAttempts >= MAX_PIN_ATTEMPTS -> {
                val lockUntil = now + LOCKOUT_DURATION_MS
                putEncrypted(attemptsKey(accountKey), "0")
                putEncrypted(lockUntilKey(accountKey), lockUntil.toString())
                PinVerificationResult.LockedOut(LOCKOUT_DURATION_MS / 1000L)
            }
            currentAttempts == MAX_PIN_ATTEMPTS - 1 -> {
                val lockUntil = now + COOLDOWN_4TH_ATTEMPT_MS
                putEncrypted(attemptsKey(accountKey), currentAttempts.toString())
                putEncrypted(lockUntilKey(accountKey), lockUntil.toString())
                PinVerificationResult.InvalidPin(
                    remainingAttempts = 1,
                    cooldownSeconds = COOLDOWN_4TH_ATTEMPT_MS / 1000L
                )
            }
            else -> {
                putEncrypted(attemptsKey(accountKey), currentAttempts.toString())
                PinVerificationResult.InvalidPin(
                    remainingAttempts = (MAX_PIN_ATTEMPTS - currentAttempts).coerceAtLeast(1)
                )
            }
        }
    }

    fun clearFailedAttempts(accountKey: String) {
        if (!::prefs.isInitialized) return
        prefs.edit()
            .remove(attemptsKey(accountKey))
            .remove(lockUntilKey(accountKey))
            .apply()
    }

    // ─── Vérification du PIN en Temps Constant (Sans PIN par défaut) ──────────

    fun verifyPinConstantTime(
        accountKey: String,
        inputPin: String,
        storedPinOrHash: String?
    ): PinVerificationResult {
        val remainingLock = getLockoutRemainingSeconds(accountKey)
        if (remainingLock > 0L) {
            return PinVerificationResult.LockedOut(remainingLock)
        }

        val cleanStored = storedPinOrHash?.trim().orEmpty()
        // Suppression stricte du fallback "000000" : un compte sans PIN configuré est refusé.
        if (cleanStored.isEmpty() || cleanStored.length < 4) {
            return PinVerificationResult.NotConfigured
        }

        val cleanInput = inputPin.trim()
        val matched = when {
            cleanStored.startsWith("sha256:", ignoreCase = true) -> {
                val expectedHex = cleanStored.substringAfter(":").lowercase()
                val actualHex = sha256Hex(cleanInput).lowercase()
                MessageDigest.isEqual(
                    expectedHex.toByteArray(StandardCharsets.UTF_8),
                    actualHex.toByteArray(StandardCharsets.UTF_8)
                )
            }
            cleanStored.length == 64 && cleanStored.all { it.isDigit() || it.lowercaseChar() in 'a'..'f' } -> {
                val actualHex = sha256Hex(cleanInput).lowercase()
                MessageDigest.isEqual(
                    cleanStored.lowercase().toByteArray(StandardCharsets.UTF_8),
                    actualHex.toByteArray(StandardCharsets.UTF_8)
                )
            }
            else -> {
                // Comparaison des condensés SHA-256 en temps constant pour ne révéler aucune longueur
                val expectedDigest = sha256Bytes(cleanStored)
                val actualDigest = sha256Bytes(cleanInput)
                MessageDigest.isEqual(expectedDigest, actualDigest)
            }
        }

        return if (matched) {
            clearFailedAttempts(accountKey)
            PinVerificationResult.Success
        } else {
            recordFailedPinAttempt(accountKey)
        }
    }

    fun sha256Hex(input: String): String {
        val bytes = sha256Bytes(input)
        val sb = StringBuilder(bytes.size * 2)
        for (b in bytes) {
            sb.append(String.format("%02x", b))
        }
        return sb.toString()
    }

    private fun sha256Bytes(input: String): ByteArray {
        return MessageDigest.getInstance("SHA-256")
            .digest(input.toByteArray(StandardCharsets.UTF_8))
    }

    // ─── Gestion de Session Chiffrée & Auto-Lock ──────────────────────────────

    /**
     * Enregistre la session de l'utilisateur après authentification réussie.
     * Le code PIN est systématiquement purgé (`codePin = null`) avant stockage.
     */
    fun saveSessionToken(token: String) {
        if (!::prefs.isInitialized) return
        putEncrypted("sec_session_token", token)
    }

    fun getSessionToken(): String? {
        if (!::prefs.isInitialized) return null
        return getDecrypted("sec_session_token")?.takeIf { it.isNotBlank() }
    }

    fun getOrCreateDeviceId(): String {
        if (!::prefs.isInitialized) return "unknown_device"
        val existing = prefs.getString("sec_device_id", null)?.takeIf { it.isNotBlank() }
        if (existing != null) return existing
        val created = java.util.UUID.randomUUID().toString()
        prefs.edit().putString("sec_device_id", created).apply()
        return created
    }

    fun getDeviceName(context: Context? = null): String {
        val ctx = context ?: appContext
        val customName = ctx?.let {
            runCatching {
                android.provider.Settings.Global.getString(
                    it.contentResolver,
                    android.provider.Settings.Global.DEVICE_NAME
                )
            }.getOrNull()?.trim()
        }
        if (!customName.isNullOrBlank()) return customName
        return getDeviceModel()
    }

    fun getDeviceModel(): String {
        val m = Build.MANUFACTURER.orEmpty().trim()
        val model = Build.MODEL.orEmpty().trim()
        return if (model.startsWith(m, ignoreCase = true)) model else "$m $model".trim().ifBlank { "Appareil Android" }
    }

    fun getAndroidVersion(): String {
        val release = Build.VERSION.RELEASE.orEmpty().trim().ifBlank { "?" }
        return "Android $release (API ${Build.VERSION.SDK_INT})"
    }

    fun getAppVersion(): String {
        return "v${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})"
    }

    fun saveAuthenticatedSession(user: User) {
        if (!::prefs.isInitialized) return
        val sanitizedUser = user.copy(codePin = null)
        val now = System.currentTimeMillis()
        val rawJson = SupabaseClientProvider.json.encodeToString(sanitizedUser)
        putEncrypted(KEY_SESSION_USER, rawJson)
        putEncrypted(KEY_SESSION_ISSUED_AT, now.toString())
        putEncrypted(KEY_LAST_BACKGROUND_AT, "0")
        putEncrypted(KEY_SESSION_LOCKED, "false")
        _lockedUser.value = sanitizedUser
        _isSessionLocked.value = false
    }

    /**
     * Verrouille immédiatement la session active tout en conservant l'identité de l'employé
     * pour un déverrouillage rapide par PIN à 6 chiffres.
     */
    fun lockSession(currentUser: User?) {
        val target = (currentUser ?: _lockedUser.value)?.copy(codePin = null) ?: return
        if (::prefs.isInitialized) {
            putEncrypted(KEY_SESSION_LOCKED, "true")
        }
        _lockedUser.value = target
        _isSessionLocked.value = true
    }

    fun unlockSessionWithBiometric(): User? {
        val target = _lockedUser.value ?: return null
        if (!::prefs.isInitialized) return null
        putEncrypted(KEY_SESSION_ISSUED_AT, System.currentTimeMillis().toString())
        putEncrypted(KEY_LAST_BACKGROUND_AT, "0")
        putEncrypted(KEY_SESSION_LOCKED, "false")
        _isSessionLocked.value = false
        clearFailedAttempts(target.telephone.orEmpty().ifBlank { target.id })
        return target
    }

    fun onAppBackgrounded() {
        if (!::prefs.isInitialized) return
        putEncrypted(KEY_LAST_BACKGROUND_AT, System.currentTimeMillis().toString())
    }

    /**
     * Vérifie au retour au premier plan si la durée d'inactivité dépasse le délai configuré.
     * Retourne `true` si la session doit être verrouillée.
     */
    fun checkAndApplyAutoLock(activeUser: User?): Boolean {
        if (!::prefs.isInitialized) return false
        val issuedAt = getDecrypted(KEY_SESSION_ISSUED_AT)?.toLongOrNull() ?: return false
        val now = System.currentTimeMillis()

        // Expiration maximale de session (12h)
        if (now - issuedAt > MAX_SESSION_TTL_MS) {
            clearSession()
            return true
        }

        val lastBg = getDecrypted(KEY_LAST_BACKGROUND_AT)?.toLongOrNull() ?: 0L
        if (lastBg > 0L) {
            val elapsed = now - lastBg
            putEncrypted(KEY_LAST_BACKGROUND_AT, "0")
            if (elapsed >= _autoLockTimeout.value.millis) {
                lockSession(activeUser)
                return true
            }
        }
        putEncrypted(KEY_SESSION_ISSUED_AT, now.toString())
        return _isSessionLocked.value
    }

    /**
     * Restaure la session au démarrage de l'application :
     * - Si la session a dépassé 12h : supprime tout et demande Email + PIN.
     * - Si la session a dépassé le délai d'auto-lock (ou était verrouillée) : place l'utilisateur en mode `lockedUser` (étape 2 PIN direct).
     * - Sinon : restaure la session active.
     */
    fun restoreSessionOnLaunch(): Pair<User?, Boolean> {
        if (!::prefs.isInitialized) return null to false
        val rawUser = getDecrypted(KEY_SESSION_USER) ?: return null to false
        val issuedAt = getDecrypted(KEY_SESSION_ISSUED_AT)?.toLongOrNull() ?: return null to false
        val now = System.currentTimeMillis()

        if (now - issuedAt > MAX_SESSION_TTL_MS) {
            clearSession()
            return null to false
        }

        val user = runCatching {
            SupabaseClientProvider.json.decodeFromString<User>(rawUser).copy(codePin = null)
        }.getOrNull() ?: run {
            clearSession()
            return null to false
        }

        val wasExplicitlyLocked = getDecrypted(KEY_SESSION_LOCKED) == "true"
        val lastBg = getDecrypted(KEY_LAST_BACKGROUND_AT)?.toLongOrNull() ?: 0L
        val timedOut = lastBg > 0L && (now - lastBg >= _autoLockTimeout.value.millis)

        return if (wasExplicitlyLocked || timedOut) {
            putEncrypted(KEY_SESSION_LOCKED, "true")
            _lockedUser.value = user
            _isSessionLocked.value = true
            user to true
        } else {
            putEncrypted(KEY_LAST_BACKGROUND_AT, "0")
            _lockedUser.value = user
            _isSessionLocked.value = false
            user to false
        }
    }

    fun clearSession() {
        _lockedUser.value = null
        _isSessionLocked.value = false
        if (!::prefs.isInitialized) return
        prefs.edit()
            .remove(KEY_SESSION_USER)
            .remove(KEY_SESSION_ISSUED_AT)
            .remove(KEY_LAST_BACKGROUND_AT)
            .remove(KEY_SESSION_LOCKED)
            .apply()
    }
}
