package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OrderTrackingSession(
    val id: String = "",
    @SerialName("order_id") val orderId: String = "",
    @SerialName("driver_id") val driverId: String = "",
    @SerialName("driver_name") val driverName: String? = null,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("mission_type") val missionType: String = "livraison_client",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val heading: Double? = 0.0,
    val speed: Double? = 0.0,
    @SerialName("dest_latitude") val destLatitude: Double? = null,
    @SerialName("dest_longitude") val destLongitude: Double? = null,
    @SerialName("dest_label") val destLabel: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("started_at") val startedAt: String? = null,
    @SerialName("ended_at") val endedAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)
