package com.klinup.app.ui.screens.splash

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.R
import com.klinup.app.ui.components.NavMotion
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    var visible by remember { mutableStateOf(false) }

    val logoScale by animateFloatAsState(
        targetValue = if (visible) 1f else 0.72f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessMediumLow
        ),
        label = "splash_logo_scale"
    )
    val contentAlpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(durationMillis = 480, easing = NavMotion.EmphasizedDecelerate),
        label = "splash_alpha"
    )

    LaunchedEffect(Unit) {
        visible = true
        delay(1150L)
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.pageBg),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .padding(horizontal = 32.dp)
                .graphicsLayer { alpha = contentAlpha }
        ) {
            Surface(
                shape = RoundedCornerShape(32.dp),
                color = if (colors.isDark) Color(0xFF0C1022) else Color(0xFFF3F6FF),
                shadowElevation = 0.dp,
                modifier = Modifier
                    .size(116.dp)
                    .graphicsLayer {
                        scaleX = logoScale
                        scaleY = logoScale
                    }
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(22.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.klinup_logo_brand),
                        contentDescription = "Logo KLIN UP",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "KLIN UP",
                fontSize = 30.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.2.sp,
                color = colors.inkPrimary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(colors.softBlueBg)
                    .padding(horizontal = 14.dp, vertical = 5.dp)
            ) {
                Text(
                    text = "Pressing Pro • Caisse & Atelier",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.brandText
                )
            }

            Spacer(modifier = Modifier.height(34.dp))

            LinearProgressIndicator(
                color = colors.brandBlue,
                trackColor = colors.trackBg,
                modifier = Modifier
                    .width(120.dp)
                    .height(4.dp)
                    .clip(CircleShape)
            )
        }

        Text(
            text = "Version 1.0.0",
            fontSize = 11.sp,
            color = colors.inkMuted,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 36.dp)
                .graphicsLayer { alpha = contentAlpha }
        )
    }
}
