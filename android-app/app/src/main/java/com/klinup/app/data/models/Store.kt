package com.klinup.app.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Store(
    val id: String,
    val nom: String,
    val code: String = "",
    val adresse: String? = null,
    val ville: String? = "Cotonou",
    val telephone: String? = null,
    val statut: String = "actif",
    val latitude: Double? = null,
    val longitude: Double? = null
)
