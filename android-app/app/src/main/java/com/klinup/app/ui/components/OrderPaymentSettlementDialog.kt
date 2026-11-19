package com.klinup.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.PhoneAndroid
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlin.math.roundToInt

private val SettlementBrandBlue = Color(0xFF0000FF)

@Composable
fun OrderPaymentSettlementDialog(
    order: Order,
    targetStatus: String,
    isSubmitting: Boolean = false,
    onDismiss: () -> Unit,
    onConfirm: (amountPaid: Double, paymentMethod: String, momoRef: String?, momoOperator: String?) -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val remaining = (order.prixTotal - order.avancePayee).coerceAtLeast(0.0)
    var amountText by remember(order.id) { mutableStateOf(remaining.roundToInt().toString()) }
    var paymentMethod by remember(order.id) { mutableStateOf("especes") }
    var momoOperator by remember(order.id) { mutableStateOf("MTN") }
    var momoRef by remember(order.id) { mutableStateOf("") }
    var errorMessage by remember(order.id) { mutableStateOf<String?>(null) }

    val actionTitle = when (targetStatus) {
        "a_recuperer" -> "Règlement avant retrait sur place"
        "a_livrer" -> "Règlement pour mise en livraison"
        "en_cours_livraison" -> "Règlement avant départ livraison"
        "restitue" -> "Règlement du solde à la remise"
        else -> "Règlement du reste à payer"
    }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        containerColor = colors.cardBg,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = actionTitle,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.inkPrimary
                )
                Text(
                    text = order.ticketLabel,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.inkMuted
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = colors.softAmberBg,
                    border = BorderStroke(1.dp, colors.amberText.copy(alpha = 0.28f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Total commande :", fontSize = 12.sp, color = colors.inkSecondary)
                            Text(KlinUpRepository.formatFcfa(order.prixTotal), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.inkPrimary)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Déjà payé :", fontSize = 12.sp, color = colors.inkSecondary)
                            Text(KlinUpRepository.formatFcfa(order.avancePayee), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.inkPrimary)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Reste à payer :", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.amberText)
                            Text(KlinUpRepository.formatFcfa(remaining), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = colors.amberText)
                        }
                    }
                }

                OutlinedTextField(
                    value = amountText,
                    onValueChange = {
                        amountText = it.filter { ch -> ch.isDigit() }
                        errorMessage = null
                    },
                    label = { Text("Montant encaissé (FCFA) *") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SettlementBrandBlue,
                        unfocusedBorderColor = colors.innerBorder
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Mode de paiement *",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.inkSecondary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("especes" to "Espèce", "mobile_money" to "Mobile Money").forEach { (key, label) ->
                        val selected = paymentMethod == key
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .clickable(role = Role.RadioButton) {
                                    paymentMethod = key
                                    errorMessage = null
                                },
                            shape = RoundedCornerShape(14.dp),
                            color = if (selected) colors.softBlueBg else colors.chipBg,
                            border = BorderStroke(
                                width = if (selected) 1.5.dp else 1.dp,
                                color = if (selected) SettlementBrandBlue else colors.innerBorder
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = if (key == "especes") TablerIcons.Cash else TablerIcons.DeviceMobile,
                                    contentDescription = label,
                                    tint = if (selected) SettlementBrandBlue else colors.inkSecondary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (selected) SettlementBrandBlue else colors.inkPrimary
                                )
                            }
                        }
                    }
                }

                if (paymentMethod == "mobile_money") {
                    MomoOperatorSelector(
                        selectedOperator = momoOperator,
                        onSelect = {
                            momoOperator = it
                            errorMessage = null
                        }
                    )

                    OutlinedTextField(
                        value = momoRef,
                        onValueChange = {
                            momoRef = it.filter { ch -> ch.isDigit() }.take(15)
                            errorMessage = null
                        },
                        label = { Text("Numéro de référence Mobile Money *") },
                        placeholder = { Text("Ex: 1234567890") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        isError = errorMessage != null,
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SettlementBrandBlue,
                            unfocusedBorderColor = colors.innerBorder
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.redText
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSubmitting,
                onClick = {
                    val paidVal = amountText.toDoubleOrNull() ?: 0.0
                    if (paidVal <= 0.0) {
                        errorMessage = "Veuillez saisir le montant encaissé."
                        return@Button
                    }
                    if (paidVal < remaining) {
                        errorMessage = "Le règlement complet de ${KlinUpRepository.formatFcfa(remaining)} est requis."
                        return@Button
                    }
                    if (paymentMethod == "mobile_money") {
                        val refTrimmed = momoRef.trim()
                        if (refTrimmed.isBlank()) {
                            errorMessage = "Le numéro de référence de paiement est obligatoire."
                            return@Button
                        }
                        if (!Regex("^\\d{8,15}$").matches(refTrimmed)) {
                            errorMessage = "La référence Mobile Money doit contenir entre 8 et 15 chiffres."
                            return@Button
                        }
                    }
                    onConfirm(
                        paidVal,
                        paymentMethod,
                        if (paymentMethod == "mobile_money") momoRef.trim() else null,
                        if (paymentMethod == "mobile_money") momoOperator else null
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = SettlementBrandBlue),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(16.dp)
                    )
                } else {
                    Text("Valider le paiement", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        },
        dismissButton = {
            TextButton(enabled = !isSubmitting, onClick = onDismiss) {
                Text("Annuler", color = colors.inkSecondary)
            }
        }
    )
}

@Composable
fun SubscriptionPaymentDialog(
    planName: String,
    planPrice: Double,
    customerName: String,
    isSubmitting: Boolean = false,
    onDismiss: () -> Unit,
    onConfirm: (amountPaid: Double, paymentMethod: String, momoRef: String?, momoOperator: String?) -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    var amountText by remember(planName, planPrice) { mutableStateOf(planPrice.roundToInt().toString()) }
    var paymentMethod by remember(planName) { mutableStateOf("especes") }
    var momoOperator by remember(planName) { mutableStateOf("MTN") }
    var momoRef by remember(planName) { mutableStateOf("") }
    var errorMessage by remember(planName) { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = { if (!isSubmitting) onDismiss() },
        containerColor = colors.cardBg,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "Règlement de l'abonnement",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.inkPrimary
                )
                Text(
                    text = planName,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.inkMuted
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = colors.softAmberBg,
                    border = BorderStroke(1.dp, colors.amberText.copy(alpha = 0.28f))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Client :", fontSize = 12.sp, color = colors.inkSecondary)
                            Text(customerName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.inkPrimary)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Formule :", fontSize = 12.sp, color = colors.inkSecondary)
                            Text(planName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.inkPrimary)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Montant à payer :", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = colors.amberText)
                            Text(KlinUpRepository.formatFcfa(planPrice), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = colors.amberText)
                        }
                    }
                }

                OutlinedTextField(
                    value = amountText,
                    onValueChange = {
                        amountText = it.filter { ch -> ch.isDigit() }
                        errorMessage = null
                    },
                    label = { Text("Montant encaissé (FCFA) *") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SettlementBrandBlue,
                        unfocusedBorderColor = colors.innerBorder
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Mode de paiement *",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.inkSecondary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("especes" to "Espèce", "mobile_money" to "Mobile Money").forEach { (key, label) ->
                        val selected = paymentMethod == key
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(14.dp))
                                .clickable(role = Role.RadioButton) {
                                    paymentMethod = key
                                    errorMessage = null
                                },
                            shape = RoundedCornerShape(14.dp),
                            color = if (selected) colors.softBlueBg else colors.chipBg,
                            border = BorderStroke(
                                width = if (selected) 1.5.dp else 1.dp,
                                color = if (selected) SettlementBrandBlue else colors.innerBorder
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = if (key == "especes") TablerIcons.Cash else TablerIcons.DeviceMobile,
                                    contentDescription = label,
                                    tint = if (selected) SettlementBrandBlue else colors.inkSecondary,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = label,
                                    fontSize = 12.sp,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (selected) SettlementBrandBlue else colors.inkPrimary
                                )
                            }
                        }
                    }
                }

                if (paymentMethod == "mobile_money") {
                    MomoOperatorSelector(
                        selectedOperator = momoOperator,
                        onSelect = {
                            momoOperator = it
                            errorMessage = null
                        }
                    )

                    OutlinedTextField(
                        value = momoRef,
                        onValueChange = {
                            momoRef = it.filter { ch -> ch.isDigit() }.take(15)
                            errorMessage = null
                        },
                        label = { Text("Numéro de référence Mobile Money *") },
                        placeholder = { Text("Ex: 1234567890") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        isError = errorMessage != null,
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SettlementBrandBlue,
                            unfocusedBorderColor = colors.innerBorder
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (errorMessage != null) {
                    Text(
                        text = errorMessage!!,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.redText
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSubmitting,
                onClick = {
                    val paidVal = amountText.toDoubleOrNull() ?: 0.0
                    if (paidVal <= 0.0) {
                        errorMessage = "Veuillez saisir le montant encaissé."
                        return@Button
                    }
                    if (paidVal < planPrice) {
                        errorMessage = "Le règlement complet de ${KlinUpRepository.formatFcfa(planPrice)} est requis."
                        return@Button
                    }
                    if (paymentMethod == "mobile_money") {
                        val refTrimmed = momoRef.trim()
                        if (refTrimmed.isBlank()) {
                            errorMessage = "Le numéro de référence de paiement est obligatoire."
                            return@Button
                        }
                        if (!Regex("^\\d{8,15}$").matches(refTrimmed)) {
                            errorMessage = "La référence Mobile Money doit contenir entre 8 et 15 chiffres."
                            return@Button
                        }
                    }
                    onConfirm(
                        paidVal,
                        paymentMethod,
                        if (paymentMethod == "mobile_money") momoRef.trim() else null,
                        if (paymentMethod == "mobile_money") momoOperator else null
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = SettlementBrandBlue),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(16.dp)
                    )
                } else {
                    Text("Valider le paiement", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        },
        dismissButton = {
            TextButton(enabled = !isSubmitting, onClick = onDismiss) {
                Text("Annuler", color = colors.inkSecondary)
            }
        }
    )
}
