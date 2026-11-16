package com.klinup.app

import android.content.Intent
import android.os.Bundle
import android.view.WindowManager
import androidx.fragment.app.FragmentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.klinup.app.data.local.AppPreferences
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.local.ThemeMode
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.navigation.AppNavigation
import com.klinup.app.ui.theme.KlinUpTheme

class MainActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
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
                AppNavigation()
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
        val currentUser = KlinUpRepository.currentUser.value
        if (currentUser != null && SecurityManager.checkAndApplyAutoLock(currentUser)) {
            KlinUpRepository.lockCurrentSession()
        }
    }

    override fun onStop() {
        super.onStop()
        if (KlinUpRepository.currentUser.value != null) {
            SecurityManager.onAppBackgrounded()
        }
    }
}
