package com.klinup.app.ui.screens.splash

import android.app.Activity
import androidx.compose.animation.core.Animatable
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
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
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
import kotlinx.coroutines.launch

private val SplashBg = Color(0xFF0A0B0F)
private val LogoBlueDeep = Color(0xFF1A00B8)
private val LogoBluePrimary = Color(0xFF2600F5)
private val LogoBlueCobalt = Color(0xFF0D2FE8)
private val LogoBlueBright = Color(0xFF4C6FFF)
private val LogoBlueLight = Color(0xFF93B4FF)

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val view = LocalView.current
    val isDarkTheme = MaterialTheme.klinUpColors.isDark
    DisposableEffect(view, isDarkTheme) {
        val window = (view.context as? Activity)?.window
        val controller = window?.let { WindowCompat.getInsetsController(it, view) }
        controller?.isAppearanceLightStatusBars = false
        controller?.isAppearanceLightNavigationBars = false
        onDispose {
            controller?.isAppearanceLightStatusBars = !isDarkTheme
            controller?.isAppearanceLightNavigationBars = !isDarkTheme
        }
    }

    val ribbonProgress = remember { Animatable(0f) }
    var textVisible by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "splash_loop")
    val pulseFlow by infiniteTransition.animateFloat(
        initialValue = -0.25f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "splash_ribbon_flow"
    )
    val glowPulse by infiniteTransition.animateFloat(
        initialValue = 0.16f,
        targetValue = 0.34f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "splash_glow_pulse"
    )

    val textAlpha by animateFloatAsState(
        targetValue = if (textVisible) 1f else 0f,
        animationSpec = tween(durationMillis = 520, easing = FastOutSlowInEasing),
        label = "splash_text_alpha"
    )
    val textOffsetY by animateFloatAsState(
        targetValue = if (textVisible) 0f else 18f,
        animationSpec = tween(durationMillis = 520, easing = FastOutSlowInEasing),
        label = "splash_text_offset"
    )

    LaunchedEffect(Unit) {
        textVisible = true
        launch {
            ribbonProgress.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing)
            )
        }
        delay(5000L)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SplashBg)
    ) {
        // Halo ambiant pulsant dans la teinte bleue du logo KLIN UP
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        LogoBluePrimary.copy(alpha = glowPulse),
                        LogoBlueCobalt.copy(alpha = glowPulse * 0.35f),
                        Color.Transparent
                    ),
                    center = Offset(size.width * 0.56f, size.height * 0.40f),
                    radius = size.width * 0.78f
                ),
                center = Offset(size.width * 0.56f, size.height * 0.40f),
                radius = size.width * 0.78f
            )
        }

        // Ruban calligraphique animé en boucle aux couleurs bleues du logo KLIN UP
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            val fullPath = Path().apply {
                moveTo(-0.08f * w, 0.62f * h)
                cubicTo(
                    0.18f * w, 0.56f * h,
                    0.34f * w, 0.47f * h,
                    0.31f * w, 0.40f * h
                )
                cubicTo(
                    0.29f * w, 0.34f * h,
                    0.16f * w, 0.35f * h,
                    0.17f * w, 0.45f * h
                )
                cubicTo(
                    0.19f * w, 0.59f * h,
                    0.66f * w, 0.56f * h,
                    0.71f * w, 0.36f * h
                )
                cubicTo(
                    0.75f * w, 0.21f * h,
                    0.44f * w, 0.19f * h,
                    0.42f * w, 0.33f * h
                )
                cubicTo(
                    0.40f * w, 0.48f * h,
                    0.72f * w, 0.49f * h,
                    1.08f * w, 0.34f * h
                )
            }

            val measure = PathMeasure()
            measure.setPath(fullPath, false)
            val totalLen = measure.length
            val drawnLen = totalLen * ribbonProgress.value

            val drawnPath = Path()
            measure.getSegment(0f, drawnLen, drawnPath, true)

            val ribbonBrush = Brush.linearGradient(
                colorStops = arrayOf(
                    0.00f to LogoBlueDeep,
                    0.25f to LogoBluePrimary,
                    0.55f to LogoBlueCobalt,
                    0.82f to LogoBlueBright,
                    1.00f to LogoBlueLight
                ),
                start = Offset(0f, 0.62f * h),
                end = Offset(w, 0.32f * h)
            )

            val strokeWidth = w * 0.082f

            // Lueur bleue douce sous le ruban
            drawPath(
                path = drawnPath,
                brush = ribbonBrush,
                alpha = glowPulse,
                style = Stroke(
                    width = strokeWidth * 1.68f,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )
            )

            // Ruban principal bleu KLIN UP
            drawPath(
                path = drawnPath,
                brush = ribbonBrush,
                style = Stroke(
                    width = strokeWidth,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )
            )

            // Onde lumineuse continue en boucle le long de la corde
            if (drawnLen > 1f) {
                val segStart = (pulseFlow * drawnLen).coerceIn(0f, drawnLen)
                val segEnd = ((pulseFlow + 0.24f) * drawnLen).coerceIn(0f, drawnLen)
                if (segEnd > segStart + 2f) {
                    val pulsePath = Path()
                    measure.getSegment(segStart, segEnd, pulsePath, true)
                    drawPath(
                        path = pulsePath,
                        brush = Brush.linearGradient(
                            colors = listOf(
                                LogoBlueBright.copy(alpha = 0f),
                                LogoBlueLight.copy(alpha = 0.55f),
                                Color.White.copy(alpha = 0.65f),
                                LogoBlueLight.copy(alpha = 0.55f),
                                LogoBlueBright.copy(alpha = 0f)
                            ),
                            start = Offset(0f, 0.62f * h),
                            end = Offset(w, 0.32f * h)
                        ),
                        style = Stroke(
                            width = strokeWidth * 0.72f,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                    )
                }
            }
        }

        // Signature marque en pied d'écran : Logo blanc agrandi au-dessus de Pressing Pro
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 38.dp)
                .graphicsLayer {
                    alpha = textAlpha
                    translationY = textOffsetY
                },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.klinup_logo_brand),
                contentDescription = "Logo Pressing Pro",
                contentScale = ContentScale.Fit,
                colorFilter = ColorFilter.tint(Color.White),
                modifier = Modifier.size(48.dp)
            )
            Text(
                text = "Pressing Pro",
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.8.sp,
                color = Color.White
            )
        }
    }
}
