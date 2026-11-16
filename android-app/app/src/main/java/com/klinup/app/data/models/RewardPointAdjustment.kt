package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RewardPointAdjustment(
    val id: String,
    @SerialName("customer_id") val customerId: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("points_delta") val pointsDelta: Int = 0,
    val reason: String = "",
    val status: String = "pending", // "pending" | "approved" | "rejected"
    @SerialName("requested_by_id") val requestedById: String? = null,
    @SerialName("requested_by_name") val requestedByName: String? = null,
    @SerialName("requested_by_role") val requestedByRole: String? = null,
    @SerialName("validated_by_id") val validatedById: String? = null,
    @SerialName("validated_by_name") val validatedByName: String? = null,
    @SerialName("validated_by_role") val validatedByRole: String? = null,
    @SerialName("rejection_reason") val rejectionReason: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("validated_at") val validatedAt: String? = null
)
