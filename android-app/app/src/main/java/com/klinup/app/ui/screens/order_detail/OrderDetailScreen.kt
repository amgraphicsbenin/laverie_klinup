package com.klinup.app.ui.screens.order_detail

import com.klinup.app.ui.components.TablerIcons

import com.klinup.app.ui.screens.gestion.InProgressStatusIcon
import com.klinup.app.ui.screens.gestion.OrderClosingSuccessOverlay
import kotlinx.coroutines.delay
import com.klinup.app.ui.components.OrderInvoiceDialog
import com.klinup.app.ui.components.OrderPaymentSettlementDialog
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
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Autorenew
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.LocalLaundryService
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val PageBg: Color        @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val BrandBlue            = Color(0xFF2600F5)
private val BrandText: Color     @Composable get() = MaterialTheme.klinUpColors.brandText
private val PrimaryPurple        = Color(0xFF7E22CE)
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted
private val CancelBg: Color      @Composable get() = MaterialTheme.klinUpColors.softRedBg
private val CancelBorder: Color  @Composable get() = MaterialTheme.klinUpColors.softRedBorder
private val CancelRed: Color     @Composable get() = MaterialTheme.klinUpColors.redText
private val GreenPaid: Color     @Composable get() = MaterialTheme.klinUpColors.greenText

