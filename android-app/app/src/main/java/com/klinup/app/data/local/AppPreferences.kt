package com.klinup.app.data.local

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

enum class ThemeMode(val label: String) { SYSTEM("Système"), LIGHT("Clair"), DARK("Sombre") }

/**
 * Préférences locales de l'appareil (aucune donnée envoyée en base).
 */
object AppPreferences {
    private const val PREFS = "klinup_prefs"
    private const val KEY_THEME = "theme_mode"
    private const val KEY_HIDE_AMOUNTS = "hide_amounts"
    private lateinit var prefs: SharedPreferences
    private lateinit var filesDir: File

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    private val _hideAmounts = MutableStateFlow(false)
    val hideAmounts: StateFlow<Boolean> = _hideAmounts.asStateFlow()

    /** Incrémenté à chaque changement de photo pour forcer le rechargement. */
    private val _avatarVersion = MutableStateFlow(0)
    val avatarVersion: StateFlow<Int> = _avatarVersion.asStateFlow()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        filesDir = context.filesDir
        _themeMode.value = runCatching {
            ThemeMode.valueOf(prefs.getString(KEY_THEME, ThemeMode.SYSTEM.name)!!)
        }.getOrDefault(ThemeMode.SYSTEM)
        _hideAmounts.value = prefs.getBoolean(KEY_HIDE_AMOUNTS, false)
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
        prefs.edit().putString(KEY_THEME, mode.name).apply()
    }

    fun setHideAmounts(hide: Boolean) {
        _hideAmounts.value = hide
        if (::prefs.isInitialized) {
            prefs.edit().putBoolean(KEY_HIDE_AMOUNTS, hide).apply()
        }
    }

    fun toggleHideAmounts() {
        setHideAmounts(!_hideAmounts.value)
    }

    fun maskAmount(formattedAmount: String, hidden: Boolean = _hideAmounts.value): String {
        return if (hidden) "•••••• FCFA" else formattedAmount
    }

    private const val AVATAR_MAX_DIM = 512
    private const val AVATAR_JPEG_QUALITY = 82

    fun avatarFile(userId: String): File = File(filesDir, "avatar_$userId.jpg")

    private fun avatarHashKey(userId: String): String = "avatar_hash_$userId"

    /**
     * Compresse et enregistre la photo de profil en cache local, puis retourne la Data URI
     * (data:image/jpeg;base64,...) prête à être synchronisée dans Supabase (`staff.user_picture`).
     */
    suspend fun saveAvatar(context: Context, userId: String, uri: Uri): String? = withContext(Dispatchers.IO) {
        runCatching {
            val rawBytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                ?: return@runCatching null
            val compressedBytes = compressAvatarBytes(rawBytes) ?: rawBytes
            avatarFile(userId).writeBytes(compressedBytes)
            val dataUri = "data:image/jpeg;base64," + Base64.encodeToString(compressedBytes, Base64.NO_WRAP)
            if (::prefs.isInitialized) {
                prefs.edit().putString(avatarHashKey(userId), dataUri.hashCode().toString()).apply()
            }
            _avatarVersion.value++
            dataUri
        }.getOrNull()
    }

    /**
     * Restaure localement la photo de profil provenant de Supabase (`staff.user_picture`),
     * qu'elle soit stockée en Data URI Base64 ou en URL HTTPS.
     */
    suspend fun syncAvatarFromRemote(userId: String, remoteAvatar: String?): Boolean = withContext(Dispatchers.IO) {
        if (userId.isBlank() || remoteAvatar.isNullOrBlank()) return@withContext false
        val trimmed = remoteAvatar.trim()
        val remoteHash = trimmed.hashCode().toString()
        val localFile = avatarFile(userId)
        if (localFile.exists() && ::prefs.isInitialized && prefs.getString(avatarHashKey(userId), null) == remoteHash) {
            return@withContext true
        }
        runCatching {
            val bytes: ByteArray? = when {
                trimmed.startsWith("data:image", ignoreCase = true) && trimmed.contains(";base64,", ignoreCase = true) -> {
                    val b64 = trimmed.substringAfter(";base64,")
                    Base64.decode(b64, Base64.DEFAULT)
                }
                trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true) -> {
                    val conn = (URL(trimmed).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 10_000
                        readTimeout = 15_000
                        instanceFollowRedirects = true
                    }
                    try {
                        if (conn.responseCode in 200..299) conn.inputStream.use { it.readBytes() } else null
                    } finally {
                        conn.disconnect()
                    }
                }
                else -> null
            }
            if (bytes != null && bytes.isNotEmpty()) {
                localFile.writeBytes(bytes)
                if (::prefs.isInitialized) {
                    prefs.edit().putString(avatarHashKey(userId), remoteHash).apply()
                }
                _avatarVersion.value++
                true
            } else {
                false
            }
        }.getOrDefault(false)
    }

    /**
     * Encode une photo locale existante en Data URI pour migrer automatiquement un ancien avatar local vers Supabase.
     */
    suspend fun encodeLocalAvatarAsDataUri(userId: String): String? = withContext(Dispatchers.IO) {
        if (userId.isBlank()) return@withContext null
        val file = avatarFile(userId)
        if (!file.exists()) return@withContext null
        runCatching {
            val rawBytes = file.readBytes()
            val compressed = compressAvatarBytes(rawBytes) ?: rawBytes
            if (compressed.size < rawBytes.size) {
                file.writeBytes(compressed)
            }
            val dataUri = "data:image/jpeg;base64," + Base64.encodeToString(compressed, Base64.NO_WRAP)
            if (::prefs.isInitialized) {
                prefs.edit().putString(avatarHashKey(userId), dataUri.hashCode().toString()).apply()
            }
            dataUri
        }.getOrNull()
    }

    fun removeAvatar(userId: String) {
        avatarFile(userId).delete()
        if (::prefs.isInitialized) {
            prefs.edit().remove(avatarHashKey(userId)).apply()
        }
        _avatarVersion.value++
    }

    private fun offlineCacheFile(userId: String): File = File(filesDir, "offline_cache_$userId.json")

    fun saveOfflineCache(userId: String, jsonPayload: String) {
        if (userId.isBlank() || !::filesDir.isInitialized) return
        runCatching {
            offlineCacheFile(userId).writeText(jsonPayload)
        }
    }

    fun loadOfflineCache(userId: String): String? {
        if (userId.isBlank() || !::filesDir.isInitialized) return null
        val f = offlineCacheFile(userId)
        if (!f.exists()) return null
        return runCatching { f.readText() }.getOrNull()
    }

    private fun compressAvatarBytes(rawBytes: ByteArray): ByteArray? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sampleSize = 1
        while (bounds.outWidth / (sampleSize * 2) >= AVATAR_MAX_DIM &&
            bounds.outHeight / (sampleSize * 2) >= AVATAR_MAX_DIM
        ) {
            sampleSize *= 2
        }

        val decoded = BitmapFactory.decodeByteArray(
            rawBytes,
            0,
            rawBytes.size,
            BitmapFactory.Options().apply { inSampleSize = sampleSize }
        ) ?: return null

        val maxSide = maxOf(decoded.width, decoded.height)
        val scaled = if (maxSide > AVATAR_MAX_DIM) {
            val ratio = AVATAR_MAX_DIM.toFloat() / maxSide.toFloat()
            val targetW = (decoded.width * ratio).toInt().coerceAtLeast(1)
            val targetH = (decoded.height * ratio).toInt().coerceAtLeast(1)
            Bitmap.createScaledBitmap(decoded, targetW, targetH, true).also {
                if (it !== decoded) decoded.recycle()
            }
        } else {
            decoded
        }

        return ByteArrayOutputStream().use { out ->
            scaled.compress(Bitmap.CompressFormat.JPEG, AVATAR_JPEG_QUALITY, out)
            scaled.recycle()
            out.toByteArray()
        }
    }
}
