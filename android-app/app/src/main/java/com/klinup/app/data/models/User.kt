package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val nom: String = "",
    val prenom: String? = null,
    val email: String? = null,
    val role: String = "agent_caisse",
    @SerialName("code_pin") val codePin: String? = null,
    @SerialName("user_picture") val avatar: String? = null,
    val statut: String = "actif",
    val telephone: String? = null,
    @SerialName("store_id") val storeId: String? = "all",
    val permissions: Map<String, Boolean>? = null
) {
    val fullName: String
        get() = listOfNotNull(prenom?.takeIf { it.isNotBlank() }, nom.takeIf { it.isNotBlank() })
            .joinToString(" ")
            .ifBlank { email ?: "Utilisateur" }

    val normalizedRole: String
        get() = role.trim().lowercase()

    val isSuperAdmin: Boolean
        get() = normalizedRole == "super_admin"

    val isManagerOrAdmin: Boolean
        get() = normalizedRole in setOf("super_admin", "admin", "manager", "gerant", "gerant_boutique")

    private fun hasPerm(key: String, defaultByRole: Boolean): Boolean {
        if (isSuperAdmin) return true
        val map = permissions
        if (map != null && map.containsKey(key)) {
            return map[key] == true
        }
        return defaultByRole
    }

    val canAccessMobile: Boolean
        get() = hasPerm("can_access_mobile", true)

    val canManageOrders: Boolean
        get() = hasPerm("can_manage_orders", isManagerOrAdmin)

    val canCreateOrders: Boolean
        get() = canManageOrders || hasPerm(
            "can_create_orders_mobile",
            normalizedRole in setOf("agent_accueil", "agent_caisse", "manager", "gerant", "gerant_boutique", "admin")
        )

    val canManageDelivery: Boolean
        get() = canManageOrders || hasPerm("can_manage_delivery_mobile", normalizedRole == "livreur")

    val canManageWorkshop: Boolean
        get() = canManageOrders || hasPerm(
            "can_manage_workshop_mobile",
            normalizedRole in setOf("agent_lavage_repassage", "agent_atelier")
        )

    val canManageCustomersMobile: Boolean
        get() = canManageOrders || hasPerm(
            "can_manage_customers_mobile",
            normalizedRole in setOf("agent_accueil", "agent_caisse", "manager", "gerant", "gerant_boutique", "admin")
        )

    val canManageExpensesMobile: Boolean
        get() = canManageOrders || hasPerm("can_manage_expenses_mobile", isManagerOrAdmin)

    val canCancelOrders: Boolean
        get() = canManageOrders || canCreateOrders

    fun canPerformOrderTransition(currentStatus: String, targetStatus: String): Boolean {
        if (isSuperAdmin || canManageOrders) return true
        val cur = currentStatus.trim().lowercase()
        val target = targetStatus.trim().lowercase()
        if (target == "annule") return canCancelOrders
        return when {
            cur == "en_attente_validation" || target == "a_recuperer" || cur == "a_recuperer" -> canCreateOrders
            cur in setOf("en_attente", "attente", "traitement", "en_cours_lavage", "lavage_cours", "en_cours_repassage", "repassage_cours") ||
                target in setOf("en_cours_lavage", "en_cours_repassage", "pret") -> canManageWorkshop
            cur == "pret" && target == "a_livrer" -> canManageWorkshop || canManageDelivery || canCreateOrders
            cur in setOf("a_livrer", "en_cours_livraison") || target == "en_cours_livraison" -> canManageDelivery
            else -> canManageOrders
        }
    }
}
