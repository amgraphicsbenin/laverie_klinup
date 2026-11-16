package com.klinup.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Expense(
    val id: String = "",
    @SerialName("store_id") val storeId: String = "store_central",
    val category: String = "autres",
    val label: String = "",
    val description: String? = null,
    val amount: Double = 0.0,
    @SerialName("payment_method") val paymentMethod: String = "especes",
    @SerialName("expense_date") val expenseDate: String = "",
    val status: String = "validee",
    val reference: String? = null,
    @SerialName("receipt_url") val receiptUrl: String? = null,
    @SerialName("receipt_name") val receiptName: String? = null,
    @SerialName("receipt_mime_type") val receiptMimeType: String? = null,
    @SerialName("created_by_id") val createdById: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
    @SerialName("created_by_role") val createdByRole: String? = null,
    val source: String = "app",
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)

data class ExpenseCategoryOption(
    val id: String,
    val label: String,
    val shortLabel: String
)

data class ExpensePaymentOption(
    val id: String,
    val label: String
)

object ExpenseCatalog {
    val categories = listOf(
        ExpenseCategoryOption("produits", "Produits & Lessives", "Produits"),
        ExpenseCategoryOption("electricite_eau", "Électricité & Eau", "Élec / Eau"),
        ExpenseCategoryOption("maintenance", "Maintenance & Machines", "Machines"),
        ExpenseCategoryOption("fournitures", "Fournitures & Emballages", "Fournitures"),
        ExpenseCategoryOption("transport", "Transport & Livraison", "Livraison"),
        ExpenseCategoryOption("autres", "Autres (Laverie)", "Autres")
    )

    val paymentMethods = listOf(
        ExpensePaymentOption("especes", "Espèce"),
        ExpensePaymentOption("mobile_money", "Mobile Money")
    )

    fun categoryLabel(id: String): String =
        categories.firstOrNull { it.id == id }?.label ?: id.ifBlank { "Autres Dépenses" }

    fun paymentLabel(id: String): String = when (id.lowercase()) {
        "mobile_money", "momo" -> "Mobile Money"
        "especes" -> "Espèce"
        else -> paymentMethods.firstOrNull { it.id == id }?.label ?: "Espèce"
    }
}
