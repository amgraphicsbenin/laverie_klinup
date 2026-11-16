package com.klinup.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

val LocalKlinUpColors = staticCompositionLocalOf { LightKlinUpColors }

val MaterialTheme.klinUpColors: KlinUpColors
    @Composable
    @ReadOnlyComposable
    get() = LocalKlinUpColors.current

private val DarkColorScheme = darkColorScheme(
    primary = KlinUpPrimary,
    secondary = KlinUpSecondary,
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = Color(0xFF161923),
    outline = DarkBorder,
    onPrimary = Color.White,
    onBackground = DarkOnSurface,
    onSurface = DarkOnSurface,
    onSurfaceVariant = Color(0xFF94A3B8),
    error = KlinUpDanger
)

private val LightColorScheme = lightColorScheme(
    primary = KlinUpPrimary,
    secondary = KlinUpSecondary,
    background = LightBackground,
    surface = LightSurface,
    surfaceVariant = Color(0xFFF1F5F9),
    outline = LightBorder,
    onPrimary = Color.White,
    onBackground = LightOnSurface,
    onSurface = LightOnSurface,
    onSurfaceVariant = Color(0xFF64748B),
    error = KlinUpDanger
)

@Composable
fun KlinUpTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val appColors = if (darkTheme) DarkKlinUpColors else LightKlinUpColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !darkTheme
            controller.isAppearanceLightNavigationBars = !darkTheme
            window.navigationBarColor = appColors.navBarBg.toArgb()
            window.decorView.setBackgroundColor(appColors.pageBg.toArgb())
        }
    }

    CompositionLocalProvider(LocalKlinUpColors provides appColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}
