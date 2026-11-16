package com.klinup.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import com.klinup.app.data.repository.KlinUpRepository
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.klinup.app.ui.navigation.Screen
import com.klinup.app.ui.theme.klinUpColors

private val NavBarBlue = Color(0xFF2600F5)
private val NavWhite = Color(0xFFFFFFFF)

val LocalBottomBarPadding = compositionLocalOf { 0.dp }

@Composable
fun BottomNavBar(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val haptics = LocalHapticFeedback.current
    val colors = MaterialTheme.klinUpColors

    val barColor = NavBarBlue
    val pillColor = if (colors.isDark) Color(0xFF000000) else NavWhite
    val activeIconColor = if (colors.isDark) NavWhite else NavBarBlue
    val inactiveIconColor = if (colors.isDark) Color(0xFFC7D2FE) else NavWhite
    val activeLabelColor = NavWhite
    val inactiveLabelColor = if (colors.isDark) Color(0xFFC7D2FE) else NavWhite
    val barBorder: BorderStroke? = null

    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val canCreateOrders = currentUser?.canCreateOrders ?: true
    val screens = remember(canCreateOrders) {
        Screen.bottomNavScreens.filter { it != Screen.CreerCommande || canCreateOrders }
    }
    val rawSelectedIndex = remember(currentRoute, screens) {
        screens.indexOfFirst { it.route == currentRoute }
    }
    val hasSelectedTab = rawSelectedIndex >= 0
    val selectedIndex = rawSelectedIndex.coerceAtLeast(0)

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(topStart = 34.dp, topEnd = 34.dp),
        color = barColor,
        border = barBorder,
        shadowElevation = 0.dp
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .windowInsetsPadding(WindowInsets.navigationBars)
                .padding(horizontal = 8.dp, vertical = 10.dp)
        ) {
            val slotWidth = maxWidth / screens.size
            val pillWidth = 52.dp
            val targetOffset = slotWidth * selectedIndex + (slotWidth - pillWidth) / 2

            // Gliding pill indicator — placed via lambda offset to skip recomposition per frame
            val indicatorOffset by animateDpAsState(
                targetValue = targetOffset,
                animationSpec = spring(
                    dampingRatio = 0.78f,
                    stiffness = 430f
                ),
                label = "nav_pill_offset"
            )

            if (hasSelectedTab) {
                Box(
                    modifier = Modifier
                        .padding(top = 2.dp)
                        .offset { IntOffset(x = indicatorOffset.roundToPx(), y = 0) }
                        .width(pillWidth)
                        .height(34.dp)
                        .clip(RoundedCornerShape(17.dp))
                        .background(pillColor)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                screens.forEachIndexed { idx, screen ->
                    val isSelected = hasSelectedTab && idx == selectedIndex
                    val interactionSource = remember { MutableInteractionSource() }
                    val isPressed by interactionSource.collectIsPressedAsState()

                    val scale by animateFloatAsState(
                        targetValue = when {
                            isPressed -> 0.92f
                            isSelected -> 1.06f
                            else -> 1f
                        },
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessMedium
                        ),
                        label = "nav_scale_${screen.route}"
                    )

                    val iconTint by animateColorAsState(
                        targetValue = if (isSelected) activeIconColor else inactiveIconColor,
                        animationSpec = tween(durationMillis = 220),
                        label = "nav_tint_${screen.route}"
                    )

                    val labelAlpha by animateFloatAsState(
                        targetValue = if (isSelected) 1f else 0.86f,
                        animationSpec = tween(durationMillis = 200),
                        label = "nav_alpha_${screen.route}"
                    )

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 58.dp)
                            .clip(RoundedCornerShape(20.dp))
                            .clickable(
                                interactionSource = interactionSource,
                                indication = null,
                                role = Role.Tab,
                                onClick = {
                                    if (currentRoute != screen.route) {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        navController.navigate(screen.route) {
                                            popUpTo(Screen.Accueil.route) { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                }
                            )
                            .semantics {
                                contentDescription = screen.title
                                selected = isSelected
                            }
                            .padding(top = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .width(pillWidth)
                                .height(34.dp)
                                .graphicsLayer {
                                    scaleX = scale
                                    scaleY = scale
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                painter = painterResource(id = screen.iconRes),
                                contentDescription = null,
                                tint = iconTint,
                                modifier = Modifier.size(21.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(3.dp))

                        Text(
                            text = screen.title,
                            fontSize = 10.5.sp,
                            lineHeight = 13.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) activeLabelColor else inactiveLabelColor,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Clip,
                            modifier = Modifier.graphicsLayer { alpha = labelAlpha }
                        )
                    }
                }
            }
        }
    }
}
