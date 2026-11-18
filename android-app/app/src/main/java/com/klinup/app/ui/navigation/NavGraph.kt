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
    val overlayAlert by KlinUpNotificationManager.latestOverlayAlert.collectAsState()
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

    // Fermeture automatique de la bannière de superposition in-app après 4.5s
    LaunchedEffect(overlayAlert?.id) {
        if (overlayAlert != null) {
            delay(4500L)
            KlinUpNotificationManager.dismissOverlayAlert()
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
                    onNavigateToCreate = { navController.navigateToBottomTab(Screen.CreerCommande.route) },
                    onProfileClick = { navController.navigateToBottomTab(Screen.Profil.route) },
                    onOrderClick = { orderId ->
                        navController.navigate(Screen.OrderDetail.createRoute(orderId))
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
                    onBack = { navController.popBackStack() }
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

        // Bannière de superposition in-app pour les nouvelles notifications
        AnimatedVisibility(
            visible = overlayAlert != null && currentUser != null && !isSessionLocked,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + 8.dp)
                .padding(horizontal = 16.dp),
            enter = slideInVertically(
                animationSpec = tween(durationMillis = 300, easing = NavMotion.EmphasizedDecelerate),
                initialOffsetY = { -it }
            ) + fadeIn(tween(220)),
            exit = slideOutVertically(
                animationSpec = tween(durationMillis = 220, easing = NavMotion.EmphasizedAccelerate),
                targetOffsetY = { -it }
            ) + fadeOut(tween(180))
        ) {
            overlayAlert?.let { alert ->
                val colors = MaterialTheme.klinUpColors
                val (accentColor, categoryIcon, categoryLabel) = when (alert.category) {
                    NotificationCategory.NEW_ORDER -> Triple(
                        Color(0xFF0D2FE8),
                        TablerIcons.ShoppingBagPlus,
                        "Nouvelle commande"
                    )
                    NotificationCategory.READY -> Triple(
                        Color(0xFF16A34A),
                        TablerIcons.CircleCheck,
                        "Commande prête"
                    )
                    NotificationCategory.LATE -> Triple(
                        Color(0xFFDC2626),
                        TablerIcons.ClockExclamation,
                        "Retard / Urgent"
                    )
                    NotificationCategory.VALIDATION -> Triple(
                        Color(0xFFD97706),
                        TablerIcons.ShieldCheck,
                        "Validation"
                    )
                    NotificationCategory.INFO -> Triple(
                        Color(0xFF0284C7),
                        TablerIcons.InfoCircle,
                        "Information"
                    )
                }

                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = colors.cardBg,
                    shadowElevation = 14.dp,
                    border = BorderStroke(1.dp, accentColor.copy(alpha = 0.28f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(22.dp))
                        .bouncyClickable(pressedScale = 0.98f, role = Role.Button) {
                            KlinUpNotificationManager.markAsRead(alert.id)
                            KlinUpNotificationManager.dismissOverlayAlert()
                            if (!alert.orderId.isNullOrBlank()) {
                                navController.navigate(Screen.OrderDetail.createRoute(alert.orderId))
                            }
                        }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(accentColor.copy(alpha = 0.12f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = categoryIcon,
                                contentDescription = null,
                                tint = accentColor,
                                modifier = Modifier.size(21.dp)
                            )
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(999.dp),
                                        color = accentColor.copy(alpha = 0.12f)
                                    ) {
                                        Text(
                                            text = categoryLabel,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = accentColor,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                    Text(
                                        text = "À l'instant",
                                        fontSize = 10.sp,
                                        color = colors.inkMuted,
                                        fontWeight = FontWeight.Medium
                                    )
                                }

                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(colors.altPageBg)
                                        .bouncyClickable(pressedScale = 0.9f, role = Role.Button) {
                                            KlinUpNotificationManager.dismissOverlayAlert()
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = TablerIcons.X,
                                        contentDescription = "Fermer",
                                        tint = colors.inkMuted,
                                        modifier = Modifier.size(13.dp)
                                    )
                                }
                            }

                            Text(
                                text = alert.title,
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.inkPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )

                            if (alert.message.isNotBlank()) {
                                Text(
                                    text = alert.message,
                                    fontSize = 12.sp,
                                    lineHeight = 16.sp,
                                    color = colors.inkSecondary,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            if (!alert.orderId.isNullOrBlank()) {
                                Text(
                                    text = "Appuyer pour ouvrir la commande →",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = accentColor,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }
                        }
                    }
                }
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
