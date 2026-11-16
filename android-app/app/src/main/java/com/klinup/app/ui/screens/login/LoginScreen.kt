package com.klinup.app.ui.screens.login

import com.klinup.app.ui.components.TablerIcons

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.models.User
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val LoginBlue       = Color(0xFF1D5CE8)
private val LoginTitleBlue: Color @Composable get() = if (MaterialTheme.klinUpColors.isDark) MaterialTheme.klinUpColors.brandText else LoginBlue
private val InkPrimary: Color     @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color   @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color       @Composable get() = MaterialTheme.klinUpColors.inkMuted
private val InputBorder: Color    @Composable get() = MaterialTheme.klinUpColors.innerBorder
private val PinBoxBg: Color       @Composable get() = MaterialTheme.klinUpColors.cardSubtleBg
private val CardBorderLight: Color @Composable get() = MaterialTheme.klinUpColors.border
private val ErrorRed: Color       @Composable get() = MaterialTheme.klinUpColors.redText

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = androidx.compose.ui.platform.LocalContext.current
    val haptics = LocalHapticFeedback.current
    val lockedSessionUser by SecurityManager.lockedUser.collectAsState()
    val isSessionLocked by SecurityManager.isSessionLocked.collectAsState()
    val multiDeviceNotice by KlinUpRepository.multiDeviceLogoutNotice.collectAsState()
    val biometricEnabled by SecurityManager.biometricEnabled.collectAsState()
    val faceUnlockEnabled by SecurityManager.faceUnlockEnabled.collectAsState()
    val fingerprintAvailable = remember(context) { SecurityManager.isFingerprintAvailable(context) }
    val faceUnlockAvailable = remember(context) { SecurityManager.isFaceUnlockAvailable(context) }
    val canUseFingerprint = biometricEnabled && fingerprintAvailable
    val canUseFace = faceUnlockEnabled && faceUnlockAvailable
    val canUseBiometric = canUseFingerprint || canUseFace

    var emailText by remember { mutableStateOf("") }
    var matchedUser by remember(lockedSessionUser) { mutableStateOf(lockedSessionUser) }
    var pinText by remember { mutableStateOf("") }
    var isLookingUpEmail by remember { mutableStateOf(false) }
    var isVerifyingPin by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var lockoutSeconds by remember { mutableLongStateOf(0L) }
    var hasAutoPromptedBiometric by remember(isSessionLocked, matchedUser?.id) { mutableStateOf(false) }
    var isBiometricAuthenticated by remember(matchedUser?.id) { mutableStateOf(false) }
    var isBiometricPromptOpen by remember(isSessionLocked, matchedUser?.id) {
        mutableStateOf(
            isSessionLocked &&
                matchedUser != null &&
                canUseBiometric
        )
    }

    val pinFocusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current

    val triggerBiometricUnlock = {
        val activity = context as? androidx.fragment.app.FragmentActivity
        if (activity != null && isSessionLocked && canUseBiometric) {
            isBiometricPromptOpen = true
            keyboardController?.hide()
            val promptSubtitle = when {
                canUseFingerprint && canUseFace -> "Authentifiez-vous par empreinte ou reconnaissance faciale"
                canUseFace -> "Authentifiez-vous par reconnaissance faciale"
                else -> "Authentifiez-vous avec votre empreinte digitale"
            }
            val promptFailure = when {
                canUseFingerprint && canUseFace -> "Empreinte ou visage non reconnu. Réessayez ou utilisez votre code PIN."
                canUseFace -> "Visage non reconnu. Réessayez ou utilisez votre code PIN."
                else -> "Empreinte non reconnue. Réessayez ou utilisez votre code PIN."
            }
            SecurityManager.showBiometricPrompt(
                activity = activity,
                title = "Déverrouiller KLIN UP",
                subtitle = promptSubtitle,
                negativeButtonText = "Utiliser le code PIN",
                failureMessage = promptFailure,
                onSuccess = {
                    isBiometricAuthenticated = true
                    keyboardController?.hide()
                    scope.launch {
                        val res = KlinUpRepository.unlockWithBiometric()
                        res.onSuccess {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            onLoginSuccess()
                        }.onFailure { err ->
                            isBiometricAuthenticated = false
                            isBiometricPromptOpen = false
                            errorMessage = err.message ?: "Erreur biométrique"
                        }
                    }
                },
                onCancel = {
                    isBiometricPromptOpen = false
                },
                onError = { err ->
                    isBiometricPromptOpen = false
                    errorMessage = err
                }
            )
        } else {
            isBiometricPromptOpen = false
        }
    }

    LaunchedEffect(isSessionLocked, matchedUser?.id, canUseBiometric, lockoutSeconds, isBiometricAuthenticated) {
        if (isBiometricAuthenticated) return@LaunchedEffect
        if (isSessionLocked && matchedUser != null && canUseBiometric && lockoutSeconds == 0L && !hasAutoPromptedBiometric) {
            hasAutoPromptedBiometric = true
            triggerBiometricUnlock()
        } else if (!isSessionLocked || !canUseBiometric || lockoutSeconds > 0L) {
            isBiometricPromptOpen = false
        }
    }

    // Synchronise le compte à déverrouiller et le compte à rebours anti-bruteforce (1s)
    LaunchedEffect(matchedUser) {
        val u = matchedUser ?: return@LaunchedEffect
        val accountKey = u.id.ifBlank { u.email.orEmpty() }
        lockoutSeconds = SecurityManager.getLockoutRemainingSeconds(accountKey)
        while (true) {
            val rem = SecurityManager.getLockoutRemainingSeconds(accountKey)
            lockoutSeconds = rem
            if (rem > 0L) {
                delay(1000L)
            } else {
                delay(500L)
            }
        }
    }

    // Focus automatique et clavier numérique uniquement quand le panneau PIN est visible
    LaunchedEffect(matchedUser?.id, isBiometricPromptOpen, isBiometricAuthenticated, lockoutSeconds) {
        if (matchedUser != null && !isBiometricPromptOpen && !isBiometricAuthenticated && lockoutSeconds == 0L) {
            delay(180L)
            if (!isBiometricPromptOpen && !isBiometricAuthenticated) {
                runCatching {
                    pinFocusRequester.requestFocus()
                    keyboardController?.show()
                }
            }
        }
    }

    fun submitEmail() {
        val cleanEmail = emailText.trim()
        if (cleanEmail.isEmpty()) {
            errorMessage = "Veuillez entrer votre adresse email."
            return
        }
        if (isLookingUpEmail) return
        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        errorMessage = null
        isLookingUpEmail = true
        scope.launch {
            KlinUpRepository.lookupStaffByEmail(cleanEmail)
                .onSuccess { found ->
                    isLookingUpEmail = false
                    pinText = ""
                    matchedUser = found
                }
                .onFailure { err ->
                    isLookingUpEmail = false
                    errorMessage = err.message ?: "Aucun compte actif trouvé pour cet email."
                }
        }
    }

    fun verifyPin(user: User, pin: String) {
        if (isVerifyingPin || lockoutSeconds > 0L) return
        isVerifyingPin = true
        errorMessage = null
        scope.launch {
            KlinUpRepository.loginWithPin(user, pin)
                .onSuccess {
                    isVerifyingPin = false
                    onLoginSuccess()
                }
                .onFailure { err ->
                    isVerifyingPin = false
                    pinText = ""
                    val accountKey = user.id.ifBlank { user.email.orEmpty() }
                    lockoutSeconds = SecurityManager.getLockoutRemainingSeconds(accountKey)
                    errorMessage = err.message ?: "Code PIN incorrect"
                }
        }
    }

    val appColors = MaterialTheme.klinUpColors

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(appColors.pageBg)
            .imePadding()
            .padding(horizontal = 22.dp),
        contentAlignment = Alignment.Center
    ) {
        AnimatedVisibility(
            visible = !(matchedUser != null && (isBiometricPromptOpen || isBiometricAuthenticated)),
            enter = fadeIn(tween(240)) + scaleIn(initialScale = 0.96f, animationSpec = tween(240)),
            exit = fadeOut(tween(160)) + scaleOut(targetScale = 0.96f, animationSpec = tween(160))
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                color = appColors.cardBg,
                shadowElevation = 0.dp,
                border = BorderStroke(1.dp, CardBorderLight)
            ) {
            if (matchedUser == null) {
                // ── Step 1: Email ──────────────────────────────────────
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 24.dp, vertical = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Laverie - App",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = LoginTitleBlue
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Connexion Pressing Pro",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Connectez-vous pour accéder à la plateforme de caisse & atelier.",
                        fontSize = 13.sp,
                        color = InkMuted,
                        textAlign = TextAlign.Center,
                        lineHeight = 19.sp
                    )

                    if (!multiDeviceNotice.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = appColors.softAmberBg,
                            border = BorderStroke(1.dp, appColors.amberText.copy(alpha = 0.35f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = multiDeviceNotice!!,
                                fontSize = 12.sp,
                                color = appColors.amberText,
                                fontWeight = FontWeight.Medium,
                                lineHeight = 17.sp,
                                modifier = Modifier.padding(12.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(26.dp))

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Email",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = InkSecondary
                        )

                        OutlinedTextField(
                            value = emailText,
                            onValueChange = {
                                emailText = it
                                if (errorMessage != null) errorMessage = null
                            },
                            placeholder = {
                                Text(
                                    text = "Entrez votre adresse email",
                                    fontSize = 14.sp,
                                    color = appColors.placeholder
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = TablerIcons.Mail,
                                    contentDescription = null,
                                    tint = InkMuted,
                                    modifier = Modifier.size(20.dp)
                                )
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(onDone = { submitEmail() }),
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = InputBorder,
                                focusedBorderColor = LoginBlue,
                                unfocusedContainerColor = appColors.cardSubtleBg,
                                focusedContainerColor = appColors.cardSubtleBg,
                                unfocusedTextColor = InkPrimary,
                                focusedTextColor = InkPrimary,
                                cursorColor = LoginBlue
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    if (errorMessage != null) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = errorMessage!!,
                            fontSize = 12.sp,
                            color = ErrorRed,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(22.dp))

                    Button(
                        onClick = { submitEmail() },
                        enabled = !isLookingUpEmail,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = LoginBlue)
                    ) {
                        if (isLookingUpEmail) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Se connecter",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.ShieldCheck,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "Authentification sécurisée • Keystore AES-256",
                            fontSize = 11.sp,
                            color = InkMuted
                        )
                    }
                }
            } else {
                // ── Step 2: 6-digit PIN verification ───────────────────
                val user = matchedUser!!
                val initials = remember(user) { userInitials(user) }
                val roleLabel = remember(user.role) { formatUserRole(user.role) }
                val isPinLocked = lockoutSeconds > 0L

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        IconButton(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                SecurityManager.clearSession()
                                matchedUser = null
                                pinText = ""
                                errorMessage = null
                            },
                            modifier = Modifier
                                .align(Alignment.CenterStart)
                                .size(36.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.ChevronLeft,
                                contentDescription = "Changer de compte",
                                tint = InkSecondary,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        if (isSessionLocked) {
                            Surface(
                                modifier = Modifier.align(Alignment.CenterEnd),
                                shape = RoundedCornerShape(999.dp),
                                color = appColors.softBlueBg,
                                border = BorderStroke(1.dp, appColors.softBlueBorder)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = TablerIcons.Lock,
                                        contentDescription = null,
                                        tint = LoginTitleBlue,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Text(
                                        text = "Session verrouillée",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = LoginTitleBlue
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Box(
                        modifier = Modifier
                            .size(76.dp)
                            .clip(CircleShape)
                            .background(LoginBlue),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = user.fullName,
                        fontSize = 19.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = roleLabel,
                        fontSize = 13.sp,
                        color = InkMuted,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(22.dp))

                    Text(
                        text = "Vérifiez votre identité",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Entrez votre code PIN à 6 chiffres pour accéder à l'espace de travail.",
                        fontSize = 13.sp,
                        color = InkMuted,
                        textAlign = TextAlign.Center,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )

                    Spacer(modifier = Modifier.height(22.dp))

                    // 6-digit PIN OTP boxes backed by hidden BasicTextField
                    Box(contentAlignment = Alignment.Center) {
                        BasicTextField(
                            value = pinText,
                            onValueChange = { raw ->
                                if (isPinLocked) return@BasicTextField
                                val digits = raw.filter { it.isDigit() }.take(6)
                                pinText = digits
                                if (errorMessage != null) errorMessage = null
                                if (digits.length == 6) {
                                    verifyPin(user, digits)
                                }
                            },
                            enabled = !isVerifyingPin && !isPinLocked,
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.NumberPassword,
                                imeAction = ImeAction.Done
                            ),
                            modifier = Modifier
                                .matchParentSize()
                                .alpha(0f)
                                .focusRequester(pinFocusRequester)
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .alpha(if (isPinLocked) 0.5f else 1f)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    enabled = !isPinLocked
                                ) {
                                    runCatching {
                                        pinFocusRequester.requestFocus()
                                        keyboardController?.show()
                                    }
                                }
                        ) {
                            repeat(6) { index ->
                                val char = pinText.getOrNull(index)
                                val isCurrent = index == pinText.length && !isVerifyingPin && !isPinLocked
                                Surface(
                                    modifier = Modifier
                                        .width(44.dp)
                                        .height(52.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    color = PinBoxBg,
                                    border = BorderStroke(
                                        width = if (isCurrent) 1.5.dp else 1.dp,
                                        color = when {
                                            isPinLocked -> ErrorRed.copy(alpha = 0.5f)
                                            isCurrent -> LoginBlue
                                            else -> InputBorder
                                        }
                                    )
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        if (char != null) {
                                            Box(
                                                modifier = Modifier
                                                    .size(10.dp)
                                                    .clip(CircleShape)
                                                    .background(InkPrimary)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (isVerifyingPin) {
                        Spacer(modifier = Modifier.height(16.dp))
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = LoginBlue,
                            strokeWidth = 2.dp
                        )
                    }

                    if (isPinLocked) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = appColors.softRedBg,
                            border = BorderStroke(1.dp, appColors.softRedBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            val mins = lockoutSeconds / 60
                            val secs = lockoutSeconds % 60
                            val timerLabel = if (mins > 0) "${mins}m ${secs}s" else "${secs}s"
                            Text(
                                text = "Trop de tentatives.\nRéessayez dans $timerLabel.",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = ErrorRed,
                                textAlign = TextAlign.Center,
                                lineHeight = 17.sp,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                            )
                        }
                    } else if (errorMessage != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = errorMessage!!,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = ErrorRed,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (isSessionLocked && canUseBiometric && !isPinLocked) {
                        val buttonIcon = if (canUseFace && !canUseFingerprint) TablerIcons.FaceId else TablerIcons.Fingerprint
                        val buttonText = when {
                            canUseFingerprint && canUseFace -> "Déverrouiller par empreinte ou visage"
                            canUseFace -> "Déverrouiller par reconnaissance faciale"
                            else -> "Déverrouiller par empreinte"
                        }
                        androidx.compose.material3.OutlinedButton(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                triggerBiometricUnlock()
                            },
                            shape = RoundedCornerShape(999.dp),
                            border = BorderStroke(1.2.dp, LoginTitleBlue),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = appColors.softBlueBg,
                                contentColor = LoginTitleBlue
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp)
                        ) {
                            Icon(
                                imageVector = buttonIcon,
                                contentDescription = null,
                                tint = LoginTitleBlue,
                                modifier = Modifier.size(20.dp)
                            )
                            if (canUseFingerprint && canUseFace) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = TablerIcons.FaceId,
                                    contentDescription = null,
                                    tint = LoginTitleBlue,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = buttonText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = LoginTitleBlue
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
        }
    }
}

private fun userInitials(user: User): String {
    val parts = user.fullName.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
    return when {
        parts.size >= 2 -> "${parts[0].first().uppercaseChar()}${parts[1].first().uppercaseChar()}"
        parts.size == 1 && parts[0].length >= 2 -> parts[0].take(2).uppercase()
        parts.size == 1 -> parts[0].take(1).uppercase()
        else -> "KU"
    }
}

private fun formatUserRole(role: String): String = when (role.lowercase()) {
    "super_admin" -> "Super Administrateur"
    "admin" -> "Administrateur"
    "manager", "gerant", "gerant_boutique" -> "Gérant"
    "agent_caisse", "agent_accueil" -> "Agent de Caisse"
    "agent_atelier", "agent_lavage_repassage" -> "Agent d'Atelier"
    "editeur_catalogue" -> "Éditeur Catalogue"
    "livreur" -> "Livreur"
    else -> role.replace("_", " ").replaceFirstChar { it.uppercase() }
}
