package com.klinup.app.ui.components

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.LinearOutSlowInEasing
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.Indication
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.navigation.NavBackStackEntry
import com.klinup.app.ui.navigation.Screen
import kotlin.math.roundToInt

/**
 * Motion tokens & GPU-accelerated helpers aligned with Material 3 Emphasized Motion
 * for fluid 60/120 FPS Android navigation and micro-interactions.
 */
object NavMotion {
    val EmphasizedDecelerate: Easing = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1.0f)
    val EmphasizedAccelerate: Easing = CubicBezierEasing(0.3f, 0.0f, 0.8f, 0.15f)

    private val tabIndices: Map<String, Int> by lazy {
        Screen.bottomNavScreens.mapIndexed { index, screen -> screen.route to index }.toMap()
    }

    fun tabIndex(route: String?): Int = route?.let { tabIndices[it] } ?: -1

    fun isTabRoute(route: String?): Boolean = tabIndex(route) >= 0

    fun isDetailRoute(route: String?): Boolean {
        if (route == null) return false
        return route.startsWith("order_detail") ||
            route.startsWith("customer_detail") ||
            route.startsWith("expense_detail") ||
            route.startsWith("revenue_detail") ||
            route.startsWith("kpi_detail")
    }

    fun enterTransition(
        scope: AnimatedContentTransitionScope<NavBackStackEntry>
    ): EnterTransition {
        val from = scope.initialState.destination.route
        val to = scope.targetState.destination.route
        val fromTab = tabIndex(from)
        val toTab = tabIndex(to)

        return when {
            // Peer bottom-bar tab switch: ultra-snappy 160ms directional slide + fade
            fromTab >= 0 && toTab >= 0 -> {
                val direction = if (toTab >= fromTab) 1 else -1
                slideInHorizontally(
                    animationSpec = tween(durationMillis = 160, easing = EmphasizedDecelerate),
                    initialOffsetX = { fullWidth -> direction * (fullWidth * 0.06f).roundToInt() }
                ) + fadeIn(
                    animationSpec = tween(durationMillis = 140, easing = LinearOutSlowInEasing)
                )
            }
            // Entering a detail screen: crisp 200ms native push from right (no heavy double-scale)
            isDetailRoute(to) -> {
                slideInHorizontally(
                    animationSpec = tween(durationMillis = 200, easing = EmphasizedDecelerate),
                    initialOffsetX = { fullWidth -> (fullWidth * 0.22f).roundToInt() }
                ) + fadeIn(
                    animationSpec = tween(durationMillis = 160, easing = LinearOutSlowInEasing)
                )
            }
            // Login -> Home reveal
            from == Screen.Login.route -> {
                scaleIn(
                    initialScale = 0.96f,
                    animationSpec = tween(durationMillis = 220, easing = EmphasizedDecelerate)
                ) + fadeIn(
                    animationSpec = tween(durationMillis = 180, easing = LinearOutSlowInEasing)
                )
            }
            // Returning to Login (logout)
            to == Screen.Login.route -> {
                fadeIn(
                    animationSpec = tween(durationMillis = 180, easing = LinearOutSlowInEasing)
                )
            }
            else -> fadeIn(tween(160, easing = EmphasizedDecelerate))
        }
    }

    fun exitTransition(
        scope: AnimatedContentTransitionScope<NavBackStackEntry>
    ): ExitTransition {
        val from = scope.initialState.destination.route
        val to = scope.targetState.destination.route
        val fromTab = tabIndex(from)
        val toTab = tabIndex(to)

        return when {
            fromTab >= 0 && toTab >= 0 -> {
                val direction = if (toTab >= fromTab) 1 else -1
                slideOutHorizontally(
                    animationSpec = tween(durationMillis = 160, easing = EmphasizedAccelerate),
                    targetOffsetX = { fullWidth -> -direction * (fullWidth * 0.05f).roundToInt() }
                ) + fadeOut(
                    animationSpec = tween(durationMillis = 130)
                )
            }
            // Parent recedes smoothly when pushing a detail route
            isDetailRoute(to) -> {
                slideOutHorizontally(
                    animationSpec = tween(durationMillis = 190, easing = EmphasizedDecelerate),
                    targetOffsetX = { fullWidth -> -(fullWidth * 0.08f).roundToInt() }
                ) + fadeOut(
                    animationSpec = tween(durationMillis = 160)
                )
            }
            from == Screen.Login.route -> {
                fadeOut(tween(durationMillis = 160))
            }
            to == Screen.Login.route -> {
                fadeOut(tween(durationMillis = 160))
            }
            else -> fadeOut(tween(durationMillis = 150))
        }
    }

    fun popEnterTransition(
        scope: AnimatedContentTransitionScope<NavBackStackEntry>
    ): EnterTransition {
        val from = scope.initialState.destination.route
        val to = scope.targetState.destination.route
        val fromTab = tabIndex(from)
        val toTab = tabIndex(to)

        return when {
            isDetailRoute(from) -> {
                slideInHorizontally(
                    animationSpec = tween(durationMillis = 190, easing = EmphasizedDecelerate),
                    initialOffsetX = { fullWidth -> -(fullWidth * 0.08f).roundToInt() }
                ) + fadeIn(
                    animationSpec = tween(durationMillis = 150, easing = LinearOutSlowInEasing)
                )
            }
            fromTab >= 0 && toTab >= 0 -> enterTransition(scope)
            else -> fadeIn(tween(160, easing = EmphasizedDecelerate))
        }
    }

    fun popExitTransition(
        scope: AnimatedContentTransitionScope<NavBackStackEntry>
    ): ExitTransition {
        val from = scope.initialState.destination.route
        val to = scope.targetState.destination.route
        val fromTab = tabIndex(from)
        val toTab = tabIndex(to)

        return when {
            isDetailRoute(from) -> {
                slideOutHorizontally(
                    animationSpec = tween(durationMillis = 180, easing = EmphasizedAccelerate),
                    targetOffsetX = { fullWidth -> (fullWidth * 0.24f).roundToInt() }
                ) + fadeOut(
                    animationSpec = tween(durationMillis = 150)
                )
            }
            fromTab >= 0 && toTab >= 0 -> exitTransition(scope)
            else -> fadeOut(tween(durationMillis = 150))
        }
    }
}

/**
 * Adds a zero-relayout GPU press bounce + click handling for interactive cards and buttons.
 */
fun Modifier.bouncyClickable(
    enabled: Boolean = true,
    pressedScale: Float = 0.97f,
    role: Role? = null,
    showIndication: Boolean = true,
    onClick: () -> Unit
): Modifier = composed {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed && enabled) pressedScale else 1f,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = 600f
        ),
        label = "press_bounce"
    )
    val indication: Indication? = if (showIndication) LocalIndication.current else null

    this
        .graphicsLayer {
            scaleX = scale
            scaleY = scale
        }
        .clickable(
            interactionSource = interactionSource,
            indication = indication,
            enabled = enabled,
            role = role,
            onClick = onClick
        )
}
