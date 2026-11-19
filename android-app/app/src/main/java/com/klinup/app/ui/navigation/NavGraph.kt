package com.klinup.app.ui.navigation

import com.klinup.app.ui.components.TablerIcons

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.data.local.NotificationCategory
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.BottomNavBar
import com.klinup.app.ui.components.LocalBottomBarPadding
import com.klinup.app.ui.components.NavMotion
import com.klinup.app.ui.components.bouncyClickable
import kotlinx.coroutines.delay
import com.klinup.app.ui.screens.create_order.OrderCreateScreen
import com.klinup.app.ui.screens.customer_detail.CustomerDetailScreen
import com.klinup.app.ui.screens.dashboard.DashboardScreen
import com.klinup.app.ui.screens.expense_detail.ExpenseDetailScreen
import com.klinup.app.ui.screens.gestion.GestionScreen
import com.klinup.app.ui.screens.history.HistoryScreen
import com.klinup.app.ui.screens.kpi_detail.KpiDetailScreen
import com.klinup.app.ui.screens.login.LoginScreen
import com.klinup.app.ui.screens.order_detail.OrderDetailScreen
import com.klinup.app.ui.screens.profile.ProfileScreen
import com.klinup.app.ui.screens.revenue_detail.RevenueDetailScreen
import com.klinup.app.ui.screens.splash.SplashScreen
import com.klinup.app.ui.theme.klinUpColors

