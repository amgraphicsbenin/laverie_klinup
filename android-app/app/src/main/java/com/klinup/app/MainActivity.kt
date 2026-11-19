package com.klinup.app

import android.Manifest
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.fragment.app.FragmentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.klinup.app.ui.components.LiveTrackingHost
import com.klinup.app.ui.components.LiveTrackingOverlay
import com.klinup.app.data.local.AppPreferences
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.data.local.NetworkMonitor
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.local.ThemeMode
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.navigation.AppNavigation
import com.klinup.app.ui.theme.KlinUpTheme

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            splashScreen.setOnExitAnimationListener { splashView ->
                splashView.remove()
            }
        }
        NetworkMonitor.init(applicationContext)
        AppPreferences.init(applicationContext)
        SecurityManager.init(applicationContext)
        KlinUpNotificationManager.init(applicationContext)
        KlinUpRepository.restoreSessionIfAvailable()
        KlinUpNotificationManager.handleIncomingOrderIntent(
            intent?.getStringExtra(KlinUpNotificationManager.EXTRA_ORDER_ID)
        )
        enableEdgeToEdge()
        setContent {
            val themeMode by AppPreferences.themeMode.collectAsState()
            val screenShield by SecurityManager.screenShieldEnabled.collectAsState()
            val pendingTracking by KlinUpRepository.pendingTrackingPermissions.collectAsState()

            val locationPermissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestMultiplePermissions()
            ) { grants ->
                val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                    grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
                if (granted) {
                    KlinUpRepository.onLocationPermissionGranted()
                } else {
                    KlinUpRepository.dismissPendingTrackingPermissions()
                    NetworkMonitor.showToast("Autorisez la localisation pour activer le suivi GPS en direct.")
                }
            }

            LaunchedEffect(pendingTracking) {
                if (pendingTracking.isNotEmpty()) {
                    locationPermissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                }
            }

            LaunchedEffect(screenShield) {
                if (screenShield) {
                    window.setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    )
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                }
            }

            val dark = when (themeMode) {
                ThemeMode.SYSTEM -> isSystemInDarkTheme()
                ThemeMode.LIGHT -> false
                ThemeMode.DARK -> true
            }
            KlinUpTheme(darkTheme = dark) {
                val liveRequest by LiveTrackingHost.activeRequest.collectAsState()
                Box(modifier = Modifier.fillMaxSize()) {
                    AppNavigation()
                    liveRequest?.let { req ->
                        LiveTrackingOverlay(
                            initialOrderId = req.initialOrderId,
                            onDismiss = {
                                LiveTrackingHost.close()
                                req.onDismiss()
                            }
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        KlinUpNotificationManager.handleIncomingOrderIntent(
            intent.getStringExtra(KlinUpNotificationManager.EXTRA_ORDER_ID)
        )
    }

    override fun onStart() {
        super.onStart()
        NetworkMonitor.recheck()
        val currentUser = KlinUpRepository.currentUser.value
        if (currentUser != null && SecurityManager.checkAndApplyAutoLock(currentUser)) {
            KlinUpRepository.lockCurrentSession()
        }
    }

    override fun onResume() {
        super.onResume()
        NetworkMonitor.recheck()
    }

    override fun onStop() {
        super.onStop()
        if (KlinUpRepository.currentUser.value != null) {
            SecurityManager.onAppBackgrounded()
        }
    }
}
