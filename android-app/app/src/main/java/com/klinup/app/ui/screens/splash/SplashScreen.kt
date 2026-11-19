package com.klinup.app.ui.screens.splash

import android.app.Activity
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
import kotlinx.coroutines.delay

private val SplashBg = Color(0xFF0A0B0F)
private val RibbonPurple = Color(0xFF5B46F6)
private val RibbonCobalt = Color(0xFF2600F5)
private val RibbonSky = Color(0xFF38BDF8)
private val RibbonCyan = Color(0xFF67E8F9)
private val RibbonMint = Color(0xFF64E33A)

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val view = LocalView.current
    SideEffect {
        val window = (view.context as? Activity)?.window ?: return@SideEffect
        val controller = WindowCompat.getInsetsController(window, view)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
    }

    val ribbonProgress = remember { Animatable(0f) }
    var textVisible by remember { mutableStateOf(false) }

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
        ribbonProgress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 900, easing = FastOutSlowInEasing)
        )
        delay(550L)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SplashBg)
    ) {
        // Halo ambiant discret aux couleurs KLIN UP
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        RibbonCobalt.copy(alpha = 0.22f),
                        RibbonSky.copy(alpha = 0.06f),
                        Color.Transparent
                    ),
                    center = Offset(size.width * 0.56f, size.height * 0.40f),
                    radius = size.width * 0.75f
                ),
                center = Offset(size.width * 0.56f, size.height * 0.40f),
                radius = size.width * 0.75f
            )
        }

        // Ruban calligraphique animé inspiré du splash Studio + identité KLIN UP
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            val fullPath = Path().apply {
                moveTo(-0.08f * w, 0.62f * h)
                // Montée vers la première boucle (gauche)
                cubicTo(
                    0.18f * w, 0.56f * h,
                    0.34f * w, 0.47f * h,
                    0.31f * w, 0.40f * h
                )
                // Sommet et descente de la petite boucle gauche
                cubicTo(
                    0.29f * w, 0.34f * h,
                    0.16f * w, 0.35f * h,
                    0.17f * w, 0.45f * h
                )
                // Croisement bas vers la grande boucle droite
                cubicTo(
                    0.19f * w, 0.59f * h,
                    0.66f * w, 0.56f * h,
                    0.71f * w, 0.36f * h
                )
                // Sommet et courbe de la grande boucle droite
                cubicTo(
                    0.75f * w, 0.21f * h,
                    0.44f * w, 0.19f * h,
                    0.42f * w, 0.33f * h
                )
                // Sortie fluide vers le bord droit
                cubicTo(
                    0.40f * w, 0.48f * h,
                    0.72f * w, 0.49f * h,
                    1.08f * w, 0.34f * h
                )
            }

            val measure = PathMeasure()
            measure.setPath(fullPath, false)
            val drawnPath = Path()
            measure.getSegment(0f, measure.length * ribbonProgress.value, drawnPath, true)

            val ribbonBrush = Brush.linearGradient(
                colorStops = arrayOf(
                    0.00f to RibbonCobalt,
                    0.22f to RibbonPurple,
                    0.48f to RibbonSky,
                    0.76f to RibbonCyan,
                    1.00f to RibbonMint
                ),
                start = Offset(0f, 0.62f * h),
                end = Offset(w, 0.32f * h)
            )

            val strokeWidth = w * 0.082f

            // Lueur douce sous le ruban
            drawPath(
                path = drawnPath,
                brush = ribbonBrush,
                alpha = 0.20f,
                style = Stroke(
                    width = strokeWidth * 1.65f,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )
            )

            // Ruban principal net
            drawPath(
                path = drawnPath,
                brush = ribbonBrush,
                style = Stroke(
                    width = strokeWidth,
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round
                )
            )
        }

        // Titre central "Pressing Pro" sous le ruban
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth()
                .padding(top = 240.dp)
                .graphicsLayer {
                    alpha = textAlpha
                    translationY = textOffsetY
                },
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Pressing Pro",
                fontSize = 33.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = 0.6.sp,
                color = Color.White
            )
        }

        // Signature marque en pied d'écran : Logo KLIN UP + Nom
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 34.dp)
                .graphicsLayer { alpha = textAlpha },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.klinup_logo_brand),
                contentDescription = "Logo KLIN UP",
                contentScale = ContentScale.Fit,
                modifier = Modifier.size(26.dp)
            )
            Text(
                text = "KLIN UP",
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.6.sp,
                color = Color.White
            )
        }
    }
}
