package com.klinup.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.Customer
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.launch

@Composable
fun CustomerDeliveryAddressDialog(
    customer: Customer,
    onDismiss: () -> Unit,
    onSavedAndContinue: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val haptics = LocalHapticFeedback.current
    val scope = rememberCoroutineScope()
    val stores by KlinUpRepository.stores.collectAsState()

    val brandBlue = Color(0xFF002CF7)
    val softBlueBg = if (colors.isDark) Color(0xFF0E1B42) else Color(0xFFF0F4FF)
    val cardWhite = colors.cardBg
    val innerBorder = colors.border
    val brandText = colors.brandText
    val inkSecondary = colors.inkSecondary

    val existingCoords = customer.resolvedLatLng
    var address by remember(customer.id) { mutableStateOf(customer.adresse.orEmpty()) }
    var quartier by remember(customer.id) { mutableStateOf(customer.quartier.orEmpty()) }
    var ville by remember(customer.id) { mutableStateOf(customer.ville?.takeIf { it.isNotBlank() } ?: "Cotonou") }
    var lat by remember(customer.id) { mutableStateOf(existingCoords?.first?.toString().orEmpty()) }
    var lng by remember(customer.id) { mutableStateOf(existingCoords?.second?.toString().orEmpty()) }
    var deliveryEstimateText by remember(customer.id) { mutableStateOf<String?>(null) }
    var showMapPicker by remember { mutableStateOf(false) }
    var errorMsg by remember(customer.id) { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    val activeStore = remember(stores, customer.storeId) {
        stores.firstOrNull { it.id == customer.storeId } ?: stores.firstOrNull()
    }

    if (showMapPicker) {
        val sLat = activeStore?.latitude ?: 6.3703
        val sLng = activeStore?.longitude ?: 2.3912
        val initLat = lat.replace(",", ".").trim().toDoubleOrNull() ?: sLat
        val initLng = lng.replace(",", ".").trim().toDoubleOrNull() ?: sLng
        MapLocationPickerDialog(
            initialLat = initLat,
            initialLng = initLng,
            storeLat = sLat,
            storeLng = sLng,
            storeName = activeStore?.nom ?: "Point de Laverie",
            onDismiss = { showMapPicker = false },
            onLocationConfirmed = { picked ->
                lat = picked.latitude.toString()
                lng = picked.longitude.toString()
                errorMsg = null
                if (picked.address.isNotBlank() && address.isBlank()) {
                    address = picked.address
                }
                if (picked.quartier.isNotBlank() && quartier.isBlank()) {
                    quartier = picked.quartier
                }
                if (picked.ville.isNotBlank() && (ville.isBlank() || ville == "Cotonou")) {
                    ville = picked.ville
                }
                val calc = KlinUpRepository.calculateDeliveryFee(
                    activeStore?.id,
                    picked.latitude,
                    picked.longitude
                )
                deliveryEstimateText = "${calc.zoneLabel} (${calc.distanceKm} km) • Frais : ${KlinUpRepository.formatFcfa(calc.fee)}"
                showMapPicker = false
            }
        )
    }

    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        containerColor = cardWhite,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "Adresse de livraison client",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = colors.inkPrimary
                )
                Text(
                    text = "${customer.fullName} (${customer.telephone})",
                    fontSize = 12.sp,
                    color = colors.inkMuted
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = softBlueBg,
                    border = BorderStroke(1.dp, brandBlue.copy(alpha = 0.22f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.MapPin,
                                contentDescription = null,
                                tint = brandText,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = "Position GPS (Calcul de livraison)",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = brandText
                            )
                        }

                        Text(
                            text = "Saisissez la latitude et la longitude du domicile du client ou utilisez la carte pour remplir automatiquement les coordonnées.",
                            fontSize = 12.sp,
                            color = inkSecondary,
                            lineHeight = 17.sp
                        )

                        OutlinedButton(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                showMapPicker = true
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.2.dp, brandBlue),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = cardWhite,
                                contentColor = brandText
                            )
                        ) {
                            Icon(
                                imageVector = TablerIcons.Map,
                                contentDescription = null,
                                tint = brandText,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Utiliser la carte",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = brandText
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Text("Latitude", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = inkSecondary)
                                OutlinedTextField(
                                    value = lat,
                                    onValueChange = { lat = it; errorMsg = null },
                                    placeholder = { Text("Ex: 6.3650", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        unfocusedContainerColor = cardWhite,
                                        focusedContainerColor = cardWhite,
                                        unfocusedBorderColor = innerBorder,
                                        focusedBorderColor = brandBlue
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                            Column(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Text("Longitude", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = inkSecondary)
                                OutlinedTextField(
                                    value = lng,
                                    onValueChange = { lng = it; errorMsg = null },
                                    placeholder = { Text("Ex: 2.4100", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        unfocusedContainerColor = cardWhite,
                                        focusedContainerColor = cardWhite,
                                        unfocusedBorderColor = innerBorder,
                                        focusedBorderColor = brandBlue
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }

                        if (deliveryEstimateText != null) {
                            Text(
                                text = deliveryEstimateText!!,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = brandBlue
                            )
                        }

                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                val parsedLat = lat.replace(",", ".").trim().toDoubleOrNull()
                                val parsedLng = lng.replace(",", ".").trim().toDoubleOrNull()
                                if (parsedLat == null || parsedLng == null) {
                                    deliveryEstimateText = "Veuillez saisir une latitude et une longitude valides."
                                } else {
                                    val calc = KlinUpRepository.calculateDeliveryFee(activeStore?.id, parsedLat, parsedLng)
                                    deliveryEstimateText = "${calc.zoneLabel} (${calc.distanceKm} km) • Frais : ${KlinUpRepository.formatFcfa(calc.fee)}"
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(containerColor = brandBlue)
                        ) {
                            Icon(
                                imageVector = TablerIcons.MapPin,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(17.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Estimer les frais de livraison",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }

                errorMsg?.let {
                    Text(
                        text = it,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.redText
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = brandBlue),
                onClick = {
                    val parsedLat = lat.replace(",", ".").trim().toDoubleOrNull()
                    val parsedLng = lng.replace(",", ".").trim().toDoubleOrNull()
                    if (parsedLat == null || parsedLng == null || parsedLat.isNaN() || parsedLng.isNaN()) {
                        errorMsg = "Veuillez définir une latitude et une longitude valides."
                        return@Button
                    }
                    isSaving = true
                    errorMsg = null
                    scope.launch {
                        val finalAddress = address.trim().ifBlank { "$parsedLat,$parsedLng" }
                        val res = KlinUpRepository.updateCustomer(
                            customerId = customer.id,
                            nom = customer.nom,
                            prenom = customer.prenom.orEmpty(),
                            telephone = customer.telephone,
                            indicatif = customer.indicatif ?: "229",
                            adresse = finalAddress,
                            quartier = quartier.trim().takeIf { it.isNotBlank() },
                            ville = ville.trim().takeIf { it.isNotBlank() },
                            storeId = customer.storeId,
                            latitude = parsedLat,
                            longitude = parsedLng,
                            preferencesPliage = customer.preferencesPliage ?: "Plié"
                        )
                        isSaving = false
                        if (res.isSuccess) {
                            onSavedAndContinue()
                        } else {
                            errorMsg = res.exceptionOrNull()?.message ?: "Erreur lors de l'enregistrement."
                        }
                    }
                }
            ) {
                if (isSaving) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text("Enregistrer", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        },
        dismissButton = {
            TextButton(enabled = !isSaving, onClick = onDismiss) {
                Text("Annuler", color = inkSecondary)
            }
        }
    )
}
