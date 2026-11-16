package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OrderItem(
    val id: String? = null,
    val article: String = "",
    val service: String = "lavage_simple",
    val quantite: Int = 1,
    val prix: Double = 0.0
)

@Serializable
data class SubscriptionDetails(
    @SerialName("plan_name") val planName: String? = null,
    @SerialName("vetements_utilises") val vetementsUtilises: Int? = null,
    @SerialName("vetements_inclus") val vetementsInclus: Int? = null,
    @SerialName("used_clothes") val usedClothes: Int? = null,
    @SerialName("total_clothes") val totalClothes: Int? = null
)

@Serializable
data class Order(
    val id: String,
    @SerialName("customer_id") val customerId: String? = null,
    val statut: String = "en_attente",
    @SerialName("type_article") val typeArticle: String = "Divers",
    @SerialName("type_service") val typeService: String = "lavage_simple",
    @SerialName("niveau_urgence") val niveauUrgence: String = "Normal",
    @SerialName("mode_reglement") val modeReglement: String = "especes",
    @SerialName("avance_payee") val avancePayee: Double = 0.0,
    @SerialName("prix_total") val prixTotal: Double = 0.0,
    @SerialName("identifiant_unique_marquage") val identifiantUniqueMarquage: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("solde_paid_at") val soldePaidAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
    val items: List<OrderItem>? = null,
    @SerialName("is_subscription_order") val isSubscriptionOrder: Boolean = false,
    @SerialName("subscription_details") val subscriptionDetails: SubscriptionDetails? = null,
    @SerialName("created_by_id") val createdById: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("frais_livraison") val fraisLivraison: Double = 0.0,
    @SerialName("livraison_domicile") val livraisonDomicile: Boolean = false,
    @SerialName("deleted_at") val deletedAt: String? = null
) {
    val displayNumber: String
        get() = "#${identifiantUniqueMarquage?.takeIf { it.isNotBlank() } ?: id}"

    val ticketLabel: String
        get() = "Ticket ${identifiantUniqueMarquage?.takeIf { it.isNotBlank() } ?: id}"

    val isCompletedOrCancelled: Boolean
        get() = statut == "restitue" || statut == "annule"
}
