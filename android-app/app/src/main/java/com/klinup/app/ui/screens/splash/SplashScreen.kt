package com.klinup.app.ui.screens.splash

import android.app.Activity
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat
import com.klinup.app.R
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.delay
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

private val SkyDeep = Color(0xFF72B5F9)
private val SkyMid = Color(0xFF9ACDFD)
private val SkySoft = Color(0xFFC8E4FF)
private val SkyIce = Color(0xFFEAF4FF)
private val PureWhite = Color(0xFFFFFFFF)
private val BrandBlue = Color(0xFF0D2FE8)
private val InkDark = Color(0xFF0F172A)
private val InkMuted = Color(0xFF475569)

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val view = LocalView.current
    val isDarkTheme = MaterialTheme.klinUpColors.isDark
    DisposableEffect(view, isDarkTheme) {
        val window = (view.context as? Activity)?.window
        val controller = window?.let { WindowCompat.getInsetsController(it, view) }
        controller?.isAppearanceLightStatusBars = true
        controller?.isAppearanceLightNavigationBars = true
        onDispose {
            controller?.isAppearanceLightStatusBars = !isDarkTheme
            controller?.isAppearanceLightNavigationBars = !isDarkTheme
        }
    }

    var contentVisible by remember { mutableStateOf(false) }

    // Plusieurs phases continues à vitesses différentes pour un mouvement organique dans tous les sens
    val infiniteTransition = rememberInfiniteTransition(label = "splash_mesh_gradient")
    val phaseA by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2.0 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "mesh_phase_a"
    )
    val phaseB by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2.0 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 7400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "mesh_phase_b"
    )
    val phaseC by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2.0 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 6300, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "mesh_phase_c"
    )

    val logoAlpha by animateFloatAsState(
        targetValue = if (contentVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 520, easing = FastOutSlowInEasing),
        label = "splash_logo_alpha"
    )
    val logoScale by animateFloatAsState(
        targetValue = if (contentVisible) 1f else 0.90f,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "splash_logo_scale"
    )
    val logoOffsetY by animateFloatAsState(
        targetValue = if (contentVisible) 0f else 18f,
        animationSpec = tween(durationMillis = 560, easing = FastOutSlowInEasing),
        label = "splash_logo_offset"
    )

    LaunchedEffect(Unit) {
        contentVisible = true
        delay(5000L)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PureWhite)
    ) {
        // Fond dégradé atmosphérique bleu ciel -> blanc en mouvement doux dans toutes les directions
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            val sinA = sin(phaseA.toDouble()).toFloat()
            val cosA = cos(phaseA.toDouble()).toFloat()
            val sinB = sin(phaseB.toDouble()).toFloat()
            val cosB = cos(phaseB.toDouble()).toFloat()
            val sinC = sin(phaseC.toDouble()).toFloat()
            val cosC = cos(phaseC.toDouble()).toFloat()

            // 1. Dégradé linéaire de base qui pivote et ondule doucement
            drawRect(
                brush = Brush.linearGradient(
                    colorStops = arrayOf(
                        0.00f to SkyDeep,
                        0.32f to SkyMid,
                        0.60f to SkyIce,
                        0.82f to PureWhite,
                        1.00f to PureWhite
                    ),
                    start = Offset(
                        x = w * (0.28f + 0.24f * cosA),
                        y = h * (-0.05f + 0.08f * sinB)
                    ),
                    end = Offset(
                        x = w * (0.72f + 0.22f * sinC),
                        y = h * (0.86f + 0.10f * cosA)
                    )
                )
            )

            // 2. Nappe bleu ciel principale (mouvement circulaire haut-gauche / centre)
            val blob1Center = Offset(
                x = w * (0.22f + 0.30f * sinA),
                y = h * (0.14f + 0.16f * cosB)
            )
            val blob1Radius = w * (1.15f + 0.12f * sinC)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        SkyDeep.copy(alpha = 0.85f),
                        SkyMid.copy(alpha = 0.52f),
                        Color.Transparent
                    ),
                    center = blob1Center,
                    radius = blob1Radius
                ),
                center = blob1Center,
                radius = blob1Radius
            )

            // 3. Nappe bleu azur secondaire (mouvement croisé haut-droite / diagonale)
            val blob2Center = Offset(
                x = w * (0.78f + 0.26f * cosB),
                y = h * (0.22f + 0.18f * sinA)
            )
            val blob2Radius = w * (1.05f + 0.10f * cosC)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        SkyMid.copy(alpha = 0.78f),
                        SkySoft.copy(alpha = 0.45f),
                        Color.Transparent
                    ),
                    center = blob2Center,
                    radius = blob2Radius
                ),
                center = blob2Center,
                radius = blob2Radius
            )

            // 4. Voile bleu glacé intermédiaire (flotte latéralement et verticalement)
            val blob3Center = Offset(
                x = w * (0.48f + 0.34f * sinC),
                y = h * (0.44f + 0.14f * cosA)
            )
            val blob3Radius = w * (0.98f + 0.10f * sinB)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        SkySoft.copy(alpha = 0.62f),
                        SkyIce.copy(alpha = 0.36f),
                        Color.Transparent
                    ),
                    center = blob3Center,
                    radius = blob3Radius
                ),
                center = blob3Center,
                radius = blob3Radius
            )

            // 5. Halo blanc lumineux en bas (respiration douce qui garde le bas épuré)
            val blob4Center = Offset(
                x = w * (0.50f + 0.22f * cosC),
                y = h * (0.88f + 0.08f * sinB)
            )
            val blob4Radius = w * 1.25f
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        PureWhite,
                        PureWhite.copy(alpha = 0.92f),
                        Color.Transparent
                    ),
                    center = blob4Center,
                    radius = blob4Radius
                ),
                center = blob4Center,
                radius = blob4Radius
            )
        }

        // Logo central & signature marque Pressing Pro
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .graphicsLayer {
                    alpha = logoAlpha
                    scaleX = logoScale
                    scaleY = logoScale
                    translationY = logoOffsetY
                },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.klinup_logo_brand),
                contentDescription = "Logo Pressing Pro",
                contentScale = ContentScale.Fit,
                colorFilter = ColorFilter.tint(BrandBlue),
                modifier = Modifier.size(74.dp)
            )
            Text(
                text = "Pressing Pro",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.6.sp,
                color = InkDark
            )
        }

        // Spinner de chargement bleu en pied d'écran
        CircularProgressIndicator(
            color = BrandBlue,
            trackColor = SkySoft.copy(alpha = 0.55f),
            strokeWidth = 3.dp,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 38.dp)
                .size(26.dp)
                .graphicsLayer {
                    alpha = logoAlpha
                }
        )
    }
}
