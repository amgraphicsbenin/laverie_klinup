package com.klinup.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

val KlinUpPrimary = Color(0xFF2600F5)
val KlinUpPrimaryDark = Color(0xFF1D00C9)
val KlinUpSecondary = Color(0xFF5B46F6)
val KlinUpSuccess = Color(0xFF64E33A)
val KlinUpWarning = Color(0xFFF7CE46)
val KlinUpDanger = Color(0xFFEF4444)

// Light Palette
val LightBackground = Color(0xFFFFFFFF)
val LightSurface = Color(0xFFFFFFFF)
val LightOnSurface = Color(0xFF0F172A)
val LightBorder = Color(0xFFE2E8F0)

// Pure Black OLED Dark Palette
val DarkBackground = Color(0xFF000000)
val DarkSurface = Color(0xFF0B0C10)
val DarkOnSurface = Color(0xFFF8FAFC)
val DarkBorder = Color(0xFF222530)

@Immutable
data class KlinUpColors(
    val isDark: Boolean,
    val brandBlue: Color,
    val brandAccent: Color,       // Cobalt for text/icons legible on both white & pure black
    val brandText: Color,         // High-contrast blue text on cards
    val pageBg: Color,            // Pure white (#FFFFFF / #F6F8FC) or Pure black (#000000)
    val altPageBg: Color,         // Secondary page canvas (Pure black #000000 in dark)
    val cardBg: Color,
    val cardSubtleBg: Color,
    val chipBg: Color,
    val border: Color,
    val innerBorder: Color,
    val divider: Color,
    val inkPrimary: Color,
    val inkSecondary: Color,
    val inkMuted: Color,
    val placeholder: Color,
    val trackBg: Color,
    val avatarBg: Color,
    val avatarIcon: Color,
    val softBlueBg: Color,
    val softBlueBorder: Color,
    val softRedBg: Color,
    val softRedBorder: Color,
    val redText: Color,
    val softGreenBg: Color,
    val greenText: Color,
    val softAmberBg: Color,
    val amberText: Color,
    val softSkyBg: Color,
    val softSkyBorder: Color,
    val skyText: Color,
    val navBarBg: Color,
    val navBarBorder: Color
)

val LightKlinUpColors = KlinUpColors(
    isDark = false,
    brandBlue = Color(0xFF2600F5),
    brandAccent = Color(0xFF0D2FE8),
    brandText = Color(0xFF0D2FE8),
    pageBg = Color(0xFFFFFFFF),
    altPageBg = Color(0xFFF6F8FC),
    cardBg = Color(0xFFFFFFFF),
    cardSubtleBg = Color(0xFFF8FAFC),
    chipBg = Color(0xFFF1F5F9),
    border = Color(0xFFE5E7EB),
    innerBorder = Color(0xFFE2E8F0),
    divider = Color(0xFFF1F5F9),
    inkPrimary = Color(0xFF0F172A),
    inkSecondary = Color(0xFF475569),
    inkMuted = Color(0xFF64748B),
    placeholder = Color(0xFF94A3B8),
    trackBg = Color(0xFFE0E1E6),
    avatarBg = Color(0xFFDCDDE2),
    avatarIcon = Color(0xFF7A7D85),
    softBlueBg = Color(0xFFEEF2FF),
    softBlueBorder = Color(0xFFC7D2FE),
    softRedBg = Color(0xFFFEF2F2),
    softRedBorder = Color(0xFFFECACA),
    redText = Color(0xFFDC2626),
    softGreenBg = Color(0xFFDCFCE7),
    greenText = Color(0xFF16A34A),
    softAmberBg = Color(0xFFFEF3C7),
    amberText = Color(0xFFD97706),
    softSkyBg = Color(0xFFE0F2FE),
    softSkyBorder = Color(0xFFBAE6FD),
    skyText = Color(0xFF0284C7),
    navBarBg = Color(0xFF2600F5),
    navBarBorder = Color.Transparent
)

val DarkKlinUpColors = KlinUpColors(
    isDark = true,
    brandBlue = Color(0xFF2600F5),
    brandAccent = Color(0xFFF8FAFC),
    brandText = Color(0xFFF8FAFC),
    pageBg = Color(0xFF000000),
    altPageBg = Color(0xFF000000),
    cardBg = Color(0xFF0B0C10),
    cardSubtleBg = Color(0xFF12141C),
    chipBg = Color(0xFF161923),
    border = Color(0xFF222530),
    innerBorder = Color(0xFF262A36),
    divider = Color(0xFF1B1E28),
    inkPrimary = Color(0xFFF8FAFC),
    inkSecondary = Color(0xFFCBD5E1),
    inkMuted = Color(0xFF94A3B8),
    placeholder = Color(0xFF64748B),
    trackBg = Color(0xFF1E222E),
    avatarBg = Color(0xFF181B24),
    avatarIcon = Color(0xFF94A3B8),
    softBlueBg = Color(0xFF131A38),
    softBlueBorder = Color(0xFF283975),
    softRedBg = Color(0xFF2A1014),
    softRedBorder = Color(0xFF5C1D24),
    redText = Color(0xFFF87171),
    softGreenBg = Color(0xFF0E2919),
    greenText = Color(0xFF4ADE80),
    softAmberBg = Color(0xFF29200A),
    amberText = Color(0xFFFBBF24),
    softSkyBg = Color(0xFF0E2236),
    softSkyBorder = Color(0xFF1E4970),
    skyText = Color(0xFF38BDF8),
    navBarBg = Color(0xFF2600F5),
    navBarBorder = Color.Transparent
)
