package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ActiveSubscription(
    @SerialName("catalog_item_id") val catalogItemId: String = "",
    val name: String = "",
    @SerialName("total_clothes") val totalClothes: Int = 0,
    @SerialName("remaining_clothes") val remainingClothes: Int = 0,
    @SerialName("clothes_washed") val clothesWashed: Int? = null,
    @SerialName("duree_jours") val dureeJours: Int? = null,
    @SerialName("subscribed_at") val subscribedAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("end_date") val endDate: String? = null
)

@Serializable
data class Customer(
    val id: String,
    val nom: String = "",
    val prenom: String? = null,
    val telephone: String = "",
    val indicatif: String? = null,
    val adresse: String? = null,
    val quartier: String? = null,
    val ville: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("coordonnees_livraison") val coordonneesLivraison: String? = null,
    @SerialName("preferences_pliage") val preferencesPliage: String? = null,
    @SerialName("points_fidelite") val pointsFidelite: Int = 0,
    @SerialName("solde_dette") val soldeDette: Double = 0.0,
    @SerialName("active_subscription") val activeSubscription: ActiveSubscription? = null,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("deleted_at") val deletedAt: String? = null
) {
    val fullName: String
        get() = listOfNotNull(prenom?.takeIf { it.isNotBlank() }, nom.takeIf { it.isNotBlank() })
            .joinToString(" ")
            .ifBlank { telephone.ifBlank { "Client" } }

    val resolvedLatLng: Pair<Double, Double>?
        get() {
            if (latitude != null && longitude != null) return latitude to longitude
            val raw = coordonneesLivraison?.trim().orEmpty()
            if (raw.contains(",")) {
                val parts = raw.split(",")
                val lat = parts.getOrNull(0)?.trim()?.toDoubleOrNull()
                val lng = parts.getOrNull(1)?.trim()?.toDoubleOrNull()
                if (lat != null && lng != null) return lat to lng
            }
            return null
        }

    val initials: String
        get() {
            val parts = fullName.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
            return when {
                parts.size >= 2 -> "${parts[0].first().uppercaseChar()}${parts[1].first().uppercaseChar()}"
                parts.size == 1 && parts[0].length >= 2 -> parts[0].take(2).uppercase()
                parts.size == 1 -> parts[0].take(1).uppercase()
                else -> "CL"
            }
        }
}
