package com.klinup.app.ui.navigation

import androidx.annotation.DrawableRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.AddCircle
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector
import com.klinup.app.R

sealed class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector,
    @DrawableRes val iconRes: Int
) {
    object Splash : Screen("splash", "Démarrage", Icons.Default.Home, R.drawable.ic_nav_home)
    object Login : Screen("login", "Connexion", Icons.Default.Person, R.drawable.ic_nav_profile)
    object Accueil : Screen("accueil", "Accueil", Icons.Default.Home, R.drawable.ic_nav_home)
    object Gestion : Screen("gestion", "Gestion", Icons.AutoMirrored.Filled.List, R.drawable.ic_nav_manage)
    object CreerCommande : Screen("creer_commande", "Ajouter", Icons.Default.AddCircle, R.drawable.ic_nav_add)
    object Historique : Screen("historique", "Historique", Icons.Default.History, R.drawable.ic_nav_history)
    object Profil : Screen("profil", "Profil", Icons.Default.Person, R.drawable.ic_nav_profile)
    object OrderDetail : Screen("order_detail/{orderId}", "Détail", Icons.AutoMirrored.Filled.List, R.drawable.ic_nav_manage) {
        fun createRoute(orderId: String) = "order_detail/$orderId"
    }
    object CustomerDetail : Screen("customer_detail/{customerId}", "Fiche Client", Icons.Default.Person, R.drawable.ic_nav_profile) {
        fun createRoute(customerId: String) = "customer_detail/$customerId"
    }
    object ExpenseDetail : Screen("expense_detail/{expenseId}", "Détail Dépense", Icons.AutoMirrored.Filled.List, R.drawable.ic_nav_manage) {
        fun createRoute(expenseId: String) = "expense_detail/$expenseId"
    }
    object KpiDetail : Screen("kpi_detail/{kpiType}", "Détail KPI", Icons.Default.Home, R.drawable.ic_nav_home) {
        fun createRoute(kpiType: String) = "kpi_detail/$kpiType"
    }
    object RevenueDetail : Screen("revenue_detail", "Statistiques CA", Icons.Default.Home, R.drawable.ic_nav_home)

    companion object {
        val bottomNavScreens: List<Screen> by lazy {
            listOf(Accueil, Gestion, CreerCommande, Historique, Profil)
        }
    }
}
