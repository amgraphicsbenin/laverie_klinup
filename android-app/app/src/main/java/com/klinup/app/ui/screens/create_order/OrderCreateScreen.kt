package com.klinup.app.ui.screens.create_order

import com.klinup.app.ui.components.TablerIcons

import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.draw.alpha
import com.klinup.app.ui.components.CustomerProfileFormCard
import com.klinup.app.ui.components.LocalBottomBarPadding
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.CatalogItem
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.OrderItem
import com.klinup.app.data.models.Store
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.KlinUpDropdownItem
import com.klinup.app.ui.components.KlinUpDropdownMenu
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.launch
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

private val BrandBlue            = Color(0xFF0D2FE8)
private val BrandText: Color     @Composable get() = MaterialTheme.klinUpColors.brandText
private val SoftBlueBg: Color    @Composable get() = MaterialTheme.klinUpColors.softBlueBg
private val PageBg: Color        @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val InnerBorder: Color   @Composable get() = MaterialTheme.klinUpColors.innerBorder
private val SegmentedBg: Color   @Composable get() = MaterialTheme.klinUpColors.chipBg
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted
private val GreenSuccess: Color  @Composable get() = MaterialTheme.klinUpColors.greenText
private val AmberBolt            = Color(0xFFF59E0B)

private enum class CreateTopTab { ORDER, CLIENT }

private data class PaymentOption(val key: String, val label: String)

private val SUBSCRIPTION_PAYMENT_OPTION = PaymentOption("abonnement", "Abonnement")

