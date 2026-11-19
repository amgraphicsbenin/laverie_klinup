package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CatalogItem(
    val id: String,
    val article: String = "",
    val service: String = "lavage_simple",
    val prix: Double = 0.0,
    val categorie: String = "individuel",
    val description: String? = null,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("nombre_vetements") val nombreVetements: Int? = null,
    @SerialName("duree_jours") val dureeJours: Int? = null,
    @SerialName("ramassage_gratuit") val ramassageGratuit: Boolean = false,
    @SerialName("livraison_gratuite") val livraisonGratuite: Boolean = false,
    @SerialName("is_active") val isActive: Boolean? = true,
    val statut: String? = null
)
