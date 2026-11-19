package com.klinup.app.ui.screens.profile

import com.klinup.app.ui.components.TablerIcons

import com.klinup.app.ui.components.LocalBottomBarPadding
import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.LockReset
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.SettingsBrightness
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.ShoppingBasket
import androidx.compose.material.icons.outlined.TrendingUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import com.klinup.app.BuildConfig
import com.klinup.app.data.remote.AppUpdateInfo
import com.klinup.app.data.remote.AppUpdateManager
import com.klinup.app.data.remote.UpdateCheckResult
import java.io.File
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.local.AppPreferences
import com.klinup.app.data.local.AutoLockTimeout
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.local.ThemeMode
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.NavMotion
import com.klinup.app.ui.components.bouncyClickable
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneId

private val Brand = Color(0xFF2600F5)
private val BrandSoft = Color(0xFF5B46F6)
private val BrandText: Color @Composable get() = MaterialTheme.klinUpColors.brandText
private val Success: Color @Composable get() = MaterialTheme.klinUpColors.greenText
private val Warning: Color @Composable get() = MaterialTheme.klinUpColors.amberText
private val Danger: Color @Composable get() = MaterialTheme.klinUpColors.redText

@Immutable
private data class Palette(
    val page: Color,
    val card: Color,
    val border: Color,
    val ink: Color,
    val muted: Color,
    val chip: Color
)

@Composable
private fun rememberPalette(): Palette {
    val c = MaterialTheme.klinUpColors
    return remember(c) {
        Palette(
            page = c.pageBg,
            card = c.cardBg,
            border = c.border,
            ink = c.inkPrimary,
            muted = c.inkMuted,
            chip = c.chipBg
        )
    }
}

@Immutable
private data class PerfStats(
    val total: Int,
    val delivered: Int,
    val inProgress: Int,
    val cancelled: Int,
    val revenue: Double,
    val avgBasket: Double,
    val today: Int,
    val week: Int,
    val month: Int,
    val weekBars: List<Pair<String, Int>>,
    val completionRate: Float
)

private enum class PerfRange(val label: String) { WEEK("7 jours"), MONTH("Ce mois"), ALL("Total") }

