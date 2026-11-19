package com.klinup.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.CatalogItem
import com.klinup.app.data.models.Store
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors

private val BrandBlue            = Color(0xFF0D2FE8)
private val BrandText: Color     @Composable get() = MaterialTheme.klinUpColors.brandText
private val SoftBlueBg: Color    @Composable get() = MaterialTheme.klinUpColors.softBlueBg
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val InnerBorder: Color   @Composable get() = MaterialTheme.klinUpColors.innerBorder
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted

@Composable
fun CustomerProfileFormCard(
    title: String,
    prenom: String,
    onPrenomChange: (String) -> Unit,
    nom: String,
    onNomChange: (String) -> Unit,
    indicatif: String,
    onIndicatifChange: (String) -> Unit,
    phone: String,
    onPhoneChange: (String) -> Unit,
    address: String,
    onAddressChange: (String) -> Unit,
    quartier: String,
    onQuartierChange: (String) -> Unit,
    ville: String,
    onVilleChange: (String) -> Unit,
    selectedStore: Store?,
    stores: List<Store>,
    onStoreChange: (Store?) -> Unit,
    lat: String,
    onLatChange: (String) -> Unit,
    lng: String,
    onLngChange: (String) -> Unit,
    pref: String,
    onPrefChange: (String) -> Unit,
    showSubscriptionSection: Boolean = true,
    subscriptionPlans: List<CatalogItem> = emptyList(),
    selectedSubPlan: CatalogItem? = null,
    onSubPlanChange: (CatalogItem?) -> Unit = {}
) {
    val haptics = LocalHapticFeedback.current
    var showCountryPicker by remember { mutableStateOf(false) }
    val selectedCountry = remember(indicatif) { CountryDialCodes.findByDisplayOrCode(indicatif) }
    var storeDropdownExpanded by remember { mutableStateOf(false) }
    var deliveryEstimateText by remember { mutableStateOf<String?>(null) }
    var showMapPicker by remember { mutableStateOf(false) }

    if (showCountryPicker) {
        CountryCodePickerDialog(
            selectedCountry = selectedCountry,
            onSelect = { country ->
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onIndicatifChange(country.displayValue)
                showCountryPicker = false
            },
            onDismiss = { showCountryPicker = false }
        )
    }

    if (showMapPicker) {
        val activeStore = selectedStore ?: stores.firstOrNull()
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
                onLatChange(picked.latitude.toString())
                onLngChange(picked.longitude.toString())
                if (picked.address.isNotBlank() && address.isBlank()) {
                    onAddressChange(picked.address)
                }
                if (picked.quartier.isNotBlank() && quartier.isBlank()) {
                    onQuartierChange(picked.quartier)
                }
                if (picked.ville.isNotBlank() && (ville.isBlank() || ville == "Cotonou")) {
                    onVilleChange(picked.ville)
                }
                val calc = KlinUpRepository.calculateDeliveryFee(
                    selectedStore?.id,
                    picked.latitude,
                    picked.longitude
                )
                deliveryEstimateText = "${calc.zoneLabel} (${calc.distanceKm} km) • Frais : ${KlinUpRepository.formatFcfa(calc.fee)}"
                showMapPicker = false
            }
        )
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = TablerIcons.UserPlus,
                    contentDescription = null,
                    tint = BrandText,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = title,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkPrimary
                )
            }

            // Prénom & Nom
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Prénom *", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                    OutlinedTextField(
                        value = prenom,
                        onValueChange = onPrenomChange,
                        placeholder = { Text("Ex: Jean", fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Nom *", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                    OutlinedTextField(
                        value = nom,
                        onValueChange = onNomChange,
                        placeholder = { Text("Ex: Dupont", fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Téléphone (Indicatif + Numéro)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Téléphone", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showCountryPicker = true
                        },
                        shape = RoundedCornerShape(16.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, InnerBorder),
                        modifier = Modifier.height(56.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = selectedCountry.displayValue,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkPrimary
                            )
                            Icon(TablerIcons.ChevronDown, contentDescription = null, tint = InkMuted, modifier = Modifier.size(18.dp))
                        }
                    }

                    OutlinedTextField(
                        value = phone,
                        onValueChange = onPhoneChange,
                        placeholder = { Text(selectedCountry.placeholder, fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Adresse (Rue / Domicile)
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Adresse (Rue / Domicile)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                OutlinedTextField(
                    value = address,
                    onValueChange = onAddressChange,
                    placeholder = { Text("Ex: Rue 123, Immeuble...", fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedBorderColor = InnerBorder,
                        focusedBorderColor = BrandBlue
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Quartier & Ville
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Quartier", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                    OutlinedTextField(
                        value = quartier,
                        onValueChange = onQuartierChange,
                        placeholder = { Text("Ex: Cadjehoun", fontSize = 14.sp, color = Color(0xFF94A3B8)) },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text("Ville", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                    OutlinedTextField(
                        value = ville,
                        onValueChange = onVilleChange,
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Point de laverie rattaché
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Point de laverie rattaché", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                Box(modifier = Modifier.fillMaxWidth()) {
                    Surface(
                        onClick = { storeDropdownExpanded = true },
                        shape = RoundedCornerShape(16.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, InnerBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 15.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = selectedStore?.nom ?: "-- Aucun point spécifique --",
                                fontSize = 14.sp,
                                color = if (selectedStore != null) InkPrimary else InkSecondary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(TablerIcons.ChevronDown, contentDescription = null, tint = InkMuted)
                        }
                    }
                    KlinUpDropdownMenu(
                        expanded = storeDropdownExpanded,
                        onDismissRequest = { storeDropdownExpanded = false }
                    ) {
                        KlinUpDropdownItem(
                            text = "-- Aucun point spécifique --",
                            selected = selectedStore == null,
                            onClick = {
                                onStoreChange(null)
                                storeDropdownExpanded = false
                            }
                        )
                        stores.forEach { store ->
                            KlinUpDropdownItem(
                                text = store.nom,
                                selected = selectedStore?.id == store.id,
                                onClick = {
                                    onStoreChange(store)
                                    storeDropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Position GPS (Calcul de livraison)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.klinUpColors.softBlueBg,
                border = BorderStroke(1.dp, MaterialTheme.klinUpColors.softBlueBorder)
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
                            tint = BrandText,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Position GPS (Calcul de livraison)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandText
                        )
                    }

                    Text(
                        text = "Saisissez la latitude et la longitude du domicile du client ou utilisez la carte pour remplir automatiquement les coordonnées.",
                        fontSize = 12.sp,
                        color = InkSecondary,
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
                        border = BorderStroke(1.2.dp, BrandBlue),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = CardWhite,
                            contentColor = BrandText
                        )
                    ) {
                        Icon(
                            imageVector = TablerIcons.Map,
                            contentDescription = null,
                            tint = BrandText,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Utiliser la carte",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandText
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
                            Text("Latitude", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                            OutlinedTextField(
                                value = lat,
                                onValueChange = onLatChange,
                                placeholder = { Text("Ex: 6.3650", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    unfocusedContainerColor = CardWhite,
                                    focusedContainerColor = CardWhite,
                                    unfocusedBorderColor = InnerBorder,
                                    focusedBorderColor = BrandBlue
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Text("Longitude", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                            OutlinedTextField(
                                value = lng,
                                onValueChange = onLngChange,
                                placeholder = { Text("Ex: 2.4100", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                shape = RoundedCornerShape(14.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    unfocusedContainerColor = CardWhite,
                                    focusedContainerColor = CardWhite,
                                    unfocusedBorderColor = InnerBorder,
                                    focusedBorderColor = BrandBlue
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
                            color = BrandBlue
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
                                val calc = KlinUpRepository.calculateDeliveryFee(selectedStore?.id, parsedLat, parsedLng)
                                deliveryEstimateText = "${calc.zoneLabel} (${calc.distanceKm} km) • Frais : ${KlinUpRepository.formatFcfa(calc.fee)}"
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
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

            // Préférence de pliage
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Préférence de pliage", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    listOf("Plié", "Sur Cintre").forEach { option ->
                        val isSelected = pref.equals(option, ignoreCase = true)
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onPrefChange(option)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(50),
                            color = if (isSelected) BrandBlue else CardWhite,
                            border = if (isSelected) null else BorderStroke(1.dp, InnerBorder)
                        ) {
                            Box(
                                modifier = Modifier.padding(vertical = 13.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = option,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White else InkPrimary
                                )
                            }
                        }
                    }
                }
            }

            // Forfait d'abonnement (Facultatif)
            if (showSubscriptionSection) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Forfait d'abonnement (Facultatif)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = InkSecondary)
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        item {
                            val isNone = selectedSubPlan == null
                            Surface(
                                onClick = { onSubPlanChange(null) },
                                shape = RoundedCornerShape(50),
                                color = if (isNone) SoftBlueBg else CardWhite,
                                border = BorderStroke(1.dp, if (isNone) BrandBlue else InnerBorder)
                            ) {
                                Text(
                                    text = "Aucun",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isNone) BrandText else InkSecondary,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp)
                                )
                            }
                        }
                        items(subscriptionPlans, key = { it.id }) { plan ->
                            val isSelected = selectedSubPlan?.id == plan.id
                            Surface(
                                onClick = { onSubPlanChange(plan) },
                                shape = RoundedCornerShape(50),
                                color = if (isSelected) SoftBlueBg else CardWhite,
                                border = BorderStroke(1.dp, if (isSelected) BrandBlue else InnerBorder)
                            ) {
                                Text(
                                    text = "${plan.article} (${KlinUpRepository.formatFcfa(plan.prix)})",
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) BrandText else InkSecondary,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