@Composable
fun OrderDetailScreen(
    orderId: String,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current

    val orders by KlinUpRepository.orders.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()

    val order = remember(orders, orderId) { orders.firstOrNull { it.id == orderId } }
    val customer = remember(customers, order) {
        order?.customerId?.let { cid -> customers.firstOrNull { it.id == cid } }
    }
    val storeName = remember(stores, order) {
        order?.storeId?.let { sid -> stores.firstOrNull { it.id == sid }?.nom }
    }

    var isUpdating by remember { mutableStateOf(false) }
    var showCancelDialog by remember { mutableStateOf(false) }
    var showInvoiceDialog by remember { mutableStateOf(false) }
    var showClosingSuccess by remember { mutableStateOf(false) }
    var paymentPromptStatus by remember { mutableStateOf<String?>(null) }
    var isSettlingPayment by remember { mutableStateOf(false) }

    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    val appColors = MaterialTheme.klinUpColors

    if (order == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(PageBg)
                .padding(top = statusBarTop + 16.dp, start = 20.dp, end = 20.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(appColors.chipBg)
                    .clickable(role = Role.Button, onClick = onBack),
                contentAlignment = Alignment.Center
            ) {
                Icon(TablerIcons.ArrowLeft, contentDescription = "Retour", tint = InkPrimary)
            }
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Commande introuvable", color = InkMuted, fontSize = 15.sp)
            }
        }
        return
    }

    val orderNum = order.identifiantUniqueMarquage?.takeIf { it.isNotBlank() } ?: order.id
    val clientName = customer?.fullName ?: "Client Passage"
    val clientPhone = customer?.telephone?.takeIf { it.isNotBlank() } ?: "—"
    val statusLabel = KlinUpRepository.orderStatusLabel(order.statut)
    val nextStatus = KlinUpRepository.nextOrderStatus(order.statut)

    val (badgeBg, badgeText) = when (order.statut) {
        "pret", "a_recuperer", "a_livrer" -> appColors.softGreenBg to GreenPaid
        "en_cours_lavage", "lavage_cours", "en_cours_repassage", "repassage_cours", "traitement" ->
            appColors.softSkyBg to appColors.skyText
        "restitue", "livre" -> appColors.chipBg to InkSecondary
        "annule" -> CancelBg to CancelRed
        else -> appColors.softAmberBg to appColors.amberText
    }

    val remaining = (order.prixTotal - order.avancePayee).coerceAtLeast(0.0)
    val hasDeliveryOption = KlinUpRepository.hasDeliveryOption(order)
    val isInProgressStatus = order.statut in setOf(
        "traitement",
        "en_cours_lavage",
        "lavage_cours",
        "en_cours_repassage",
        "repassage_cours",
        "en_cours_livraison"
    )
    val statusActionConfig = when (order.statut) {
        "en_attente_validation" -> Triple("Valider réception", Color(0xFFD97706), TablerIcons.ShieldCheck)
        "en_attente", "attente" -> Triple("Démarrer lavage", Color(0xFF0284C7), TablerIcons.WashMachine)
        "traitement", "en_cours_lavage", "lavage_cours" -> Triple("Lavage en cours", Color(0xFF0284C7), TablerIcons.WashMachine)
        "en_cours_repassage", "repassage_cours" -> Triple("Repassage en cours", Color(0xFF0000FF), TablerIcons.Refresh)
        "pret" -> Triple("Prêt pour livraison", Color(0xFF7C3AED), TablerIcons.TruckDelivery)
        "a_recuperer" -> Triple("Confirmer le retrait", Color(0xFF008A00), TablerIcons.Check)
        "a_livrer" -> Triple("Démarrer la livraison", Color(0xFF0D2FE8), TablerIcons.TruckDelivery)
        "en_cours_livraison" -> Triple("Livraison en cours", Color(0xFF0D9488), TablerIcons.TruckDelivery)
        else -> null
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
        // ── Top Bar ───────────────────────────────────────────────────────────
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = CardWhite,
            shadowElevation = 0.dp
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = statusBarTop + 8.dp, bottom = 12.dp, start = 16.dp, end = 16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(appColors.chipBg)
                        .clickable(role = Role.Button, onClick = onBack)
                        .align(Alignment.CenterStart),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = TablerIcons.ArrowLeft,
                        contentDescription = "Retour",
                        tint = InkPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Text(
                    text = "Commande $orderNum",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkPrimary,
                    modifier = Modifier.align(Alignment.Center)
                )

                Surface(
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .clip(RoundedCornerShape(10.dp))
                        .clickable(role = Role.Button) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showInvoiceDialog = true
                        },
                    shape = RoundedCornerShape(10.dp),
                    color = appColors.softBlueBg,
                    border = BorderStroke(1.dp, appColors.softBlueBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Receipt,
                            contentDescription = "Facture",
                            tint = appColors.brandText,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = "Facture",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = appColors.brandText
                        )
                    }
                }
            }
        }

        // ── Scrollable Body ───────────────────────────────────────────────────
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // 1. Customer & Status & Subscription Card
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
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = appColors.softBlueBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.User,
                                    contentDescription = null,
                                    tint = BrandText,
                                    modifier = Modifier.size(15.dp)
                                )
                                Text(
                                    text = clientName,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandText,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Text(
                            text = "Téléphone : $clientPhone",
                            fontSize = 13.sp,
                            color = InkMuted
                        )

                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = badgeBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Clock,
                                    contentDescription = null,
                                    tint = badgeText,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = statusLabel,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = badgeText
                                )
                            }
                        }

                        val sub = order.subscriptionDetails
                        if (order.isSubscriptionOrder || sub != null || order.modeReglement.equals("abonnement", ignoreCase = true)) {
                            val used = sub?.vetementsUtilises ?: sub?.usedClothes ?: 0
                            val total = (sub?.vetementsInclus ?: sub?.totalClothes ?: 25).coerceAtLeast(1)
                            val ratio = (used.toFloat() / total.toFloat()).coerceIn(0f, 1f)

                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                color = appColors.cardSubtleBg,
                                border = BorderStroke(1.dp, appColors.innerBorder)
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Abonnement : ${sub?.planName ?: "Offre Active"}",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = InkSecondary
                                        )
                                        Text(
                                            text = "$used / $total vêt.",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = BrandText
                                        )
                                    }
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(999.dp))
                                            .background(appColors.trackBg)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth(ratio)
                                                .fillMaxHeight()
                                                .clip(RoundedCornerShape(999.dp))
                                                .background(BrandBlue)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2. DÉTAIL DES ARTICLES
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DetailSectionTitle("DÉTAIL DES ARTICLES")
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            val itemsList = order.items.orEmpty()
                            if (itemsList.isNotEmpty()) {
                                itemsList.forEachIndexed { idx, item ->
                                    if (idx > 0) HorizontalDivider(color = appColors.divider)
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "${item.article} (${item.service}) x${item.quantite}",
                                            fontSize = 14.sp,
                                            color = InkSecondary,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Text(
                                            text = KlinUpRepository.formatFcfa(item.prix * item.quantite),
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = InkPrimary
                                        )
                                    }
                                }
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(
                                        text = "${order.typeArticle} (${order.typeService})",
                                        fontSize = 14.sp,
                                        color = InkSecondary
                                    )
                                    Text(
                                        text = KlinUpRepository.formatFcfa(order.prixTotal),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = InkPrimary
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. DÉTAIL DE LA FACTURATION
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DetailSectionTitle("DÉTAIL DE LA FACTURATION")
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Sous-total brut", fontSize = 14.sp, color = InkMuted)
                                Text(
                                    KlinUpRepository.formatFcfa(order.prixTotal),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            HorizontalDivider(color = appColors.divider)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Net à payer", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = InkPrimary)
                                Text(
                                    KlinUpRepository.formatFcfa(order.prixTotal),
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = BrandText
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Avance payée", fontSize = 14.sp, color = InkMuted)
                                Text(
                                    KlinUpRepository.formatFcfa(order.avancePayee),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = GreenPaid
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Reste à payer", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = InkPrimary)
                                Text(
                                    KlinUpRepository.formatFcfa(remaining),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (remaining > 0.0) CancelRed else GreenPaid
                                )
                            }
                        }
                    }
                }
            }

            // 4. INFORMATIONS DE RETRAIT & PAIEMENT
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    DetailSectionTitle("INFORMATIONS DE RETRAIT & PAIEMENT")
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Calendar,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text("Date de retrait :", fontSize = 13.sp, color = InkMuted)
                                Text(
                                    text = formatShortFrenchDate(order.dueDate),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.CreditCard,
                                    contentDescription = null,
                                    tint = Color(0xFF94A3B8),
                                    modifier = Modifier.size(16.dp)
                                )
                                Text("Mode de règlement :", fontSize = 13.sp, color = InkMuted)
                                Text(
                                    text = order.modeReglement,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }

                            if (order.isCompletedOrCancelled) {
                                var createdByAgent by remember(order.id) {
                                    mutableStateOf(
                                        order.createdByName?.takeIf { it.isNotBlank() }
                                            ?: KlinUpRepository.resolveStaffName(order.createdById)
                                    )
                                }
                                var processedByAgent by remember(order.id) {
                                    mutableStateOf<String?>(null)
                                }
                                LaunchedEffect(order.id, order.statut) {
                                    val (created, processed) = KlinUpRepository.getOrderHandlers(order)
                                    createdByAgent = created
                                    processedByAgent = processed
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = TablerIcons.User,
                                        contentDescription = null,
                                        tint = Color(0xFF94A3B8),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text("Créée par :", fontSize = 13.sp, color = InkMuted)
                                    Text(
                                        text = createdByAgent ?: "Non renseigné",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = InkPrimary
                                    )
                                }

                                val handlerLabel = if (order.statut == "annule") "Annulée par :" else "Traitée par :"
                                val handlerName = processedByAgent ?: createdByAgent
                                if (!handlerName.isNullOrBlank()) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.ShieldCheck,
                                            contentDescription = null,
                                            tint = Color(0xFF94A3B8),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(handlerLabel, fontSize = 13.sp, color = InkMuted)
                                        Text(
                                            text = handlerName,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = InkPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Bottom Actions ────────────────────────────────────────────────────
        if (!order.isCompletedOrCancelled) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PageBg)
                    .windowInsetsPadding(WindowInsets.navigationBars)
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val currentUser by KlinUpRepository.currentUser.collectAsState()
                val canCancelOrder = currentUser?.canCancelOrders ?: false
                if (canCancelOrder) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .clickable(role = Role.Button, enabled = !isUpdating) {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                showCancelDialog = true
                            },
                        shape = RoundedCornerShape(16.dp),
                        color = CancelBg,
                        border = BorderStroke(1.dp, CancelBorder)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = TablerIcons.Ban,
                                contentDescription = null,
                                tint = CancelRed,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Annuler cette commande",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = CancelRed
                            )
                        }
                    }
                }

                val triggerStatusChange: (String) -> Unit = { targetStatus ->
                    if (KlinUpRepository.requiresRemainingPayment(order, targetStatus)) {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        paymentPromptStatus = targetStatus
                    } else if (targetStatus == "restitue") {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        showClosingSuccess = true
                        scope.launch {
                            val updateJob = launch {
                                KlinUpRepository.updateOrderStatus(order.id, targetStatus)
                            }
                            delay(5000L)
                            updateJob.join()
                            showClosingSuccess = false
                        }
                    } else {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        isUpdating = true
                        scope.launch {
                            val res = KlinUpRepository.updateOrderStatus(order.id, targetStatus)
                            isUpdating = false
                            if (res.isSuccess) {
                                KlinUpRepository.notifyOrderReadyIfApplicable(context, order, targetStatus)
                            }
                        }
                    }
                }

                if (order.statut == "pret") {
                    val canMarkPickup = currentUser?.canPerformOrderTransition(order.statut, "a_recuperer") ?: false
                    val canMarkDelivery = currentUser?.canPerformOrderTransition(order.statut, "a_livrer") ?: false
                    if (hasDeliveryOption) {
                        if (canMarkDelivery) {
                            Button(
                                onClick = { triggerStatusChange("a_livrer") },
                                enabled = !isUpdating,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp),
                                shape = RoundedCornerShape(999.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                            ) {
                                if (isUpdating) {
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                } else {
                                    Icon(TablerIcons.TruckDelivery, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Prêt pour livraison", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }
                    } else if (canMarkPickup || canMarkDelivery) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            if (canMarkPickup) {
                                Button(
                                    onClick = { triggerStatusChange("a_recuperer") },
                                    enabled = !isUpdating,
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp),
                                    shape = RoundedCornerShape(999.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488))
                                ) {
                                    Icon(TablerIcons.ShoppingBag, contentDescription = null, tint = Color.White, modifier = Modifier.size(17.dp))
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text("Retrait sur place", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }

                            if (canMarkDelivery) {
                                Button(
                                    onClick = { triggerStatusChange("a_livrer") },
                                    enabled = !isUpdating,
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp),
                                    shape = RoundedCornerShape(999.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED))
                                ) {
                                    Icon(TablerIcons.TruckDelivery, contentDescription = null, tint = Color.White, modifier = Modifier.size(17.dp))
                                    Spacer(modifier = Modifier.width(5.dp))
                                    Text("Prêt pour livraison", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                }
                            }
                        }
                    }
                } else if (nextStatus != null && statusActionConfig != null) {
                    val (stepLabel, stepColor, stepIcon) = statusActionConfig
                    val canAdvanceOrder = currentUser?.canPerformOrderTransition(order.statut, nextStatus) ?: false
                    if (isInProgressStatus) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Surface(
                                modifier = Modifier
                                    .weight(1.45f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(999.dp),
                                color = stepColor
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(horizontal = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    InProgressStatusIcon(
                                        statut = order.statut,
                                        icon = stepIcon,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = stepLabel,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            if (canAdvanceOrder) {
                                Button(
                                    onClick = { triggerStatusChange(nextStatus) },
                                    enabled = !isUpdating,
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(48.dp),
                                    shape = RoundedCornerShape(999.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF008A00))
                                ) {
                                    if (isUpdating) {
                                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                    } else {
                                        Icon(
                                            imageVector = TablerIcons.Check,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Terminer",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    } else if (canAdvanceOrder) {
                        Button(
                            onClick = { triggerStatusChange(nextStatus) },
                            enabled = !isUpdating,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(999.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = stepColor)
                        ) {
                            if (isUpdating) {
                                CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                            } else {
                                Icon(
                                    imageVector = stepIcon,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = stepLabel,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PageBg)
                    .windowInsetsPadding(WindowInsets.navigationBars)
                    .padding(horizontal = 20.dp, vertical = 14.dp)
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .clickable(role = Role.Button) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showInvoiceDialog = true
                        },
                    shape = RoundedCornerShape(999.dp),
                    color = appColors.softBlueBg,
                    border = BorderStroke(1.dp, appColors.softBlueBorder)
                ) {
                    Row(
                        modifier = Modifier.fillMaxSize(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = TablerIcons.Receipt,
                            contentDescription = null,
                            tint = appColors.brandText,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Facture",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = appColors.brandText
                        )
                    }
                }
            }
        }
        }

        if (showClosingSuccess) {
            OrderClosingSuccessOverlay(
                ticketLabel = order.ticketLabel,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            )
        }
    }

    paymentPromptStatus?.let { targetStatus ->
        OrderPaymentSettlementDialog(
            order = order,
            targetStatus = targetStatus,
            isSubmitting = isSettlingPayment,
            onDismiss = { if (!isSettlingPayment) paymentPromptStatus = null },
            onConfirm = { amountPaid, paymentMethod, momoRef, momoOp ->
                isSettlingPayment = true
                scope.launch {
                    val res = KlinUpRepository.deliverOrderWithPayment(
                        order = order,
                        amountPaid = amountPaid,
                        paymentMethod = paymentMethod,
                        targetStatus = targetStatus,
                        momoReference = momoRef,
                        momoOperator = momoOp
                    )
                    isSettlingPayment = false
                    if (res.isSuccess) {
                        paymentPromptStatus = null
                        if (targetStatus == "restitue") {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            showClosingSuccess = true
                            delay(5000L)
                            showClosingSuccess = false
                        } else {
                            KlinUpRepository.notifyOrderReadyIfApplicable(context, order, targetStatus)
                        }
                    }
                }
            }
        )
    }

    if (showInvoiceDialog) {
        OrderInvoiceDialog(
            order = order,
            customer = customer,
            storeName = storeName,
            onDismiss = { showInvoiceDialog = false }
        )
    }

    if (showCancelDialog) {
        var cancelReason by remember { mutableStateOf("") }
        var showReasonError by remember { mutableStateOf(false) }
        val isReasonValid = cancelReason.trim().isNotEmpty()
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            containerColor = CardWhite,
            title = { Text("Annuler la commande ?", color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Voulez-vous vraiment annuler la Commande $orderNum ?", color = InkMuted)
                    Text(
                        text = "Motif de l'annulation *",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkPrimary
                    )
                    OutlinedTextField(
                        value = cancelReason,
                        onValueChange = {
                            cancelReason = it
                            if (showReasonError && it.trim().isNotEmpty()) showReasonError = false
                        },
                        placeholder = { Text("Ex : Erreur de saisie, demande client...", color = InkMuted) },
                        isError = showReasonError,
                        supportingText = {
                            Text(
                                text = if (showReasonError) "Le motif est obligatoire pour annuler." else "Champ obligatoire",
                                color = if (showReasonError) CancelRed else InkMuted
                            )
                        },
                        singleLine = false,
                        minLines = 2,
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = InkPrimary,
                            unfocusedTextColor = InkPrimary,
                            focusedContainerColor = CardWhite,
                            unfocusedContainerColor = MaterialTheme.klinUpColors.chipBg,
                            focusedBorderColor = BrandBlue,
                            unfocusedBorderColor = Color(0xFF94A3B8),
                            errorBorderColor = CancelRed,
                            errorContainerColor = CancelRed.copy(alpha = 0.05f),
                            cursorColor = BrandBlue
                        )
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        val trimmed = cancelReason.trim()
                        if (trimmed.isEmpty()) {
                            showReasonError = true
                            return@TextButton
                        }
                        showCancelDialog = false
                        isUpdating = true
                        scope.launch {
                            KlinUpRepository.updateOrderStatus(order.id, "annule", reason = trimmed)
                            isUpdating = false
                            onBack()
                        }
                    }
                ) {
                    Text(
                        "Confirmer l'annulation",
                        color = if (isReasonValid) CancelRed else CancelRed.copy(alpha = 0.45f),
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("Retour", color = InkSecondary)
                }
            }
        )
    }
}

@Composable
private fun DetailSectionTitle(text: String) {
    Text(
        text = text,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.8.sp,
        color = InkMuted
    )
}

private fun formatShortFrenchDate(iso: String?): String {
    if (iso.isNullOrBlank()) return "—"
    return runCatching {
        val instant = Instant.parse(iso)
        val zdt = instant.atZone(ZoneId.systemDefault())
        DateTimeFormatter.ofPattern("d MMM", Locale.FRENCH).format(zdt)
    }.getOrElse { iso.take(10) }
}