private fun NavHostController.navigateToBottomTab(route: String) {
    navigate(route) {
        popUpTo(Screen.Accueil.route) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val density = LocalDensity.current

    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val isSessionLocked by SecurityManager.isSessionLocked.collectAsState()
    val pendingOrderId by KlinUpNotificationManager.pendingNavigationOrderId.collectAsState()
    val initialDestination = remember {
        if (KlinUpRepository.currentUser.value != null && !SecurityManager.isSessionLocked.value) {
            Screen.Accueil.route
        } else {
            Screen.Login.route
        }
    }

    // Navigation directe depuis une notification Android
    LaunchedEffect(pendingOrderId, currentUser, isSessionLocked) {
        val targetId = pendingOrderId
        if (!targetId.isNullOrBlank() && currentUser != null && !isSessionLocked) {
            KlinUpNotificationManager.consumePendingNavigationOrderId()
            navController.navigate(Screen.OrderDetail.createRoute(targetId))
        }
    }

    // Verrouillage automatique (Auto-Lock) ou expiration de session : retour immédiat à l'écran PIN
    LaunchedEffect(currentUser, isSessionLocked) {
        if ((currentUser == null || isSessionLocked) &&
            currentRoute != null &&
            currentRoute != Screen.Login.route &&
            currentRoute != Screen.Splash.route
        ) {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    val hideBottomBar = currentRoute == null ||
        currentRoute == Screen.Splash.route ||
        currentRoute == Screen.Login.route ||
        NavMotion.isDetailRoute(currentRoute)

    // Keep a stable bottom inset for tab screens so pushing/popping detail screens
    // never triggers a remeasure/relayout jump during animated transitions.
    var bottomBarHeight by remember { mutableStateOf(80.dp) }

    val pageBg = MaterialTheme.klinUpColors.pageBg
    CompositionLocalProvider(LocalBottomBarPadding provides bottomBarHeight) {
    Box(modifier = Modifier.fillMaxSize().background(pageBg)) {
        NavHost(
            navController = navController,
            startDestination = Screen.Splash.route,
            modifier = Modifier.fillMaxSize().background(pageBg),
            enterTransition = { NavMotion.enterTransition(this) },
            exitTransition = { NavMotion.exitTransition(this) },
            popEnterTransition = { NavMotion.popEnterTransition(this) },
            popExitTransition = { NavMotion.popExitTransition(this) }
        ) {
            composable(Screen.Splash.route) {
                SplashScreen(onFinished = {
                    val targetRoute = if (
                        KlinUpRepository.currentUser.value != null &&
                        !SecurityManager.isSessionLocked.value
                    ) {
                        Screen.Accueil.route
                    } else {
                        Screen.Login.route
                    }
                    navController.navigate(targetRoute) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Login.route) {
                LoginScreen(onLoginSuccess = {
                    navController.navigate(Screen.Accueil.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Accueil.route) {
                DashboardScreen(
                    onNavigateToGestion = { navController.navigateToBottomTab(Screen.Gestion.route) },
                    onNavigateToClients = {
                        KlinUpRepository.requestGestionTab("CLIENTS")
                        navController.navigateToBottomTab(Screen.Gestion.route)
                    },
                    onNavigateToCreate = { navController.navigateToBottomTab(Screen.CreerCommande.route) },
                    onProfileClick = { navController.navigateToBottomTab(Screen.Profil.route) },
                    onOrderClick = { orderId ->
                        navController.navigate(Screen.OrderDetail.createRoute(orderId))
                    },
                    onCustomerClick = { customerId ->
                        navController.navigate(Screen.CustomerDetail.createRoute(customerId))
                    },
                    onKpiClick = { kpiType ->
                        navController.navigate(Screen.KpiDetail.createRoute(kpiType))
                    },
                    onRevenueChartClick = {
                        navController.navigate(Screen.RevenueDetail.route)
                    }
                )
            }
            composable(Screen.Gestion.route) {
                GestionScreen(
                    onOrderClick = { orderId ->
                        navController.navigate(Screen.OrderDetail.createRoute(orderId))
                    },
                    onCustomerClick = { customerId ->
                        navController.navigate(Screen.CustomerDetail.createRoute(customerId))
                    },
                    onExpenseClick = { expenseId ->
                        navController.navigate(Screen.ExpenseDetail.createRoute(expenseId))
                    }
                )
            }
            composable(Screen.CreerCommande.route) {
                OrderCreateScreen(onOrderCreated = {
                    navController.navigateToBottomTab(Screen.Gestion.route)
                })
            }
            composable(Screen.Historique.route) {
                HistoryScreen(
                    onOrderClick = { orderId ->
                        navController.navigate(Screen.OrderDetail.createRoute(orderId))
                    }
                )
            }
            composable(Screen.Profil.route) {
                ProfileScreen(onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                })
            }
            composable(
                route = Screen.OrderDetail.route,
                arguments = listOf(navArgument("orderId") { type = NavType.StringType })
            ) { backStackEntry ->
                val orderId = backStackEntry.arguments?.getString("orderId") ?: ""
                OrderDetailScreen(
                    orderId = orderId,
                    onBack = { navController.popBackStack() },
                    onCustomerClick = { customerId ->
                        navController.navigate(Screen.CustomerDetail.createRoute(customerId))
                    }
                )
            }
            composable(
                route = Screen.CustomerDetail.route,
                arguments = listOf(navArgument("customerId") { type = NavType.StringType })
            ) { backStackEntry ->
                val customerId = backStackEntry.arguments?.getString("customerId") ?: ""
                CustomerDetailScreen(
                    customerId = customerId,
                    onBack = { navController.popBackStack() }
                )
            }
            composable(
                route = Screen.ExpenseDetail.route,
                arguments = listOf(navArgument("expenseId") { type = NavType.StringType })
            ) { backStackEntry ->
                val expenseId = backStackEntry.arguments?.getString("expenseId") ?: ""
                ExpenseDetailScreen(
                    expenseId = expenseId,
                    onBack = { navController.popBackStack() }
                )
            }
            composable(
                route = Screen.KpiDetail.route,
                arguments = listOf(navArgument("kpiType") { type = NavType.StringType })
            ) { backStackEntry ->
                val kpiType = backStackEntry.arguments?.getString("kpiType") ?: "ca_mensuel"
                KpiDetailScreen(
                    initialKpiType = kpiType,
                    onBack = { navController.popBackStack() }
                )
            }
            composable(Screen.RevenueDetail.route) {
                RevenueDetailScreen(
                    onBack = { navController.popBackStack() }
                )
            }
        }

        AnimatedVisibility(
            visible = !hideBottomBar,
            modifier = Modifier.align(Alignment.BottomCenter),
            enter = slideInVertically(
                animationSpec = tween(durationMillis = 300, easing = NavMotion.EmphasizedDecelerate),
                initialOffsetY = { it }
            ) + fadeIn(tween(durationMillis = 220)),
            exit = slideOutVertically(
                animationSpec = tween(durationMillis = 220, easing = NavMotion.EmphasizedAccelerate),
                targetOffsetY = { it }
            ) + fadeOut(tween(durationMillis = 160))
        ) {
            BottomNavBar(
                navController = navController,
                modifier = Modifier.onSizeChanged { size ->
                    if (size.height > 0) {
                        val measured = with(density) { size.height.toDp() }
                        if (measured != bottomBarHeight) {
                            bottomBarHeight = measured
                        }
                    }
                }
            )
        }
    }
    }
}