private val PAYMENT_OPTIONS = listOf(
    PaymentOption("especes", "Espèce"),
    PaymentOption("mobile_money", "Mobile Money"),
    SUBSCRIPTION_PAYMENT_OPTION
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderCreateScreen(onOrderCreated: () -> Unit) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val catalog by KlinUpRepository.catalog.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()
    val deliveryZones by KlinUpRepository.deliveryZones.collectAsState()
    val pickupZones by KlinUpRepository.pickupZones.collectAsState()

    var topTab by remember { mutableStateOf(CreateTopTab.ORDER) }

    // Order form state
    var selectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var showCustomerPicker by remember { mutableStateOf(false) }
    var articleModalGroup by remember { mutableStateOf<Pair<String, List<CatalogItem>>?>(null) }

    var urgency by remember { mutableStateOf("Normal") }
    var homeDelivery by remember { mutableStateOf(false) }
    var homePickup by remember { mutableStateOf(false) }
    var orderClientLat by remember { mutableStateOf("") }
    var orderClientLng by remember { mutableStateOf("") }
    var advanceText by remember { mutableStateOf("0") }
    var reductionText by remember { mutableStateOf("0") }
    var paymentOption by remember { mutableStateOf(PAYMENT_OPTIONS.first()) }
    var momoOperator by remember { mutableStateOf("MTN") }
    var paymentDropdownExpanded by remember { mutableStateOf(false) }
    var suggestedSubPlan by remember { mutableStateOf<CatalogItem?>(null) }
    var pendingSubPaymentPlan by remember { mutableStateOf<CatalogItem?>(null) }
    var isSubscribingInline by remember { mutableStateOf(false) }
    var inlineSubFeedback by remember { mutableStateOf<String?>(null) }

    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // New client inline tab state
    var newPrenom by remember { mutableStateOf("") }
    var newNom by remember { mutableStateOf("") }
    var newIndicatif by remember { mutableStateOf("🇧🇯 +229") }
    var indicatifExpanded by remember { mutableStateOf(false) }
    var newPhone by remember { mutableStateOf("") }
    var newAddress by remember { mutableStateOf("") }
    var newQuartier by remember { mutableStateOf("") }
    var newVille by remember { mutableStateOf("Cotonou") }
    var newClientStore by remember { mutableStateOf<Store?>(null) }
    var storeDropdownExpanded by remember { mutableStateOf(false) }
    var newLat by remember { mutableStateOf("") }
    var newLng by remember { mutableStateOf("") }
    var deliveryEstimateText by remember { mutableStateOf<String?>(null) }
    var newPref by remember { mutableStateOf("Plié") }
    var newSubPlan by remember { mutableStateOf<CatalogItem?>(null) }
    var isCreatingClient by remember { mutableStateOf(false) }
    var clientFeedback by remember { mutableStateOf<String?>(null) }

    val subscriptionPlans = remember(catalog, selectedStoreId) {
        catalog.filter {
            (it.categorie.equals("abonnement", ignoreCase = true) ||
                it.service.equals("abonnement", ignoreCase = true)) &&
                (it.isActive ?: true) &&
                !it.statut.equals("inactif", ignoreCase = true)
        }
    }

    val availableCatalog = remember(catalog, selectedStoreId) {
        catalog
            .filter {
                val cat = it.categorie.trim()
                val svc = it.service.trim()
                val isGarmentCategory = cat.equals("individuel", ignoreCase = true) ||
                    cat.equals("vetement", ignoreCase = true) ||
                    cat.equals("vêtement", ignoreCase = true)
                val isNonGarmentService = svc.equals("abonnement", ignoreCase = true) ||
                    svc.equals("system", ignoreCase = true) ||
                    svc.equals("system_setting", ignoreCase = true) ||
                    svc.equals("reward_catalog", ignoreCase = true)
                isGarmentCategory &&
                    !isNonGarmentService &&
                    !it.id.startsWith("setting_") &&
                    (it.isActive ?: true) &&
                    !it.statut.equals("inactif", ignoreCase = true)
            }
            .filter {
                selectedStoreId == "all" || selectedStoreId == "GLOBAL" ||
                    it.storeId == null || it.storeId == selectedStoreId
            }
    }

    val groupedArticles = remember(availableCatalog) {
        availableCatalog.groupBy { it.article.ifBlank { "Article" } }.toList()
    }

    val storeCustomers = remember(customers, selectedStoreId) {
        customers.filter {
            selectedStoreId == "all" || selectedStoreId == "GLOBAL" ||
                it.storeId == null || it.storeId == selectedStoreId
        }
    }

    val counts = remember { mutableStateMapOf<String, Int>() }

    val appSettings = remember(catalog) { KlinUpRepository.getAdminSettings(catalog) }

    val itemsTotal by remember(availableCatalog) {
        derivedStateOf {
            availableCatalog.sumOf { item -> (counts[item.id] ?: 0) * item.prix }
        }
    }
    val totalCount by remember(availableCatalog) {
        derivedStateOf {
            availableCatalog.sumOf { item -> counts[item.id] ?: 0 }
        }
    }

    LaunchedEffect(customers, selectedCustomer?.id) {
        val currentId = selectedCustomer?.id ?: return@LaunchedEffect
        customers.firstOrNull { it.id == currentId }?.let { fresh ->
            selectedCustomer = fresh
        }
    }

    LaunchedEffect(selectedCustomer?.id) {
        inlineSubFeedback = null
        val coords = selectedCustomer?.resolvedLatLng
        if (coords != null) {
            orderClientLat = coords.first.toString()
            orderClientLng = coords.second.toString()
        } else {
            orderClientLat = ""
            orderClientLng = ""
        }
    }

    val parsedOrderLat = orderClientLat.replace(",", ".").trim().toDoubleOrNull()
    val parsedOrderLng = orderClientLng.replace(",", ".").trim().toDoubleOrNull()
    val hasValidOrderLocation = parsedOrderLat != null && parsedOrderLng != null

    val deliveryCalc = remember(homeDelivery, selectedStoreId, parsedOrderLat, parsedOrderLng, deliveryZones, stores) {
        if (homeDelivery) {
            KlinUpRepository.calculateDeliveryFee(selectedStoreId, parsedOrderLat, parsedOrderLng)
        } else {
            null
        }
    }
    val pickupCalc = remember(homePickup, selectedStoreId, parsedOrderLat, parsedOrderLng, pickupZones, deliveryZones, stores) {
        if (homePickup) {
            KlinUpRepository.calculatePickupFee(selectedStoreId, parsedOrderLat, parsedOrderLng)
        } else {
            null
        }
    }

    val isSubscriptionPayment = paymentOption.key == "abonnement"
    LaunchedEffect(isSubscriptionPayment) {
        if (isSubscriptionPayment) {
            advanceText = "0"
            reductionText = "0"
            urgency = "Normal"
        }
    }
    val effectiveItemsTotal = if (isSubscriptionPayment) 0.0 else itemsTotal
    val expressFee = if (urgency == "Express" && !isSubscriptionPayment) {
        kotlin.math.round(itemsTotal * (appSettings.expressMarkup / 100.0))
    } else {
        0.0
    }
    val isFreeDeliverySub = isSubscriptionPayment && KlinUpRepository.isCustomerFreeDeliverySubscription(selectedCustomer)
    val deliveryFee = if (isFreeDeliverySub) 0.0 else (deliveryCalc?.fee ?: 0.0)
    val pickupFee = pickupCalc?.fee ?: 0.0
    val grossTotal = effectiveItemsTotal + expressFee + deliveryFee + pickupFee
    val reductionAmount = reductionText.toDoubleOrNull()?.coerceAtLeast(0.0) ?: 0.0
    val netTotal = (grossTotal - reductionAmount).coerceAtLeast(0.0)
    val advanceAmount = advanceText.toDoubleOrNull()?.coerceAtLeast(0.0) ?: 0.0
    val remainingAmount = (netTotal - advanceAmount).coerceAtLeast(0.0)

    val resetOrderForm = {
        selectedCustomer = null
        counts.clear()
        urgency = "Normal"
        homeDelivery = false
        homePickup = false
        orderClientLat = ""
        orderClientLng = ""
        advanceText = "0"
        reductionText = "0"
        paymentOption = PAYMENT_OPTIONS.first()
        errorMessage = null
    }

    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
    ) {
        // ── Top Segmented Bar ──────────────────────────────────────────
        Surface(color = CardWhite, shadowElevation = 0.dp) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = statusBarTop + 12.dp, start = 16.dp, end = 16.dp, bottom = 12.dp)
            ) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(50),
                    color = SegmentedBg
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val isOrderSelected = topTab == CreateTopTab.ORDER
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                topTab = CreateTopTab.ORDER
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(50),
                            color = if (isOrderSelected) BrandBlue else Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 11.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = TablerIcons.ShoppingBag,
                                    contentDescription = null,
                                    tint = if (isOrderSelected) Color.White else InkMuted,
                                    modifier = Modifier.size(17.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Nouvelle Commande",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isOrderSelected) Color.White else InkMuted,
                                    maxLines = 1
                                )
                            }
                        }

                        val isClientSelected = topTab == CreateTopTab.CLIENT
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                topTab = CreateTopTab.CLIENT
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(50),
                            color = if (isClientSelected) BrandBlue else Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 11.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = TablerIcons.UserPlus,
                                    contentDescription = null,
                                    tint = if (isClientSelected) Color.White else InkMuted,
                                    modifier = Modifier.size(17.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Nouveau Client",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isClientSelected) Color.White else InkMuted,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }

        if (topTab == CreateTopTab.CLIENT) {
            // ── Inline Nouveau Client Form ─────────────────────────────
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 16.dp,
                    bottom = 16.dp + LocalBottomBarPadding.current
                ),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    if (clientFeedback != null) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.klinUpColors.redText.copy(alpha = 0.08f),
                            border = BorderStroke(1.dp, MaterialTheme.klinUpColors.redText.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = clientFeedback!!,
                                fontSize = 13.sp,
                                color = MaterialTheme.klinUpColors.redText,
                                modifier = Modifier.padding(14.dp)
                            )
                        }
                    }

                    CustomerProfileFormCard(
                        title = "Création d'un Nouveau Client",
                        prenom = newPrenom,
                        onPrenomChange = { newPrenom = it },
                        nom = newNom,
                        onNomChange = { newNom = it },
                        indicatif = newIndicatif,
                        onIndicatifChange = { newIndicatif = it },
                        phone = newPhone,
                        onPhoneChange = { newPhone = it },
                        address = newAddress,
                        onAddressChange = { newAddress = it },
                        quartier = newQuartier,
                        onQuartierChange = { newQuartier = it },
                        ville = newVille,
                        onVilleChange = { newVille = it },
                        selectedStore = newClientStore,
                        stores = stores,
                        onStoreChange = { newClientStore = it },
                        lat = newLat,
                        onLatChange = { newLat = it },
                        lng = newLng,
                        onLngChange = { newLng = it },
                        pref = newPref,
                        onPrefChange = { newPref = it },
                        showSubscriptionSection = true,
                        subscriptionPlans = subscriptionPlans,
                        selectedSubPlan = newSubPlan,
                        onSubPlanChange = { newSubPlan = it }
                    )
                }

                // Bottom Enregistrer le Client CTA
                item {
                    Button(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            isCreatingClient = true
                            clientFeedback = null
                            val cleanIndicatif = newIndicatif.substringAfter("+").trim()
                            val lat = newLat.replace(",", ".").toDoubleOrNull()
                            val lng = newLng.replace(",", ".").toDoubleOrNull()
                            scope.launch {
                                val res = KlinUpRepository.createCustomer(
                                    nom = newNom,
                                    prenom = newPrenom,
                                    telephone = newPhone,
                                    adresse = newAddress,
                                    preferencesPliage = newPref,
                                    indicatif = cleanIndicatif,
                                    quartier = newQuartier,
                                    ville = newVille,
                                    latitude = lat,
                                    longitude = lng,
                                    explicitStoreId = newClientStore?.id,
                                    subscriptionPlan = newSubPlan
                                )
                                isCreatingClient = false
                                if (res.isSuccess) {
                                    selectedCustomer = res.getOrNull()
                                    newPrenom = ""
                                    newNom = ""
                                    newPhone = ""
                                    newAddress = ""
                                    newQuartier = ""
                                    newVille = "Cotonou"
                                    newLat = ""
                                    newLng = ""
                                    deliveryEstimateText = null
                                    newSubPlan = null
                                    topTab = CreateTopTab.ORDER
                                } else {
                                    clientFeedback = res.exceptionOrNull()?.message ?: "Erreur lors de la création"
                                }
                            }
                        },
                        enabled = !isCreatingClient && newPrenom.isNotBlank() && newNom.isNotBlank(),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        if (isCreatingClient) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                        } else {
                            Icon(
                                imageVector = TablerIcons.UserPlus,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Enregistrer le Client",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        } else {
            // ── Nouvelle Commande Form ─────────────────────────────────
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 16.dp,
                    end = 16.dp,
                    top = 16.dp,
                    bottom = 16.dp + LocalBottomBarPadding.current
                ),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (errorMessage != null) {
                    item {
                        val colors = MaterialTheme.klinUpColors
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = colors.softRedBg,
                            border = BorderStroke(1.dp, colors.softRedBorder)
                        ) {
                            Text(
                                text = errorMessage!!,
                                color = colors.redText,
                                fontSize = 13.sp,
                                modifier = Modifier.padding(14.dp)
                            )
                        }
                    }
                }

                // ── 1. Client & Abonnement ─────────────────────────────
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.User,
                                    contentDescription = null,
                                    tint = MaterialTheme.klinUpColors.brandText,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "1. Client & Abonnement",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            Text(
                                text = "Client",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkSecondary
                            )

                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .clickable {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        showCustomerPicker = true
                                    },
                                shape = RoundedCornerShape(16.dp),
                                color = CardWhite,
                                border = BorderStroke(1.dp, InnerBorder)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = selectedCustomer?.let { "${it.fullName} (${it.telephone})" }
                                            ?: "Sélectionner un client",
                                        fontSize = 14.sp,
                                        color = if (selectedCustomer != null) InkPrimary else InkMuted,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Icon(
                                        imageVector = TablerIcons.ChevronDown,
                                        contentDescription = null,
                                        tint = InkMuted
                                    )
                                }
                            }

                            selectedCustomer?.activeSubscription?.let { sub ->
                                val colors = MaterialTheme.klinUpColors
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(14.dp),
                                    color = colors.softSkyBg,
                                    border = BorderStroke(1.dp, colors.softSkyBorder)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 12.dp, vertical = 10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = "Abonnement : ${sub.name}",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = InkPrimary
                                            )
                                            Text(
                                                text = "${sub.remainingClothes} / ${sub.totalClothes} vêtements restants",
                                                fontSize = 12.sp,
                                                color = colors.skyText
                                            )
                                        }
                                        val usingSub = paymentOption.key == "abonnement"
                                        Surface(
                                            onClick = {
                                                paymentOption = if (usingSub) PAYMENT_OPTIONS.first() else SUBSCRIPTION_PAYMENT_OPTION
                                            },
                                            shape = RoundedCornerShape(50),
                                            color = if (usingSub) BrandBlue else SoftBlueBg
                                        ) {
                                            Text(
                                                text = if (usingSub) "Utilisé" else "Utiliser",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (usingSub) Color.White else BrandText,
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ── 2. Sélection des Vêtements ─────────────────────────
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.ShoppingBag,
                                    contentDescription = null,
                                    tint = MaterialTheme.klinUpColors.brandText,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "2. Sélection des Vêtements",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            if (groupedArticles.isEmpty()) {
                                Text(
                                    text = "Aucun article disponible dans le catalogue.",
                                    fontSize = 13.sp,
                                    color = InkMuted
                                )
                            } else {
                                groupedArticles.forEach { (articleName, variants) ->
                                    val selectedVariants = variants.filter { (counts[it.id] ?: 0) > 0 }
                                    val totalQtyForArticle = selectedVariants.sumOf { counts[it.id] ?: 0 }

                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(18.dp),
                                        color = CardWhite,
                                        border = BorderStroke(
                                            1.dp,
                                            if (totalQtyForArticle > 0) BrandBlue.copy(alpha = 0.4f) else InnerBorder
                                        )
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                                            verticalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = articleName,
                                                        fontSize = 15.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = InkPrimary
                                                    )
                                                    if (variants.size == 1 && totalQtyForArticle == 0) {
                                                        Text(
                                                            text = "${variants.first().service.replace("_", " ")} • ${KlinUpRepository.formatFcfa(variants.first().prix)}",
                                                            fontSize = 12.sp,
                                                            color = InkMuted
                                                        )
                                                    }
                                                }

                                                Surface(
                                                    onClick = {
                                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                        if (variants.size == 1) {
                                                            val item = variants.first()
                                                            counts[item.id] = (counts[item.id] ?: 0) + 1
                                                        } else {
                                                            articleModalGroup = articleName to variants
                                                        }
                                                    },
                                                    shape = RoundedCornerShape(50),
                                                    color = SoftBlueBg
                                                ) {
                                                    Text(
                                                        text = if (totalQtyForArticle > 0) "+ Ajouter ($totalQtyForArticle)" else "Ajouter",
                                                        fontSize = 13.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = MaterialTheme.klinUpColors.brandText,
                                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp)
                                                    )
                                                }
                                            }

                                            selectedVariants.forEach { variant ->
                                                val qty = counts[variant.id] ?: 0
                                                Row(
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .clip(RoundedCornerShape(12.dp))
                                                        .background(PageBg)
                                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(
                                                            text = variant.service.replace("_", " ").replaceFirstChar { it.uppercase() },
                                                            fontSize = 12.sp,
                                                            fontWeight = FontWeight.SemiBold,
                                                            color = InkPrimary
                                                        )
                                                        Text(
                                                            text = KlinUpRepository.formatFcfa(variant.prix * qty),
                                                            fontSize = 12.sp,
                                                            color = MaterialTheme.klinUpColors.brandText,
                                                            fontWeight = FontWeight.Bold
                                                        )
                                                    }

                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                    ) {
                                                        Surface(
                                                            onClick = {
                                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                                if (qty <= 1) counts.remove(variant.id) else counts[variant.id] = qty - 1
                                                            },
                                                            shape = CircleShape,
                                                            color = CardWhite,
                                                            border = BorderStroke(1.dp, InnerBorder),
                                                            modifier = Modifier.size(28.dp)
                                                        ) {
                                                            Box(contentAlignment = Alignment.Center) {
                                                                Icon(TablerIcons.Minus, contentDescription = null, tint = InkPrimary, modifier = Modifier.size(15.dp))
                                                            }
                                                        }
                                                        Text(
                                                            text = "$qty",
                                                            fontSize = 14.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = InkPrimary
                                                        )
                                                        Surface(
                                                            onClick = {
                                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                                counts[variant.id] = qty + 1
                                                            },
                                                            shape = CircleShape,
                                                            color = MaterialTheme.klinUpColors.brandText,
                                                            modifier = Modifier.size(28.dp)
                                                        ) {
                                                            Box(contentAlignment = Alignment.Center) {
                                                                Icon(TablerIcons.Plus, contentDescription = null, tint = Color.White, modifier = Modifier.size(15.dp))
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ── 3. Options & Paiement ──────────────────────────────
                item {
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
                                    imageVector = TablerIcons.Sparkles,
                                    contentDescription = null,
                                    tint = MaterialTheme.klinUpColors.brandText,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "3. Options & Paiement",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = "Niveau d'Urgence",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkSecondary
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    val isNormal = urgency == "Normal"
                                    Surface(
                                        onClick = {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            urgency = "Normal"
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(50),
                                        color = if (isNormal) BrandBlue else CardWhite,
                                        border = if (isNormal) null else BorderStroke(1.dp, InnerBorder)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 13.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = TablerIcons.Clock,
                                                contentDescription = null,
                                                tint = if (isNormal) Color.White else InkPrimary,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "Normal (48h)",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isNormal) Color.White else InkPrimary
                                            )
                                        }
                                    }

                                    val isExpress = urgency == "Express"
                                    Surface(
                                        onClick = {
                                            if (!isSubscriptionPayment) {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                urgency = "Express"
                                            }
                                        },
                                        enabled = !isSubscriptionPayment,
                                        modifier = Modifier
                                            .weight(1f)
                                            .alpha(if (isSubscriptionPayment) 0.45f else 1f),
                                        shape = RoundedCornerShape(50),
                                        color = if (isExpress) BrandBlue else CardWhite,
                                        border = if (isExpress) null else BorderStroke(1.dp, InnerBorder)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(vertical = 13.dp),
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = TablerIcons.Bolt,
                                                contentDescription = null,
                                                tint = if (isExpress) Color.White else AmberBolt,
                                                modifier = Modifier.size(17.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Express (24h)",
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isExpress) Color.White else InkPrimary
                                            )
                                        }
                                    }
                                }
                            }

                            // Livraison à domicile toggle card
                            OptionToggleRow(
                                title = "🚚 Livraison à domicile",
                                subtitle = if (homeDelivery) {
                                    if (hasValidOrderLocation && deliveryCalc != null) {
                                        "${deliveryCalc.zoneLabel} (${deliveryCalc.distanceKm} km) • ${KlinUpRepository.formatFcfa(deliveryCalc.fee)}"
                                    } else {
                                        "Localisation GPS requise pour calculer les frais"
                                    }
                                } else {
                                    "Le client récupère sa commande en boutique"
                                },
                                checked = homeDelivery,
                                onToggle = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    homeDelivery = !homeDelivery
                                }
                            )

                            // Récupération à domicile toggle card
                            OptionToggleRow(
                                title = "🧺 Récupération à domicile",
                                subtitle = if (homePickup) {
                                    if (hasValidOrderLocation && pickupCalc != null) {
                                        "${pickupCalc.zoneLabel} (${pickupCalc.distanceKm} km) • ${KlinUpRepository.formatFcfa(pickupCalc.fee)}"
                                    } else {
                                        "Localisation GPS requise pour calculer les frais"
                                    }
                                } else {
                                    "Le client dépose sa commande en boutique"
                                },
                                checked = homePickup,
                                onToggle = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    homePickup = !homePickup
                                }
                            )

                            if ((homeDelivery || homePickup) && selectedCustomer?.resolvedLatLng == null) {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(18.dp),
                                    color = if (hasValidOrderLocation) SoftBlueBg else MaterialTheme.klinUpColors.redText.copy(alpha = 0.08f),
                                    border = BorderStroke(
                                        1.dp,
                                        if (hasValidOrderLocation) BrandBlue.copy(alpha = 0.35f) else MaterialTheme.klinUpColors.redText.copy(alpha = 0.45f)
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = "📍 Localisation GPS du client requise *",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (hasValidOrderLocation) BrandText else MaterialTheme.klinUpColors.redText
                                        )
                                        Text(
                                            text = "Ce compte client n'a pas encore de coordonnées GPS renseignées. Saisissez sa latitude et longitude pour calculer les frais selon les zones de l'admin.",
                                            fontSize = 12.sp,
                                            color = InkSecondary
                                        )
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            OutlinedTextField(
                                                value = orderClientLat,
                                                onValueChange = { orderClientLat = it },
                                                label = { Text("Latitude *", fontSize = 12.sp) },
                                                placeholder = { Text("6.3703", fontSize = 12.sp) },
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                shape = RoundedCornerShape(14.dp),
                                                modifier = Modifier.weight(1f)
                                            )
                                            OutlinedTextField(
                                                value = orderClientLng,
                                                onValueChange = { orderClientLng = it },
                                                label = { Text("Longitude *", fontSize = 12.sp) },
                                                placeholder = { Text("2.3912", fontSize = 12.sp) },
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                shape = RoundedCornerShape(14.dp),
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                    }
                                }
                            }

                            // Avance & Mode Règlement
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = if (isSubscriptionPayment) "Avance (Bloqué)" else "Avance (FCFA)",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isSubscriptionPayment) InkMuted else InkSecondary
                                    )
                                    OutlinedTextField(
                                        value = if (isSubscriptionPayment) "0" else advanceText,
                                        onValueChange = { if (!isSubscriptionPayment) advanceText = it.filter { ch -> ch.isDigit() } },
                                        enabled = !isSubscriptionPayment,
                                        readOnly = isSubscriptionPayment,
                                        singleLine = true,
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        shape = RoundedCornerShape(16.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            unfocusedBorderColor = InnerBorder,
                                            focusedBorderColor = BrandBlue,
                                            disabledContainerColor = SegmentedBg,
                                            disabledBorderColor = CardBorder,
                                            disabledTextColor = InkMuted
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }

                                Column(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "Mode Règlement",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = InkSecondary
                                    )
                                    Box {
                                        Surface(
                                            onClick = { paymentDropdownExpanded = true },
                                            shape = RoundedCornerShape(16.dp),
                                            color = CardWhite,
                                            border = BorderStroke(1.dp, InnerBorder),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(56.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(horizontal = 14.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = paymentOption.label,
                                                    fontSize = 14.sp,
                                                    color = InkPrimary,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    modifier = Modifier.weight(1f)
                                                )
                                                Icon(
                                                    imageVector = TablerIcons.ChevronDown,
                                                    contentDescription = null,
                                                    tint = InkMuted
                                                )
                                            }
                                        }
                                        KlinUpDropdownMenu(
                                            expanded = paymentDropdownExpanded,
                                            onDismissRequest = { paymentDropdownExpanded = false }
                                        ) {
                                            PAYMENT_OPTIONS.forEach { option ->
                                                KlinUpDropdownItem(
                                                    text = option.label,
                                                    selected = paymentOption.key == option.key,
                                                    onClick = {
                                                        paymentOption = option
                                                        paymentDropdownExpanded = false
                                                    }
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            if (paymentOption.key == "mobile_money") {
                                com.klinup.app.ui.components.MomoOperatorSelector(
                                    selectedOperator = momoOperator,
                                    onSelect = { momoOperator = it }
                                )
                            }

                            if (isSubscriptionPayment) {
                                val cust = selectedCustomer
                                val activeSub = cust?.activeSubscription
                                val colors = MaterialTheme.klinUpColors

                                if (cust == null) {
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(14.dp),
                                        color = colors.softAmberBg,
                                        border = BorderStroke(1.dp, colors.amberText.copy(alpha = 0.35f))
                                    ) {
                                        Text(
                                            text = "Sélectionnez d'abord un client en haut du formulaire pour vérifier son abonnement ou lui en souscrire un.",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = colors.amberText,
                                            lineHeight = 17.sp,
                                            modifier = Modifier.padding(12.dp)
                                        )
                                    }
                                } else if (activeSub != null) {
                                    val hasEnough = activeSub.remainingClothes >= totalCount
                                    val afterCount = (activeSub.remainingClothes - totalCount).coerceAtLeast(0)
                                    val totalQuota = activeSub.totalClothes.coerceAtLeast(1)
                                    val remainingRatio = (activeSub.remainingClothes.toFloat() / totalQuota).coerceIn(0f, 1f)
                                    val afterRatio = (afterCount.toFloat() / totalQuota).coerceIn(0f, 1f)
                                    val accentColor = if (hasEnough) colors.skyText else colors.redText
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(16.dp),
                                        color = if (hasEnough) colors.softSkyBg else colors.softRedBg,
                                        border = BorderStroke(
                                            1.dp,
                                            if (hasEnough) colors.softSkyBorder else colors.softRedBorder
                                        )
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(14.dp),
                                            verticalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Row(
                                                    modifier = Modifier.weight(1f),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(30.dp)
                                                            .clip(RoundedCornerShape(9.dp))
                                                            .background(accentColor.copy(alpha = 0.14f)),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Icon(
                                                            imageVector = TablerIcons.Award,
                                                            contentDescription = null,
                                                            tint = accentColor,
                                                            modifier = Modifier.size(16.dp)
                                                        )
                                                    }
                                                    Text(
                                                        text = activeSub.name.ifBlank { "Abonnement actif" },
                                                        fontSize = 13.5.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = InkPrimary,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }

                                                Surface(
                                                    shape = RoundedCornerShape(999.dp),
                                                    color = CardWhite,
                                                    border = BorderStroke(1.dp, accentColor.copy(alpha = 0.28f))
                                                ) {
                                                    Text(
                                                        text = "${activeSub.remainingClothes} / ${activeSub.totalClothes}",
                                                        fontSize = 11.5.sp,
                                                        fontWeight = FontWeight.ExtraBold,
                                                        color = accentColor,
                                                        maxLines = 1,
                                                        softWrap = false,
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                                    )
                                                }
                                            }

                                            // Barre de progression avec aperçu de la déduction
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(6.dp)
                                                    .clip(RoundedCornerShape(999.dp))
                                                    .background(CardWhite.copy(alpha = 0.75f))
                                            ) {
                                                if (remainingRatio > 0f) {
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth(remainingRatio)
                                                            .height(6.dp)
                                                            .clip(RoundedCornerShape(999.dp))
                                                            .background(accentColor.copy(alpha = 0.28f))
                                                    )
                                                }
                                                if (hasEnough && afterRatio > 0f) {
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth(afterRatio)
                                                            .height(6.dp)
                                                            .clip(RoundedCornerShape(999.dp))
                                                            .background(accentColor)
                                                    )
                                                }
                                            }

                                            if (hasEnough) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                                ) {
                                                    Surface(
                                                        modifier = Modifier.weight(1f),
                                                        shape = RoundedCornerShape(12.dp),
                                                        color = CardWhite.copy(alpha = 0.85f)
                                                    ) {
                                                        Column(
                                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                                            verticalArrangement = Arrangement.spacedBy(2.dp)
                                                        ) {
                                                            Text(
                                                                text = "À déduire",
                                                                fontSize = 10.5.sp,
                                                                color = InkMuted
                                                            )
                                                            Text(
                                                                text = "-$totalCount vêtement(s)",
                                                                fontSize = 12.5.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = BrandText
                                                            )
                                                        }
                                                    }
                                                    Surface(
                                                        modifier = Modifier.weight(1f),
                                                        shape = RoundedCornerShape(12.dp),
                                                        color = CardWhite.copy(alpha = 0.85f)
                                                    ) {
                                                        Column(
                                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                                            verticalArrangement = Arrangement.spacedBy(2.dp)
                                                        ) {
                                                            Text(
                                                                text = "Reste après",
                                                                fontSize = 10.5.sp,
                                                                color = InkMuted
                                                            )
                                                            Text(
                                                                text = "$afterCount vêtement(s)",
                                                                fontSize = 12.5.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                color = GreenSuccess
                                                            )
                                                        }
                                                    }
                                                }
                                            } else {
                                                Text(
                                                    text = "Solde insuffisant : $totalCount vêtement(s) demandé(s) pour ${activeSub.remainingClothes} restant(s).",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = colors.redText
                                                )
                                            }
                                        }
                                    }
                                } else {
                                    // Client sans abonnement : suggestion directe de souscription
                                    Surface(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(16.dp),
                                        color = colors.softAmberBg,
                                        border = BorderStroke(1.dp, colors.amberText.copy(alpha = 0.35f))
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(14.dp),
                                            verticalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Text(
                                                text = "${cust.fullName} n'a pas d'abonnement actif",
                                                fontSize = 13.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = InkPrimary
                                            )
                                            Text(
                                                text = "Souscrivez un forfait ci-dessous pour régler cette commande par abonnement :",
                                                fontSize = 12.sp,
                                                color = InkSecondary,
                                                lineHeight = 16.sp
                                            )

                                            if (subscriptionPlans.isEmpty()) {
                                                Text(
                                                    text = "Aucun forfait d'abonnement disponible dans le catalogue.",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = colors.redText
                                                )
                                            } else {
                                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                    items(subscriptionPlans, key = { it.id }) { plan ->
                                                        val selectedPlan = suggestedSubPlan?.id == plan.id
                                                        val clothesHint = plan.nombreVetements?.let { " • $it vêt." } ?: ""
                                                        Surface(
                                                            onClick = { suggestedSubPlan = plan },
                                                            shape = RoundedCornerShape(14.dp),
                                                            color = if (selectedPlan) BrandBlue else CardWhite,
                                                            border = BorderStroke(
                                                                1.dp,
                                                                if (selectedPlan) BrandBlue else InnerBorder
                                                            )
                                                        ) {
                                                            Column(
                                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 9.dp),
                                                                verticalArrangement = Arrangement.spacedBy(2.dp)
                                                            ) {
                                                                Text(
                                                                    text = plan.article,
                                                                    fontSize = 12.5.sp,
                                                                    fontWeight = FontWeight.Bold,
                                                                    color = if (selectedPlan) Color.White else InkPrimary
                                                                )
                                                                Text(
                                                                    text = "${KlinUpRepository.formatFcfa(plan.prix)}$clothesHint",
                                                                    fontSize = 11.sp,
                                                                    color = if (selectedPlan) Color.White.copy(alpha = 0.88f) else InkMuted
                                                                )
                                                            }
                                                        }
                                                    }
                                                }

                                                Button(
                                                    onClick = {
                                                        val planToSubscribe = suggestedSubPlan ?: subscriptionPlans.firstOrNull()
                                                        if (planToSubscribe == null || isSubscribingInline) return@Button
                                                        inlineSubFeedback = null
                                                        pendingSubPaymentPlan = planToSubscribe
                                                    },
                                                    enabled = !isSubscribingInline && (suggestedSubPlan != null || subscriptionPlans.isNotEmpty()),
                                                    shape = RoundedCornerShape(50),
                                                    colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                                                    modifier = Modifier
                                                        .fillMaxWidth()
                                                        .height(42.dp)
                                                ) {
                                                    if (isSubscribingInline) {
                                                        CircularProgressIndicator(
                                                            modifier = Modifier.size(16.dp),
                                                            color = Color.White,
                                                            strokeWidth = 2.dp
                                                        )
                                                    } else {
                                                        val targetPlan = suggestedSubPlan ?: subscriptionPlans.first()
                                                        Text(
                                                            text = "Souscrire ${targetPlan.article} (${KlinUpRepository.formatFcfa(targetPlan.prix)})",
                                                            fontSize = 12.5.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = Color.White
                                                        )
                                                    }
                                                }
                                            }

                                            if (!inlineSubFeedback.isNullOrBlank()) {
                                                Text(
                                                    text = inlineSubFeedback!!,
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = colors.redText
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            // Réduction (Montant FCFA)
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(
                                    text = if (isSubscriptionPayment) "Réduction (Bloqué — Abonnement)" else "Réduction (Montant FCFA)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isSubscriptionPayment) InkMuted else InkSecondary
                                )
                                OutlinedTextField(
                                    value = if (isSubscriptionPayment) "0" else reductionText,
                                    onValueChange = { if (!isSubscriptionPayment) reductionText = it.filter { ch -> ch.isDigit() } },
                                    enabled = !isSubscriptionPayment,
                                    readOnly = isSubscriptionPayment,
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        unfocusedBorderColor = InnerBorder,
                                        focusedBorderColor = BrandBlue,
                                        disabledContainerColor = SegmentedBg,
                                        disabledBorderColor = CardBorder,
                                        disabledTextColor = InkMuted
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }

                // ── 4. Récapitulatif de la Facture ─────────────────────
                item {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text(
                                text = "Récapitulatif de la Facture",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkPrimary
                            )

                            SummaryLine(
                                label = "Total Articles ($totalCount)",
                                value = if (isSubscriptionPayment) "Inclus (Abonnement)" else KlinUpRepository.formatFcfa(itemsTotal),
                                labelColor = InkSecondary,
                                valueColor = if (isSubscriptionPayment) GreenSuccess else InkPrimary,
                                bold = false
                            )

                            if (isSubscriptionPayment) {
                                SummaryLine(
                                    label = "Vêtements déduits",
                                    value = "- $totalCount vêtement(s)",
                                    labelColor = InkSecondary,
                                    valueColor = BrandText,
                                    bold = false
                                )
                            }

                            if (urgency == "Express" || expressFee > 0.0) {
                                SummaryLine(
                                    label = "Majoration Express (+${appSettings.expressMarkup}%)",
                                    value = "+ ${KlinUpRepository.formatFcfa(expressFee)}",
                                    labelColor = InkSecondary,
                                    valueColor = AmberBolt,
                                    bold = false
                                )
                            }

                            if (!isFreeDeliverySub) {
                                SummaryLine(
                                    label = if (homeDelivery && deliveryCalc != null) {
                                        "Frais de livraison (${deliveryCalc.distanceKm} km)"
                                    } else {
                                        "Frais de livraison"
                                    },
                                    value = if (deliveryFee > 0.0) "+ ${KlinUpRepository.formatFcfa(deliveryFee)}" else KlinUpRepository.formatFcfa(0.0),
                                    labelColor = InkSecondary,
                                    valueColor = if (deliveryFee > 0.0) BrandText else InkMuted,
                                    bold = false
                                )
                            }

                            if (homePickup || pickupFee > 0.0) {
                                SummaryLine(
                                    label = if (pickupCalc != null) {
                                        "Frais de récupération (${pickupCalc.distanceKm} km)"
                                    } else {
                                        "Frais de récupération"
                                    },
                                    value = if (pickupFee > 0.0) "+ ${KlinUpRepository.formatFcfa(pickupFee)}" else KlinUpRepository.formatFcfa(0.0),
                                    labelColor = InkSecondary,
                                    valueColor = if (pickupFee > 0.0) BrandText else InkMuted,
                                    bold = false
                                )
                            }

                            SummaryLine(
                                label = "Total Brut",
                                value = KlinUpRepository.formatFcfa(grossTotal),
                                labelColor = InkSecondary,
                                valueColor = InkPrimary,
                                bold = false
                            )

                            SummaryLine(
                                label = "Réduction",
                                value = if (reductionAmount > 0.0) "- ${KlinUpRepository.formatFcfa(reductionAmount)}" else KlinUpRepository.formatFcfa(0.0),
                                labelColor = InkSecondary,
                                valueColor = if (reductionAmount > 0.0) MaterialTheme.klinUpColors.redText else InkMuted,
                                bold = false
                            )

                            HorizontalDivider(color = MaterialTheme.klinUpColors.divider)

                            SummaryLine(
                                label = "Total Net À Payer",
                                value = KlinUpRepository.formatFcfa(netTotal),
                                labelColor = InkPrimary,
                                valueColor = BrandText,
                                bold = true
                            )

                            SummaryLine(
                                label = "Avance payée",
                                value = KlinUpRepository.formatFcfa(advanceAmount),
                                labelColor = InkSecondary,
                                valueColor = if (advanceAmount > 0.0) GreenSuccess else InkMuted,
                                bold = false
                            )

                            SummaryLine(
                                label = "Reste à régler",
                                value = KlinUpRepository.formatFcfa(remainingAmount),
                                labelColor = InkPrimary,
                                valueColor = if (remainingAmount == 0.0) GreenSuccess else MaterialTheme.klinUpColors.redText,
                                bold = true
                            )

                            HorizontalDivider(color = MaterialTheme.klinUpColors.divider)

                            SummaryLine(
                                label = "Mode de Règlement",
                                value = paymentOption.label,
                                labelColor = InkSecondary,
                                valueColor = InkPrimary,
                                bold = false,
                                valueBold = true
                            )
                        }
                    }
                }

                // ── Bottom Buttons (Annuler / Créer la Commande) ───────
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp, bottom = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                resetOrderForm()
                            },
                            enabled = !isSubmitting,
                            modifier = Modifier
                                .weight(1f)
                                .height(52.dp),
                            shape = RoundedCornerShape(50),
                            color = SegmentedBg
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = "Annuler",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkSecondary
                                )
                            }
                        }

                        Button(
                            onClick = {
                                if (totalCount == 0) {
                                    errorMessage = "Ajoutez au moins un vêtement à la commande."
                                    return@Button
                                }
                                if (selectedCustomer == null) {
                                    errorMessage = "Veuillez sélectionner un client."
                                    return@Button
                                }
                                if (isSubscriptionPayment) {
                                    val sub = selectedCustomer?.activeSubscription
                                    if (sub == null) {
                                        errorMessage = "Ce client ne possède pas d'abonnement actif. Veuillez lui souscrire un forfait ou changer de mode de règlement."
                                        return@Button
                                    }
                                    if (sub.remainingClothes < totalCount) {
                                        errorMessage = "Solde d'abonnement insuffisant (${sub.remainingClothes} vêtement(s) restant(s) pour $totalCount demandé(s))."
                                        return@Button
                                    }
                                }
                                if ((homeDelivery || homePickup) && !hasValidOrderLocation) {
                                    errorMessage = "Veuillez renseigner les coordonnées GPS (latitude et longitude) du client pour calculer les frais de livraison/récupération."
                                    return@Button
                                }
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                isSubmitting = true
                                errorMessage = null

                                val items = availableCatalog.mapNotNull { cat ->
                                    val q = counts[cat.id] ?: 0
                                    if (q > 0) OrderItem(id = cat.id, article = cat.article, service = cat.service, quantite = q, prix = cat.prix) else null
                                }

                                scope.launch {
                                    val cust = selectedCustomer
                                    if (cust != null && cust.resolvedLatLng == null && parsedOrderLat != null && parsedOrderLng != null) {
                                        KlinUpRepository.updateCustomerLocation(cust.id, parsedOrderLat, parsedOrderLng)
                                    }
                                    val res = KlinUpRepository.createOrder(
                                        existingCustomer = selectedCustomer,
                                        newClientName = selectedCustomer?.fullName ?: "Client Passage",
                                        newClientPhone = selectedCustomer?.telephone ?: "",
                                        selectedItems = items,
                                        avancePayee = advanceAmount,
                                        modeReglement = paymentOption.key,
                                        niveauUrgence = urgency,
                                        reduction = reductionAmount,
                                        deliveryFee = deliveryFee,
                                        pickupFee = pickupFee,
                                        expressFee = expressFee,
                                        homeDelivery = homeDelivery,
                                        homePickup = homePickup
                                    )
                                    isSubmitting = false
                                    if (res.isSuccess) {
                                        res.getOrNull()?.let { (createdOrder, resolvedCustomer) ->
                                            val formattedPhone = KlinUpRepository.formatPhoneForWhatsApp(
                                                phoneStr = resolvedCustomer.telephone,
                                                indicatif = resolvedCustomer.indicatif ?: "229"
                                            )
                                            if (formattedPhone.isNotBlank()) {
                                                val storeName = stores.firstOrNull { it.id == createdOrder.storeId }?.nom
                                                val message = KlinUpRepository.buildOrderCreatedWhatsAppMessage(
                                                    order = createdOrder,
                                                    customer = resolvedCustomer,
                                                    storeName = storeName
                                                )
                                                val waIntent = Intent(
                                                    Intent.ACTION_VIEW,
                                                    Uri.parse("https://wa.me/$formattedPhone?text=${Uri.encode(message)}")
                                                )
                                                runCatching { context.startActivity(waIntent) }
                                            }
                                        }
                                        resetOrderForm()
                                        onOrderCreated()
                                    } else {
                                        errorMessage = res.exceptionOrNull()?.message ?: "Impossible de créer la commande"
                                    }
                                }
                            },
                            enabled = !isSubmitting,
                            modifier = Modifier
                                .weight(1.7f)
                                .height(52.dp),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                        ) {
                            if (isSubmitting) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Icon(
                                    imageVector = TablerIcons.ShoppingBag,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Créer la Commande",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Subscription Payment Confirmation Dialog (identical to settlement modal) ─
    pendingSubPaymentPlan?.let { planToPay ->
        val targetCust = selectedCustomer
        if (targetCust != null) {
            com.klinup.app.ui.components.SubscriptionPaymentDialog(
                planName = planToPay.article,
                planPrice = planToPay.prix,
                customerName = targetCust.fullName,
                isSubmitting = isSubscribingInline,
                onDismiss = { if (!isSubscribingInline) pendingSubPaymentPlan = null },
                onConfirm = { _, _, _, _ ->
                    isSubscribingInline = true
                    inlineSubFeedback = null
                    scope.launch {
                        val subRes = KlinUpRepository.subscribeCustomer(targetCust.id, planToPay)
                        isSubscribingInline = false
                        subRes.onSuccess { newSub ->
                            selectedCustomer = targetCust.copy(activeSubscription = newSub)
                            suggestedSubPlan = null
                            pendingSubPaymentPlan = null
                            inlineSubFeedback = null
                        }.onFailure { err ->
                            inlineSubFeedback = err.message ?: "Erreur lors de la souscription."
                            pendingSubPaymentPlan = null
                        }
                    }
                }
            )
        }
    }

    // ── Searchable Client Picker Bottom Sheet ──────────────────────────
    if (showCustomerPicker) {
        val customerSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        var query by remember { mutableStateOf("") }
        val matches = remember(storeCustomers, query) {
            if (query.isBlank()) storeCustomers
            else storeCustomers.filter {
                it.fullName.contains(query, ignoreCase = true) ||
                    it.telephone.contains(query, ignoreCase = true)
            }
        }

        ModalBottomSheet(
            onDismissRequest = { showCustomerPicker = false },
            sheetState = customerSheetState,
            containerColor = PageBg,
            contentColor = InkPrimary,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.80f)
                    .navigationBarsPadding()
                    .imePadding()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Sélectionner un client",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary
                        )
                        Text(
                            text = "${matches.size} client${if (matches.size > 1) "s" else ""} ${if (query.isBlank()) "disponible" else "trouvé"}${if (matches.size > 1) "s" else ""}",
                            fontSize = 12.sp,
                            color = InkSecondary
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                showCustomerPicker = false
                                topTab = CreateTopTab.CLIENT
                            },
                            shape = RoundedCornerShape(999.dp),
                            color = SoftBlueBg,
                            border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.25f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.UserPlus,
                                    contentDescription = null,
                                    tint = BrandText,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "Nouveau",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = BrandText
                                )
                            }
                        }

                        IconButton(onClick = { showCustomerPicker = false }) {
                            Icon(
                                imageVector = TablerIcons.X,
                                contentDescription = "Fermer",
                                tint = InkSecondary
                            )
                        }
                    }
                }

                // Search Field
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Nom ou téléphone...", color = InkMuted, fontSize = 14.sp) },
                    leadingIcon = {
                        Icon(
                            imageVector = TablerIcons.Search,
                            contentDescription = null,
                            tint = InkSecondary
                        )
                    },
                    trailingIcon = {
                        if (query.isNotEmpty()) {
                            IconButton(onClick = { query = "" }) {
                                Icon(
                                    imageVector = TablerIcons.X,
                                    contentDescription = "Effacer",
                                    tint = InkMuted,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = CardWhite,
                        unfocusedContainerColor = CardWhite,
                        focusedBorderColor = BrandBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedTextColor = InkPrimary,
                        unfocusedTextColor = InkPrimary
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Customer List or Empty State
                if (matches.isEmpty()) {
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(CircleShape)
                                    .background(SoftBlueBg),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = TablerIcons.User,
                                    contentDescription = null,
                                    tint = BrandText,
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Aucun client trouvé",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkPrimary
                            )
                            Text(
                                text = "Essayez un autre nom/numéro ou créez un nouveau client.",
                                fontSize = 12.sp,
                                color = InkSecondary
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    showCustomerPicker = false
                                    topTab = CreateTopTab.CLIENT
                                },
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.UserPlus,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Créer un nouveau client", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        contentPadding = PaddingValues(bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(matches, key = { it.id }) { cust ->
                            val isSelected = selectedCustomer?.id == cust.id
                            val initials = remember(cust.fullName) {
                                cust.fullName
                                    .trim()
                                    .split(Regex("\\s+"))
                                    .filter { it.isNotBlank() }
                                    .take(2)
                                    .mapNotNull { it.firstOrNull()?.uppercaseChar() }
                                    .joinToString("")
                                    .ifEmpty { "C" }
                            }
                            Surface(
                                onClick = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    selectedCustomer = cust
                                    if (errorMessage == "Veuillez sélectionner un client.") {
                                        errorMessage = null
                                    }
                                    showCustomerPicker = false
                                },
                                shape = RoundedCornerShape(16.dp),
                                color = if (isSelected) SoftBlueBg else CardWhite,
                                border = BorderStroke(
                                    width = if (isSelected) 1.5.dp else 1.dp,
                                    color = if (isSelected) BrandBlue else CardBorder
                                )
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 12.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(
                                                if (isSelected) BrandBlue.copy(alpha = 0.16f)
                                                else SegmentedBg
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = initials,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (isSelected) BrandText else InkPrimary
                                        )
                                    }

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = cust.fullName,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = InkPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = cust.telephone.ifBlank { "Sans numéro" },
                                            fontSize = 12.sp,
                                            color = InkSecondary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        val activeSub = cust.activeSubscription
                                        if (activeSub != null && activeSub.remainingClothes > 0) {
                                            Text(
                                                text = "Abo : ${activeSub.remainingClothes} vêt. restants",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = GreenSuccess,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Surface(
                                            shape = RoundedCornerShape(999.dp),
                                            color = SoftBlueBg
                                        ) {
                                            Text(
                                                text = "${cust.pointsFidelite} pts",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = BrandText,
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                            )
                                        }
                                        if (isSelected) {
                                            Icon(
                                                imageVector = TablerIcons.CircleCheck,
                                                contentDescription = "Sélectionné",
                                                tint = MaterialTheme.klinUpColors.brandText,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ── Service Variant Picker Dialog ──────────────────────────────────
    if (articleModalGroup != null) {
        val (articleName, variants) = articleModalGroup!!
        AlertDialog(
            onDismissRequest = { articleModalGroup = null },
            containerColor = CardWhite,
            title = { Text(articleName, color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Choisissez le service :", fontSize = 13.sp, color = InkSecondary)
                    variants.forEach { variant ->
                        val qty = counts[variant.id] ?: 0
                        Surface(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                counts[variant.id] = qty + 1
                            },
                            shape = RoundedCornerShape(14.dp),
                            color = if (qty > 0) SoftBlueBg else PageBg,
                            border = BorderStroke(1.dp, if (qty > 0) BrandText else InnerBorder)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = variant.service.replace("_", " ").replaceFirstChar { it.uppercase() },
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = InkPrimary
                                    )
                                    Text(
                                        text = KlinUpRepository.formatFcfa(variant.prix),
                                        fontSize = 12.sp,
                                        color = BrandText,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = if (qty > 0) "x$qty (+1)" else "+ Ajouter",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandText
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { articleModalGroup = null },
                    colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                ) {
                    Text("Terminé", color = Color.White)
                }
            }
        )
    }
}

@Composable
private fun OptionToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onToggle: () -> Unit
) {
    Surface(
        onClick = onToggle,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.klinUpColors.cardSubtleBg,
        border = BorderStroke(1.dp, if (checked) BrandText.copy(alpha = 0.5f) else InnerBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = InkMuted
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Surface(
                shape = RoundedCornerShape(50),
                color = if (checked) BrandBlue else MaterialTheme.klinUpColors.trackBg
            ) {
                Text(
                    text = if (checked) "Oui" else "Non",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (checked) Color.White else InkSecondary,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }
        }
    }
}

@Composable
private fun SummaryLine(
    label: String,
    value: String,
    labelColor: Color,
    valueColor: Color,
    bold: Boolean,
    valueBold: Boolean = bold
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            fontWeight = if (bold) FontWeight.Bold else FontWeight.Normal,
            color = labelColor
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = if (valueBold) FontWeight.Bold else FontWeight.SemiBold,
            color = valueColor
        )
    }
}

private fun estimateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
    val r = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = sin(dLat / 2) * sin(dLat / 2) +
        cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2)
    return r * 2 * atan2(sqrt(a), sqrt(1 - a))
}