private enum class ProfileMenuPage(val title: String) {
    PERFORMANCES("Mes performances"),
    APPARENCE("Apparence"),
    COMPTE("Mon compte"),
    SECURITE("Sécurité & Session"),
    AUTORISATIONS("Autorisations")
}

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current
    val p = rememberPalette()
    val statusTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    val user by KlinUpRepository.currentUser.collectAsState()
    val orders by KlinUpRepository.orders.collectAsState()
    val themeMode by AppPreferences.themeMode.collectAsState()
    val avatarVersion by AppPreferences.avatarVersion.collectAsState()
    val autoLockTimeout by SecurityManager.autoLockTimeout.collectAsState()
    val screenShield by SecurityManager.screenShieldEnabled.collectAsState()
    val biometricEnabled by SecurityManager.biometricEnabled.collectAsState()
    val faceUnlockEnabled by SecurityManager.faceUnlockEnabled.collectAsState()
    var permRefreshTick by remember { mutableIntStateOf(0) }
    val biometricAvailable = remember(context, permRefreshTick) { SecurityManager.isBiometricAvailable(context) }
    val fingerprintAvailable = remember(context, permRefreshTick) { SecurityManager.isFingerprintAvailable(context) }
    val faceUnlockAvailable = remember(context, permRefreshTick) { SecurityManager.isFaceUnlockAvailable(context) }
    var biometricStatusMessage by remember { mutableStateOf<String?>(null) }
    var faceStatusMessage by remember { mutableStateOf<String?>(null) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var updateStatusMessage by remember { mutableStateOf<String?>(null) }
    var availableUpdate by remember { mutableStateOf<AppUpdateInfo?>(null) }
    var isDownloadingUpdate by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableIntStateOf(0) }
    var updateDownloadError by remember { mutableStateOf<String?>(null) }
    var pendingInstallApk by remember { mutableStateOf<File?>(null) }
    var downloadJob by remember { mutableStateOf<Job?>(null) }
    var showCancelDownloadDialog by remember { mutableStateOf(false) }

    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                permRefreshTick++
                val apk = pendingInstallApk
                if (apk != null && apk.exists()) {
                    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()) {
                        pendingInstallApk = null
                        AppUpdateManager.installApk(context, apk)
                    }
                }
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val notificationsGranted = remember(context, permRefreshTick) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }
    val canInstallPackages = remember(context, permRefreshTick) {
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            context.packageManager.canRequestPackageInstalls()
    }
    var notifRequestHadRationale by remember { mutableStateOf(false) }
    val openNotificationSettings: () -> Unit = {
        val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            }
        } else {
            Intent("android.settings.APP_NOTIFICATION_SETTINGS").apply {
                putExtra("app_package", context.packageName)
                putExtra("app_uid", context.applicationInfo.uid)
            }
        }
        runCatching { context.startActivity(intent) }
    }
    val notifPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        permRefreshTick++
        if (!granted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val activity = context as? Activity
            val nowRationale = activity != null &&
                ActivityCompat.shouldShowRequestPermissionRationale(
                    activity,
                    Manifest.permission.POST_NOTIFICATIONS
                )
            if (!notifRequestHadRationale && !nowRationale) {
                openNotificationSettings()
            }
        }
    }

    val userId = user?.id.orEmpty()
    val fullName = user?.fullName ?: "Utilisateur"
    val initials = remember(fullName) {
        fullName.split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.first().uppercase() }
    }
    val roleLabel = remember(user?.role) {
        when (user?.role) {
            "super_admin" -> "Super Administrateur"
            "admin" -> "Administrateur"
            "manager", "gerant" -> "Gérant"
            "agent_caisse" -> "Agent de caisse"
            else -> user?.role?.replace('_', ' ')?.replaceFirstChar { it.uppercase() } ?: "Membre"
        }
    }

    // ── Photo de profil (synchronisée avec Supabase + cache local) ──────────
    val avatar by produceState<ImageBitmap?>(null, userId, avatarVersion) {
        value = if (userId.isBlank()) null else withContext(Dispatchers.IO) {
            val f = AppPreferences.avatarFile(userId)
            if (!f.exists()) null else runCatching {
                BitmapFactory.decodeFile(f.absolutePath)?.asImageBitmap()
            }.getOrNull()
        }
    }
    val savePickedAvatar: (Uri?) -> Unit = { uri ->
        if (uri != null && userId.isNotBlank()) {
            scope.launch {
                val dataUri = AppPreferences.saveAvatar(context, userId, uri)
                if (dataUri != null) {
                    KlinUpRepository.updateUserAvatar(userId, dataUri)
                }
            }
        }
    }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri: Uri? ->
        savePickedAvatar(uri)
    }
    val fallbackPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        savePickedAvatar(uri)
    }
    var showPhotoSheet by remember { mutableStateOf(false) }
    var showPinDialog by remember { mutableStateOf(false) }
    var showLogoutDialog by remember { mutableStateOf(false) }
    var pinRequested by remember { mutableStateOf(false) }

    // ── Performance de l'utilisateur actif ─────────────────────────────────
    var range by remember { mutableStateOf(PerfRange.WEEK) }
    val zone = remember { ZoneId.systemDefault() }
    val stats by produceState<PerfStats?>(null, orders, userId, range) {
        value = withContext(Dispatchers.Default) { computeStats(orders, userId, fullName, range, zone) }
    }

    var activeMenu by remember { mutableStateOf<ProfileMenuPage?>(null) }
    BackHandler(enabled = activeMenu != null) { activeMenu = null }

    AnimatedContent(
        targetState = activeMenu,
        transitionSpec = {
            if (targetState != null) {
                (slideInHorizontally(tween(240)) { it / 4 } + fadeIn(tween(220))) togetherWith
                    (slideOutHorizontally(tween(200)) { -it / 6 } + fadeOut(tween(180)))
            } else {
                (slideInHorizontally(tween(240)) { -it / 4 } + fadeIn(tween(220))) togetherWith
                    (slideOutHorizontally(tween(200)) { it / 6 } + fadeOut(tween(180)))
            }
        },
        label = "profile_menu_nav"
    ) { page ->
        if (page == null) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().background(p.page),
                contentPadding = PaddingValues(
                    top = statusTop + 12.dp,
                    bottom = 32.dp + LocalBottomBarPadding.current,
                    start = 20.dp,
                    end = 20.dp
                ),
                verticalArrangement = Arrangement.spacedBy(18.dp)
            ) {
                item(key = "title") {
                    Entrance(0) {
                        Text("Mon profil", fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = p.ink)
                    }
                }

                // ── Carte identité ──────────────────────────────────────────────
                item(key = "identity") {
                    Entrance(1) {
                        Surface(shape = RoundedCornerShape(26.dp), color = Brand, modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier.padding(20.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                Box(contentAlignment = Alignment.BottomEnd) {
                                    Box(
                                        modifier = Modifier
                                            .size(78.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.2f))
                                            .border(3.dp, Color.White, CircleShape)
                                            .bouncyClickable(pressedScale = 0.93f, role = Role.Button) { showPhotoSheet = true },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        AnimatedContent(
                                            targetState = avatar,
                                            transitionSpec = {
                                                (fadeIn(tween(260)) + scaleIn(initialScale = 0.85f)) togetherWith fadeOut(tween(160))
                                            },
                                            label = "avatar"
                                        ) { bmp ->
                                            if (bmp != null) {
                                                Image(bmp, null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                                            } else {
                                                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                                    Text(initials, color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }
                                    }
                                    Box(
                                        modifier = Modifier
                                            .size(26.dp)
                                            .clip(CircleShape)
                                            .background(Color.White),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(TablerIcons.Camera, null, tint = Brand, modifier = Modifier.size(14.dp))
                                    }
                                }
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.weight(1f)) {
                                    Text(fullName, color = Color.White, fontSize = 19.sp, fontWeight = FontWeight.Bold,
                                        maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(user?.email ?: user?.telephone ?: "", color = Color.White.copy(alpha = 0.8f),
                                        fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Box(
                                        Modifier.padding(top = 4.dp).clip(RoundedCornerShape(999.dp))
                                            .background(Color.White.copy(alpha = 0.22f))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(roleLabel, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }

                // ── Liste verticale de menus ────────────────────────────────────
                item(key = "menu_header") {
                    Entrance(2) { SectionTitle("Menus & Paramètres", p) }
                }
                item(key = "menu_list") {
                    Entrance(3) {
                        val themeSummary = when (themeMode) {
                            ThemeMode.LIGHT -> "Mode clair"
                            ThemeMode.DARK -> "Mode sombre"
                            ThemeMode.SYSTEM -> "Automatique (Système)"
                        }
                        val perfSummary = stats?.let {
                            "${it.total} commande(s) • ${(it.completionRate * 100).toInt()}% restituées"
                        } ?: "Statistiques et activité des 7 derniers jours"

                        Card(p) {
                            Column {
                                ActionRow(
                                    TablerIcons.TrendingUp,
                                    BrandText,
                                    "Mes performances",
                                    perfSummary,
                                    p
                                ) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = ProfileMenuPage.PERFORMANCES
                                }
                                Divider(p)
                                ActionRow(
                                    TablerIcons.Moon,
                                    BrandText,
                                    "Apparence",
                                    themeSummary,
                                    p
                                ) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = ProfileMenuPage.APPARENCE
                                }
                                Divider(p)
                                ActionRow(
                                    TablerIcons.Camera,
                                    BrandText,
                                    "Mon compte",
                                    "Photo de profil, réinitialisation PIN",
                                    p
                                ) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = ProfileMenuPage.COMPTE
                                }
                                Divider(p)
                                ActionRow(
                                    TablerIcons.ShieldCheck,
                                    Success,
                                    "Sécurité & Session",
                                    "Verrouillage auto, anti-capture, empreinte",
                                    p
                                ) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = ProfileMenuPage.SECURITE
                                }
                                Divider(p)
                                val permsSummary = buildList {
                                    add(if (notificationsGranted) "Notifications actives" else "Notifications à activer")
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                        add(if (canInstallPackages) "Mises à jour autorisées" else "Mises à jour à autoriser")
                                    }
                                }.joinToString(" • ")
                                ActionRow(
                                    TablerIcons.Key,
                                    BrandText,
                                    "Autorisations de l'appareil",
                                    permsSummary,
                                    p
                                ) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = ProfileMenuPage.AUTORISATIONS
                                }
                            }
                        }
                    }
                }

                item(key = "app_update") {
                    Entrance(4) {
                        Surface(
                            shape = RoundedCornerShape(22.dp),
                            color = p.card,
                            border = BorderStroke(1.dp, p.border),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(22.dp))
                                .bouncyClickable(pressedScale = 0.98f, role = Role.Button) {
                                    if (isCheckingUpdate) return@bouncyClickable
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    isCheckingUpdate = true
                                    updateStatusMessage = null
                                    scope.launch {
                                        when (val res = AppUpdateManager.checkForUpdate()) {
                                            is UpdateCheckResult.UpdateAvailable -> {
                                                availableUpdate = res.info
                                                updateDownloadError = null
                                                isDownloadingUpdate = false
                                                downloadProgress = 0
                                                updateStatusMessage = "Nouvelle version v${res.info.versionName} (#${res.info.versionCode}) disponible"
                                                isCheckingUpdate = false
                                            }
                                            is UpdateCheckResult.UpToDate -> {
                                                updateStatusMessage = "Application à jour (v${BuildConfig.VERSION_NAME} • #${BuildConfig.VERSION_CODE})"
                                                isCheckingUpdate = false
                                            }
                                            is UpdateCheckResult.Error -> {
                                                updateStatusMessage = res.message
                                                isCheckingUpdate = false
                                            }
                                        }
                                    }
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(BrandText.copy(alpha = 0.12f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (isCheckingUpdate) {
                                        androidx.compose.material3.CircularProgressIndicator(
                                            modifier = Modifier.size(18.dp),
                                            strokeWidth = 2.dp,
                                            color = BrandText
                                        )
                                    } else {
                                        Icon(
                                            imageVector = TablerIcons.Refresh,
                                            contentDescription = null,
                                            tint = BrandText,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                }
                                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = "Rechercher les mises à jour",
                                        color = p.ink,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = when {
                                            isCheckingUpdate -> "Vérification des mises à jour..."
                                            updateStatusMessage != null -> updateStatusMessage!!
                                            else -> "Version installée : v${BuildConfig.VERSION_NAME} (#${BuildConfig.VERSION_CODE})"
                                        },
                                        color = p.muted,
                                        fontSize = 12.sp
                                    )
                                }
                                Icon(
                                    imageVector = TablerIcons.ChevronRight,
                                    contentDescription = null,
                                    tint = p.muted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                item(key = "logout") {
                    Entrance(5) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(26.dp),
                                color = Warning.copy(alpha = 0.12f),
                                border = BorderStroke(1.dp, Warning.copy(alpha = 0.35f)),
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(26.dp))
                                    .bouncyClickable(role = Role.Button) {
                                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                        KlinUpRepository.lockCurrentSession()
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(TablerIcons.Lock, null, tint = Warning, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Verrouiller", color = Warning, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(26.dp),
                                color = Danger.copy(alpha = 0.1f),
                                border = BorderStroke(1.dp, Danger.copy(alpha = 0.3f)),
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(26.dp))
                                    .bouncyClickable(role = Role.Button) { showLogoutDialog = true }
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(TablerIcons.Logout, null, tint = Danger, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Déconnexion", color = Danger, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }
                    }
                }
                item(key = "version") {
                    Text("Laverie - App • Version ${BuildConfig.VERSION_NAME}", color = p.muted, fontSize = 11.sp,
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().background(p.page),
                contentPadding = PaddingValues(
                    top = statusTop + 10.dp,
                    bottom = 32.dp + LocalBottomBarPadding.current,
                    start = 20.dp,
                    end = 20.dp
                ),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item(key = "subpage_header") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = p.card,
                            border = BorderStroke(1.dp, p.border)
                        ) {
                            IconButton(
                                onClick = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    activeMenu = null
                                }
                            ) {
                                Icon(
                                    imageVector = TablerIcons.ArrowLeft,
                                    contentDescription = "Retour",
                                    tint = p.ink
                                )
                            }
                        }
                        Text(
                            text = page.title,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = p.ink
                        )
                    }
                }

                when (page) {
                    ProfileMenuPage.PERFORMANCES -> {
                        item(key = "perf") {
                            PerformanceCard(
                                stats = stats,
                                range = range,
                                onRange = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    range = it
                                },
                                p = p
                            )
                        }
                    }

                    ProfileMenuPage.APPARENCE -> {
                        item(key = "theme") {
                            val hideAmounts by AppPreferences.hideAmounts.collectAsState()
                            Card(p) {
                                Column {
                                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                        RowHeader(TablerIcons.Moon, BrandSoft, "Apparence", "Mode clair, sombre ou système", p)
                                        ThemeSelector(themeMode, p) {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            AppPreferences.setThemeMode(it)
                                        }
                                    }
                                    Divider(p)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .bouncyClickable(pressedScale = 0.98f, role = Role.Switch) {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                AppPreferences.setHideAmounts(!hideAmounts)
                                            }
                                            .padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(Modifier.weight(1f)) {
                                            RowHeader(
                                                if (hideAmounts) TablerIcons.EyeOff else TablerIcons.Eye,
                                                BrandText,
                                                "Affichage des montants",
                                                if (hideAmounts) "Montants masqués sur les cartes KPI" else "Montants affichés sur les cartes KPI",
                                                p
                                            )
                                        }
                                        Switch(
                                            checked = !hideAmounts,
                                            onCheckedChange = { show ->
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                AppPreferences.setHideAmounts(!show)
                                            },
                                            colors = SwitchDefaults.colors(
                                                checkedThumbColor = Color.White,
                                                checkedTrackColor = Brand
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }

                    ProfileMenuPage.COMPTE -> {
                        item(key = "account") {
                            Card(p) {
                                Column {
                                    ActionRow(
                                        TablerIcons.Camera,
                                        BrandText,
                                        "Photo de profil",
                                        if (avatar != null) "Modifier ou retirer votre photo" else "Ajouter une photo",
                                        p
                                    ) { showPhotoSheet = true }
                                    Divider(p)
                                    ActionRow(
                                        TablerIcons.Key,
                                        Warning,
                                        "Réinitialiser mon code PIN",
                                        if (pinRequested) "Demande envoyée à l'administrateur" else "Demander un nouveau code à l'administrateur",
                                        p
                                    ) { showPinDialog = true }
                                }
                            }
                        }
                    }

                    ProfileMenuPage.SECURITE -> {
                        item(key = "security") {
                            Card(p) {
                                Column {
                                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        RowHeader(
                                            TablerIcons.ShieldCheck,
                                            Success,
                                            "Verrouillage automatique",
                                            "Exiger le PIN après inactivité en arrière-plan",
                                            p
                                        )
                                        AutoLockSelector(autoLockTimeout, p) {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            SecurityManager.setAutoLockTimeout(it)
                                        }
                                    }
                                    Divider(p)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .bouncyClickable(pressedScale = 0.98f, role = Role.Switch) {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                SecurityManager.setScreenShieldEnabled(!screenShield)
                                            }
                                            .padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(Modifier.weight(1f)) {
                                            RowHeader(
                                                TablerIcons.ShieldCheck,
                                                BrandText,
                                                "Protection anti-capture",
                                                if (screenShield) "Captures d'écran & aperçu multitâche bloqués" else "Masquer l'écran dans le multitâche (FLAG_SECURE)",
                                                p
                                            )
                                        }
                                        Switch(
                                            checked = screenShield,
                                            onCheckedChange = {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                SecurityManager.setScreenShieldEnabled(it)
                                            },
                                            colors = SwitchDefaults.colors(
                                                checkedThumbColor = Color.White,
                                                checkedTrackColor = Brand
                                            )
                                        )
                                    }
                                    Divider(p)
                                    val toggleBiometric: (Boolean) -> Unit = { desired ->
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        if (!desired) {
                                            SecurityManager.setBiometricEnabled(false)
                                            biometricStatusMessage = null
                                        } else if (!fingerprintAvailable) {
                                            biometricStatusMessage = "Aucune empreinte digitale configurée sur cet appareil."
                                        } else {
                                            val activity = context as? androidx.fragment.app.FragmentActivity
                                            if (activity != null) {
                                                SecurityManager.showBiometricPrompt(
                                                    activity = activity,
                                                    title = "Activer l'empreinte digitale",
                                                    subtitle = "Confirmez votre empreinte pour l'utiliser comme alternative au code PIN",
                                                    negativeButtonText = "Annuler",
                                                    failureMessage = "Empreinte non reconnue. Réessayez.",
                                                    onSuccess = {
                                                        SecurityManager.setBiometricEnabled(true)
                                                        biometricStatusMessage = null
                                                    },
                                                    onError = { err ->
                                                        biometricStatusMessage = err
                                                    }
                                                )
                                            } else {
                                                SecurityManager.setBiometricEnabled(true)
                                            }
                                        }
                                    }
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .bouncyClickable(pressedScale = 0.98f, role = Role.Switch) {
                                                toggleBiometric(!biometricEnabled)
                                            }
                                            .padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(Modifier.weight(1f)) {
                                            RowHeader(
                                                TablerIcons.Fingerprint,
                                                BrandText,
                                                "Déverrouillage par empreinte",
                                                when {
                                                    biometricStatusMessage != null -> biometricStatusMessage!!
                                                    !fingerprintAvailable -> "Non disponible ou aucune empreinte enregistrée"
                                                    biometricEnabled -> "Activé en alternative au code PIN"
                                                    else -> "Utiliser votre empreinte digitale pour déverrouiller"
                                                },
                                                p
                                            )
                                        }
                                        Switch(
                                            checked = biometricEnabled,
                                            onCheckedChange = toggleBiometric,
                                            colors = SwitchDefaults.colors(
                                                checkedThumbColor = Color.White,
                                                checkedTrackColor = Brand
                                            )
                                        )
                                    }
                                    Divider(p)
                                    val toggleFaceUnlock: (Boolean) -> Unit = { desired ->
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        if (!desired) {
                                            SecurityManager.setFaceUnlockEnabled(false)
                                            faceStatusMessage = null
                                        } else if (!faceUnlockAvailable) {
                                            faceStatusMessage = if (SecurityManager.hasFaceHardware(context)) {
                                                "Aucune reconnaissance faciale configurée sur cet appareil."
                                            } else {
                                                "Reconnaissance faciale non prise en charge sur cet appareil."
                                            }
                                        } else {
                                            val activity = context as? androidx.fragment.app.FragmentActivity
                                            if (activity != null) {
                                                SecurityManager.showBiometricPrompt(
                                                    activity = activity,
                                                    title = "Activer le déverrouillage facial",
                                                    subtitle = "Confirmez votre identité pour utiliser la reconnaissance faciale comme alternative au code PIN",
                                                    negativeButtonText = "Annuler",
                                                    failureMessage = "Visage non reconnu. Réessayez.",
                                                    onSuccess = {
                                                        SecurityManager.setFaceUnlockEnabled(true)
                                                        faceStatusMessage = null
                                                    },
                                                    onError = { err ->
                                                        faceStatusMessage = err
                                                    }
                                                )
                                            } else {
                                                SecurityManager.setFaceUnlockEnabled(true)
                                            }
                                        }
                                    }
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .bouncyClickable(pressedScale = 0.98f, role = Role.Switch) {
                                                toggleFaceUnlock(!faceUnlockEnabled)
                                            }
                                            .padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(Modifier.weight(1f)) {
                                            RowHeader(
                                                TablerIcons.FaceId,
                                                BrandText,
                                                "Déverrouillage facial",
                                                when {
                                                    faceStatusMessage != null -> faceStatusMessage!!
                                                    !faceUnlockAvailable -> if (SecurityManager.hasFaceHardware(context)) {
                                                        "Non disponible ou aucun visage enregistré"
                                                    } else {
                                                        "Capteur facial non disponible sur cet appareil"
                                                    }
                                                    faceUnlockEnabled -> "Activé en alternative au code PIN"
                                                    else -> "Utiliser la reconnaissance faciale pour déverrouiller"
                                                },
                                                p
                                            )
                                        }
                                        Switch(
                                            checked = faceUnlockEnabled,
                                            onCheckedChange = toggleFaceUnlock,
                                            colors = SwitchDefaults.colors(
                                                checkedThumbColor = Color.White,
                                                checkedTrackColor = Brand
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }

                    ProfileMenuPage.AUTORISATIONS -> {
                        item(key = "permissions") {
                            val appColors = MaterialTheme.klinUpColors
                            Card(p) {
                                Column {
                                    // 1. Notifications (POST_NOTIFICATIONS)
                                    PermissionStatusRow(
                                        icon = TablerIcons.Bell,
                                        iconTint = if (notificationsGranted) Success else Warning,
                                        title = "Notifications",
                                        subtitle = if (notificationsGranted) {
                                            "Alertes commandes en temps réel autorisées"
                                        } else {
                                            "Appuyez pour autoriser les alertes sur cet appareil"
                                        },
                                        badgeText = if (notificationsGranted) "Autorisée" else "À activer",
                                        badgeBg = if (notificationsGranted) appColors.softGreenBg else appColors.softAmberBg,
                                        badgeColor = if (notificationsGranted) Success else Warning,
                                        p = p
                                    ) {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        if (!notificationsGranted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                            val activity = context as? Activity
                                            notifRequestHadRationale = activity != null &&
                                                ActivityCompat.shouldShowRequestPermissionRationale(
                                                    activity,
                                                    Manifest.permission.POST_NOTIFICATIONS
                                                )
                                            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                                        } else {
                                            openNotificationSettings()
                                        }
                                    }

                                    // 2. Installation des mises à jour (REQUEST_INSTALL_PACKAGES)
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                        Divider(p)
                                        PermissionStatusRow(
                                            icon = TablerIcons.Package,
                                            iconTint = if (canInstallPackages) Success else Warning,
                                            title = "Installation des mises à jour",
                                            subtitle = if (canInstallPackages) {
                                                "Installation directe des mises à jour autorisée"
                                            } else {
                                                "Appuyez pour autoriser l'installation des mises à jour"
                                            },
                                            badgeText = if (canInstallPackages) "Autorisée" else "À activer",
                                            badgeBg = if (canInstallPackages) appColors.softGreenBg else appColors.softAmberBg,
                                            badgeColor = if (canInstallPackages) Success else Warning,
                                            p = p
                                        ) {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            val intent = Intent(
                                                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                                Uri.parse("package:${context.packageName}")
                                            )
                                            runCatching { context.startActivity(intent) }
                                        }
                                    }

                                    // 3. Biométrie (Empreinte & Reconnaissance faciale)
                                    Divider(p)
                                    val anyBiometricEnabled = (biometricEnabled && fingerprintAvailable) ||
                                        (faceUnlockEnabled && faceUnlockAvailable)
                                    val availableModesLabel = when {
                                        fingerprintAvailable && faceUnlockAvailable -> "Empreinte & reconnaissance faciale prêtes"
                                        faceUnlockAvailable -> "Reconnaissance faciale prête"
                                        fingerprintAvailable -> "Capteur d'empreinte prêt"
                                        else -> "Appuyez pour configurer votre biométrie sur l'appareil"
                                    }
                                    PermissionStatusRow(
                                        icon = if (faceUnlockAvailable && !fingerprintAvailable) TablerIcons.FaceId else TablerIcons.Fingerprint,
                                        iconTint = if (biometricAvailable) BrandText else p.muted,
                                        title = "Biométrie (Empreinte / Facial)",
                                        subtitle = if (biometricAvailable) {
                                            if (anyBiometricEnabled) "Active pour le déverrouillage rapide" else "$availableModesLabel (gérer dans Sécurité)"
                                        } else {
                                            availableModesLabel
                                        },
                                        badgeText = if (biometricAvailable) "Prête" else "À configurer",
                                        badgeBg = if (biometricAvailable) appColors.softGreenBg else appColors.softAmberBg,
                                        badgeColor = if (biometricAvailable) Success else Warning,
                                        p = p
                                    ) {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        if (biometricAvailable) {
                                            activeMenu = ProfileMenuPage.SECURITE
                                        } else {
                                            val enrollIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                                Intent(Settings.ACTION_BIOMETRIC_ENROLL).apply {
                                                    putExtra(
                                                        Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED,
                                                        BiometricManager.Authenticators.BIOMETRIC_STRONG or
                                                            BiometricManager.Authenticators.BIOMETRIC_WEAK
                                                    )
                                                }
                                            } else {
                                                @Suppress("DEPRECATION")
                                                Intent(Settings.ACTION_FINGERPRINT_ENROLL)
                                            }
                                            runCatching { context.startActivity(enrollIntent) }
                                                .onFailure {
                                                    runCatching { context.startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS)) }
                                                }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Dialogues ───────────────────────────────────────────────────────────
    if (showPhotoSheet) {
        AlertDialog(
            onDismissRequest = { showPhotoSheet = false },
            containerColor = p.card,
            title = { Text("Photo de profil", color = p.ink, fontWeight = FontWeight.Bold) },
            text = { Text("Choisissez une photo depuis votre galerie. Elle est synchronisée avec votre compte KLIN UP.", color = p.muted) },
            confirmButton = {
                TextButton(onClick = {
                    showPhotoSheet = false
                    runCatching {
                        picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                    }.onFailure {
                        runCatching { fallbackPicker.launch("image/*") }
                    }
                }) { Text("Choisir une photo", color = BrandText, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                if (avatar != null) TextButton(onClick = {
                    showPhotoSheet = false
                    AppPreferences.removeAvatar(userId)
                    if (userId.isNotBlank()) {
                        scope.launch { KlinUpRepository.updateUserAvatar(userId, null) }
                    }
                }) { Text("Retirer", color = Danger) }
                else TextButton(onClick = { showPhotoSheet = false }) { Text("Annuler", color = p.muted) }
            }
        )
    }
    if (showPinDialog) {
        AlertDialog(
            onDismissRequest = { showPinDialog = false },
            containerColor = p.card,
            icon = { Icon(TablerIcons.Key, null, tint = Warning) },
            title = { Text("Réinitialiser le code PIN", color = p.ink, fontWeight = FontWeight.Bold) },
            text = { Text("Une demande de réinitialisation sera préparée pour l'administrateur. Il vous communiquera votre nouveau code PIN.", color = p.muted) },
            confirmButton = {
                TextButton(onClick = {
                    showPinDialog = false
                    val body = "Bonjour,\n\nJe souhaite réinitialiser mon code PIN.\n\nNom : $fullName\nRôle : $roleLabel\nIdentifiant : $userId\n\nMerci."
                    val intent = Intent(Intent.ACTION_SENDTO).apply {
                        data = Uri.parse("mailto:")
                        putExtra(Intent.EXTRA_SUBJECT, "Demande de réinitialisation du code PIN - $fullName")
                        putExtra(Intent.EXTRA_TEXT, body)
                    }
                    val chooser = Intent.createChooser(
                        Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "Demande de réinitialisation du code PIN - $fullName")
                            putExtra(Intent.EXTRA_TEXT, body)
                        }, "Envoyer la demande via"
                    )
                    runCatching {
                        if (intent.resolveActivity(context.packageManager) != null) context.startActivity(intent)
                        else context.startActivity(chooser)
                        pinRequested = true
                    }
                }) { Text("Envoyer la demande", color = BrandText, fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(onClick = { showPinDialog = false }) { Text("Annuler", color = p.muted) } }
        )
    }

    availableUpdate?.let { info ->
        AlertDialog(
            onDismissRequest = {
                if (isDownloadingUpdate) {
                    showCancelDownloadDialog = true
                } else if (!info.mandatory) {
                    availableUpdate = null
                    updateDownloadError = null
                }
            },
            containerColor = p.card,
            icon = { Icon(TablerIcons.Refresh, null, tint = BrandText) },
            title = {
                Text(
                    text = if (isDownloadingUpdate) "Téléchargement de la mise à jour" else "Mise à jour disponible",
                    color = p.ink,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = if (isDownloadingUpdate) {
                            "Téléchargement de la version v${info.versionName} (#${info.versionCode}) en cours…"
                        } else {
                            "Une nouvelle version (v${info.versionName} • build #${info.versionCode}) est disponible. Souhaitez-vous la télécharger et l'installer ?"
                        },
                        color = p.ink,
                        fontSize = 14.sp
                    )
                    if (info.releaseNotes.isNotBlank()) {
                        Text(
                            text = info.releaseNotes,
                            color = p.muted,
                            fontSize = 12.sp
                        )
                    }
                    if (isDownloadingUpdate) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            LinearProgressIndicator(
                                progress = { (downloadProgress / 100f).coerceIn(0f, 1f) },
                                modifier = Modifier.fillMaxWidth(),
                                color = Brand,
                                trackColor = p.chip
                            )
                            Text(
                                text = "Progression : $downloadProgress%",
                                color = p.muted,
                                fontSize = 12.sp
                            )
                        }
                    }
                    if (updateDownloadError != null) {
                        Text(
                            text = updateDownloadError!!,
                            color = Danger,
                            fontSize = 12.sp
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    enabled = !isDownloadingUpdate,
                    onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        isDownloadingUpdate = true
                        downloadProgress = 0
                        updateDownloadError = null
                        showCancelDownloadDialog = false
                        downloadJob = scope.launch {
                            try {
                                val res = AppUpdateManager.downloadApk(context, info.apkUrl) { pct ->
                                    downloadProgress = pct
                                }
                                isDownloadingUpdate = false
                                showCancelDownloadDialog = false
                                downloadJob = null
                                res.onSuccess { file ->
                                    val launched = AppUpdateManager.installApk(context, file)
                                    if (launched) {
                                        availableUpdate = null
                                        updateStatusMessage = "Installation lancée"
                                    } else {
                                        pendingInstallApk = file
                                        updateDownloadError = "Autorisez l'installation d'applications pour finaliser la mise à jour."
                                    }
                                }.onFailure { err ->
                                    updateDownloadError = err.message ?: "Échec du téléchargement de la mise à jour."
                                }
                            } catch (_: CancellationException) {
                                isDownloadingUpdate = false
                                downloadProgress = 0
                                showCancelDownloadDialog = false
                                downloadJob = null
                            }
                        }
                    }
                ) {
                    Text(
                        text = if (isDownloadingUpdate) "Téléchargement…" else "Mettre à jour",
                        color = if (isDownloadingUpdate) p.muted else BrandText,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = when {
                isDownloadingUpdate -> {
                    {
                        TextButton(onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showCancelDownloadDialog = true
                        }) {
                            Text("Annuler", color = Danger, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                !info.mandatory -> {
                    {
                        TextButton(onClick = {
                            availableUpdate = null
                            updateDownloadError = null
                        }) {
                            Text("Plus tard", color = p.muted)
                        }
                    }
                }
                else -> null
            }
        )
    }
    if (showCancelDownloadDialog && isDownloadingUpdate) {
        AlertDialog(
            onDismissRequest = { showCancelDownloadDialog = false },
            containerColor = p.card,
            title = {
                Text(
                    text = "Annuler le téléchargement ?",
                    color = p.ink,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "Le téléchargement de la mise à jour est en cours ($downloadProgress%). Voulez-vous vraiment l'annuler ?",
                    color = p.muted
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    downloadJob?.cancel()
                    downloadJob = null
                    isDownloadingUpdate = false
                    downloadProgress = 0
                    showCancelDownloadDialog = false
                    updateDownloadError = null
                    availableUpdate = null
                    updateStatusMessage = "Téléchargement annulé"
                }) {
                    Text("Oui, annuler", color = Danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    showCancelDownloadDialog = false
                }) {
                    Text("Continuer", color = BrandText, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = p.card,
            title = { Text("Se déconnecter ?", color = p.ink, fontWeight = FontWeight.Bold) },
            text = { Text("Vous devrez saisir à nouveau votre code PIN.", color = p.muted) },
            confirmButton = {
                TextButton(onClick = {
                    showLogoutDialog = false
                    KlinUpRepository.logout()
                    onLogout()
                }) { Text("Déconnexion", color = Danger, fontWeight = FontWeight.Bold) }
            },
            dismissButton = { TextButton(onClick = { showLogoutDialog = false }) { Text("Annuler", color = p.muted) } }
        )
    }
}

// ─── Stats ──────────────────────────────────────────────────────────────────
private fun computeStats(
    all: List<com.klinup.app.data.models.Order>,
    userId: String,
    fullName: String,
    range: PerfRange,
    zone: ZoneId
): PerfStats {
    val today = LocalDate.now(zone)
    val monday = today.with(DayOfWeek.MONDAY)
    val mine = all.filter { o ->
        (userId.isNotBlank() && o.createdById == userId) ||
            (o.createdById.isNullOrBlank() && o.createdByName?.equals(fullName, ignoreCase = true) == true)
    }.map { it to KlinUpRepository.parseInstant(it.createdAt)?.atZone(zone)?.toLocalDate() }

    val scoped = when (range) {
        PerfRange.WEEK -> mine.filter { (_, d) -> d != null && !d.isBefore(today.minusDays(6)) }
        PerfRange.MONTH -> mine.filter { (_, d) -> d != null && d.year == today.year && d.month == today.month }
        PerfRange.ALL -> mine
    }.map { it.first }

    val valid = scoped.filter { it.statut != "annule" }
    val delivered = scoped.count { it.statut == "restitue" }
    val cancelled = scoped.count { it.statut == "annule" }
    val revenue = valid.sumOf { it.prixTotal }
    val dayLabels = listOf("L", "M", "M", "J", "V", "S", "D")
    val bars = (6 downTo 0).map { back ->
        val d = today.minusDays(back.toLong())
        dayLabels[d.dayOfWeek.value - 1] to mine.count { (o, od) -> od == d && o.statut != "annule" }
    }
    return PerfStats(
        total = scoped.size,
        delivered = delivered,
        inProgress = scoped.count { !it.isCompletedOrCancelled },
        cancelled = cancelled,
        revenue = revenue,
        avgBasket = if (valid.isEmpty()) 0.0 else revenue / valid.size,
        today = mine.count { it.second == today },
        week = mine.count { (_, d) -> d != null && !d.isBefore(monday) },
        month = mine.count { (_, d) -> d != null && d.year == today.year && d.month == today.month },
        weekBars = bars,
        completionRate = if (valid.isEmpty()) 0f else delivered.toFloat() / valid.size
    )
}

// ─── Components ─────────────────────────────────────────────────────────────
@Composable
private fun Entrance(index: Int, content: @Composable () -> Unit) {
    var shown by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { delay(index * 45L); shown = true }
    val t by animateFloatAsState(
        if (shown) 1f else 0f,
        tween(420, easing = NavMotion.EmphasizedDecelerate), label = "entrance"
    )
    Box(Modifier.graphicsLayer { alpha = t; translationY = (1f - t) * 40f }) { content() }
}

@Composable
private fun SectionTitle(text: String, p: Palette) {
    Text(text.uppercase(), color = p.muted, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.8.sp)
}

@Composable
private fun Card(p: Palette, content: @Composable () -> Unit) {
    Surface(
        shape = RoundedCornerShape(26.dp), color = p.card,
        border = BorderStroke(1.dp, p.border), modifier = Modifier.fillMaxWidth()
    ) { content() }
}

@Composable
private fun Divider(p: Palette) {
    Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(1.dp).background(p.border))
}

@Composable
private fun PermissionStatusRow(
    icon: ImageVector,
    iconTint: Color,
    title: String,
    subtitle: String,
    badgeText: String,
    badgeBg: Color,
    badgeColor: Color,
    p: Palette,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .bouncyClickable(pressedScale = 0.985f, role = Role.Button, onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconBubble(icon, iconTint)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = p.ink, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(subtitle, color = p.muted, fontSize = 12.sp, lineHeight = 16.sp)
        }
        Spacer(Modifier.width(8.dp))
        Surface(
            shape = RoundedCornerShape(999.dp),
            color = badgeBg
        ) {
            Text(
                text = badgeText,
                color = badgeColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
private fun IconBubble(icon: ImageVector, tint: Color) {
    Box(
        Modifier.size(38.dp).clip(RoundedCornerShape(12.dp)).background(tint.copy(alpha = 0.14f)),
        contentAlignment = Alignment.Center
    ) { Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp)) }
}

@Composable
private fun RowHeader(icon: ImageVector, tint: Color, title: String, subtitle: String, p: Palette) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        IconBubble(icon, tint)
        Column {
            Text(title, color = p.ink, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(subtitle, color = p.muted, fontSize = 12.sp)
        }
    }
}

@Composable
private fun ActionRow(icon: ImageVector, tint: Color, title: String, subtitle: String, p: Palette, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().bouncyClickable(pressedScale = 0.98f, role = Role.Button, onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.weight(1f)) {
            AnimatedContent(subtitle, transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(120)) }, label = "sub") { s ->
                RowHeader(icon, tint, title, s, p)
            }
        }
        Icon(TablerIcons.ChevronRight, null, tint = p.muted)
    }
}

@Composable
private fun AutoLockSelector(selected: AutoLockTimeout, p: Palette, onSelect: (AutoLockTimeout) -> Unit) {
    val options = AutoLockTimeout.entries
    BoxWithConstraints(
        Modifier.fillMaxWidth().height(42.dp).clip(RoundedCornerShape(14.dp)).background(p.chip).padding(4.dp)
    ) {
        val w = maxWidth / options.size
        val offset by animateDpAsState(w * selected.ordinal, spring(dampingRatio = 0.8f, stiffness = 500f), label = "autolock_pill")
        Box(Modifier.offset(x = offset).width(w).fillMaxHeight().clip(RoundedCornerShape(11.dp)).background(Brand))
        Row(Modifier.fillMaxSize()) {
            options.forEach { opt ->
                val active = opt == selected
                val fg by animateColorAsState(if (active) Color.White else p.ink, tween(180), label = "al_fg")
                Box(
                    modifier = Modifier.weight(1f).fillMaxHeight().clip(RoundedCornerShape(11.dp))
                        .bouncyClickable(pressedScale = 0.95f, role = Role.RadioButton, showIndication = false) { onSelect(opt) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(opt.label, color = fg, fontSize = 12.sp, fontWeight = if (active) FontWeight.Bold else FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
private fun ThemeSelector(selected: ThemeMode, p: Palette, onSelect: (ThemeMode) -> Unit) {
    val modes = ThemeMode.entries
    BoxWithConstraints(
        Modifier.fillMaxWidth().height(46.dp).clip(RoundedCornerShape(14.dp)).background(p.chip).padding(4.dp)
    ) {
        val w = maxWidth / modes.size
        val offset by animateDpAsState(w * selected.ordinal, spring(dampingRatio = 0.8f, stiffness = 500f), label = "theme_pill")
        Box(Modifier.offset(x = offset).width(w).fillMaxHeight().clip(RoundedCornerShape(11.dp)).background(Brand))
        Row(Modifier.fillMaxSize()) {
            modes.forEach { mode ->
                val isSel = mode == selected
                val color by animateColorAsState(if (isSel) Color.White else p.ink, tween(200), label = "theme_txt")
                Row(
                    Modifier.weight(1f).fillMaxHeight().clip(RoundedCornerShape(11.dp))
                        .bouncyClickable(pressedScale = 0.95f, role = Role.RadioButton, showIndication = false) { onSelect(mode) },
                    horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        when (mode) {
                            ThemeMode.SYSTEM -> TablerIcons.DeviceDesktop
                            ThemeMode.LIGHT -> TablerIcons.Sun
                            ThemeMode.DARK -> TablerIcons.Moon
                        }, null, tint = color, modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(mode.label, color = color, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun PerformanceCard(stats: PerfStats?, range: PerfRange, onRange: (PerfRange) -> Unit, p: Palette) {
    Card(p) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Sélecteur de période (pilule unique coulissante, sans double sélection)
            BoxWithConstraints(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(p.chip)
                    .padding(4.dp)
            ) {
                val entries = PerfRange.entries
                val slotW = maxWidth / entries.size
                val selectedIdx = entries.indexOf(range).coerceAtLeast(0)
                val offset by animateDpAsState(
                    targetValue = slotW * selectedIdx,
                    animationSpec = spring(dampingRatio = 0.78f, stiffness = 460f),
                    label = "range_pill"
                )
                Box(
                    Modifier
                        .offset(x = offset)
                        .width(slotW)
                        .height(34.dp)
                        .clip(RoundedCornerShape(9.dp))
                        .background(p.card)
                )
                Row(
                    Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    entries.forEach { r ->
                        val sel = r == range
                        Box(
                            Modifier
                                .weight(1f)
                                .height(34.dp)
                                .clip(RoundedCornerShape(9.dp))
                                .bouncyClickable(pressedScale = 0.96f, role = Role.Tab, showIndication = false) { onRange(r) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = r.label,
                                color = if (sel) BrandText else p.muted,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            AnimatedVisibility(stats == null, enter = fadeIn(), exit = fadeOut() + shrinkVertically()) {
                Text("Calcul en cours…", color = p.muted, fontSize = 12.sp)
            }
            AnimatedVisibility(stats != null, enter = fadeIn(tween(300)) + expandVertically(tween(300, easing = NavMotion.EmphasizedDecelerate))) {
                val s = stats ?: return@AnimatedVisibility
                val hideAmounts by AppPreferences.hideAmounts.collectAsState()
                val perfHaptics = LocalHapticFeedback.current
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Chiffre principal + taux de traitement
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text("Chiffre d'affaires géré", color = p.muted, fontSize = 12.sp)
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(p.chip)
                                        .bouncyClickable(pressedScale = 0.92f, role = Role.Button) {
                                            perfHaptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            AppPreferences.toggleHideAmounts()
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (hideAmounts) TablerIcons.EyeOff else TablerIcons.Eye,
                                        contentDescription = if (hideAmounts) "Afficher les montants" else "Masquer les montants",
                                        tint = BrandText,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                            }
                            AnimatedContent(s.revenue, transitionSpec = {
                                (fadeIn(tween(220)) + scaleIn(initialScale = 0.92f)) togetherWith fadeOut(tween(120))
                            }, label = "rev") { v ->
                                Text(
                                    AppPreferences.maskAmount(KlinUpRepository.formatFcfa(v), hideAmounts),
                                    color = p.ink,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.ExtraBold
                                )
                            }
                            Text(
                                "Panier moyen : ${AppPreferences.maskAmount(KlinUpRepository.formatFcfa(s.avgBasket), hideAmounts)}",
                                color = p.muted,
                                fontSize = 12.sp
                            )
                        }
                        CompletionRing(s.completionRate, p)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(TablerIcons.ShoppingCart, BrandText, s.total.toString(), "Commandes", p, Modifier.weight(1f))
                        StatTile(TablerIcons.CircleCheck, Success, s.delivered.toString(), "Restituées", p, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(TablerIcons.Clock, Warning, s.inProgress.toString(), "En cours", p, Modifier.weight(1f))
                        StatTile(TablerIcons.Trash, Danger, s.cancelled.toString(), "Annulées", p, Modifier.weight(1f))
                    }

                    // Activité sur 7 jours
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(TablerIcons.TrendingUp, null, tint = p.ink, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Activité des 7 derniers jours", color = p.ink, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                        WeekBars(s.weekBars, p)
                        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                            MiniCounter("Aujourd'hui", s.today, p)
                            MiniCounter("Semaine", s.week, p)
                            MiniCounter("Mois", s.month, p)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CompletionRing(rate: Float, p: Palette) {
    val animated by animateFloatAsState(rate, tween(700, easing = NavMotion.EmphasizedDecelerate), label = "ring")
    val successColor = Success
    Box(Modifier.size(72.dp), contentAlignment = Alignment.Center) {
        androidx.compose.foundation.Canvas(Modifier.fillMaxSize()) {
            val stroke = androidx.compose.ui.graphics.drawscope.Stroke(width = 8.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round)
            drawArc(p.chip, 0f, 360f, false, style = stroke)
            drawArc(successColor, -90f, 360f * animated, false, style = stroke)
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${(animated * 100).toInt()}%", color = p.ink, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Text("traitées", color = p.muted, fontSize = 9.sp)
        }
    }
}

@Composable
private fun StatTile(icon: ImageVector, tint: Color, value: String, label: String, p: Palette, modifier: Modifier) {
    Surface(shape = RoundedCornerShape(16.dp), color = tint.copy(alpha = 0.08f), modifier = modifier) {
        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(20.dp))
            Column {
                AnimatedContent(value, transitionSpec = {
                    (fadeIn(tween(200)) + androidx.compose.animation.slideInVertically { it / 2 }) togetherWith
                        (fadeOut(tween(120)) + androidx.compose.animation.slideOutVertically { -it / 2 })
                }, label = "tile") { v -> Text(v, color = p.ink, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp) }
                Text(label, color = p.muted, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun WeekBars(bars: List<Pair<String, Int>>, p: Palette) {
    val max = (bars.maxOfOrNull { it.second } ?: 0).coerceAtLeast(1)
    Row(Modifier.fillMaxWidth().height(90.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
        bars.forEachIndexed { i, (label, count) ->
            val target = if (count == 0) 0.05f else count.toFloat() / max
            val f by animateFloatAsState(target, tween(500, delayMillis = i * 30, easing = NavMotion.EmphasizedDecelerate), label = "wb$i")
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(Modifier.width(18.dp).height(66.dp).clip(RoundedCornerShape(8.dp)).background(p.chip), contentAlignment = Alignment.BottomCenter) {
                    Box(
                        Modifier.fillMaxSize().graphicsLayer { scaleY = f; transformOrigin = TransformOrigin(0.5f, 1f) }
                            .clip(RoundedCornerShape(8.dp)).background(if (i == bars.lastIndex) BrandText else BrandSoft.copy(alpha = 0.65f))
                    )
                }
                Text(label, color = p.muted, fontSize = 11.sp, fontWeight = if (i == bars.lastIndex) FontWeight.Bold else FontWeight.Medium)
            }
        }
    }
}

@Composable
private fun MiniCounter(label: String, value: Int, p: Palette) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value.toString(), color = p.ink, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Text(label, color = p.muted, fontSize = 11.sp)
    }
}
