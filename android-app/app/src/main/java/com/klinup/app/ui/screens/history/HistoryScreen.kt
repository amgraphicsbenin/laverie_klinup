package com.klinup.app.ui.screens.history

import com.klinup.app.ui.components.TablerIcons

import com.klinup.app.ui.components.LocalBottomBarPadding
import com.klinup.app.ui.components.OrderInvoiceDialog
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
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Checkroom
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.launch

private val PageBg: Color       @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color    @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color   @Composable get() = MaterialTheme.klinUpColors.border
private val BrandBlue           = Color(0xFF0D2FE8)
private val SoftBlueBg: Color   @Composable get() = MaterialTheme.klinUpColors.softBlueBg
private val InkPrimary: Color   @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color     @Composable get() = MaterialTheme.klinUpColors.inkMuted
private val ChipBg: Color       @Composable get() = MaterialTheme.klinUpColors.chipBg

private enum class HistoryFilter { TOUS, RESTITUEES, ANNULEES }

@Composable
fun HistoryScreen(
    onOrderClick: (String) -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current

    val orders by KlinUpRepository.orders.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()
    val isLoading by KlinUpRepository.isLoading.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var activeFilter by remember { mutableStateOf(HistoryFilter.TOUS) }
    var invoiceOrder by remember { mutableStateOf<Order?>(null) }

    val customerMap = remember(customers) { customers.associateBy { it.id } }
    val storeMap = remember(stores) { stores.associateBy { it.id } }

    val allArchived = remember(orders, selectedStoreId) {
        orders
            .filter { selectedStoreId == "all" || selectedStoreId == "GLOBAL" || it.storeId == selectedStoreId }
            .filter { it.isCompletedOrCancelled }
    }

    val restitutedCount = remember(allArchived) { allArchived.count { it.statut != "annule" } }
    val cancelledCount = remember(allArchived) { allArchived.count { it.statut == "annule" } }
    val totalRestitutedRevenue = remember(allArchived) {
        allArchived.filter { it.statut != "annule" }.sumOf { it.prixTotal }
    }

    val filteredArchived = remember(allArchived, activeFilter, searchQuery, customerMap) {
        allArchived
            .filter { order ->
                when (activeFilter) {
                    HistoryFilter.TOUS -> true
                    HistoryFilter.RESTITUEES -> order.statut != "annule"
                    HistoryFilter.ANNULEES -> order.statut == "annule"
                }
            }
            .filter { order ->
                if (searchQuery.isBlank()) true
                else {
                    val clientName = order.customerId?.let { customerMap[it]?.fullName } ?: "Client Passage"
                    clientName.contains(searchQuery, ignoreCase = true) ||
                        order.displayNumber.contains(searchQuery, ignoreCase = true) ||
                        order.typeArticle.contains(searchQuery, ignoreCase = true)
                }
            }
    }

    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
            .padding(top = statusBarTop + 10.dp)
    ) {
        // ── Header ─────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Historique",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = InkPrimary
            )

            IconButton(
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    scope.launch { KlinUpRepository.refreshAll() }
                }
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = BrandBlue
                    )
                } else {
                    Icon(
                        imageVector = TablerIcons.Refresh,
                        contentDescription = "Actualiser",
                        tint = InkSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // ── Hero Summary Card ──────────────────────────────────────────
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(26.dp),
            color = Color.Transparent,
            shadowElevation = 0.dp
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF0D2FE8), Color(0xFF2563EB))
                        )
                    )
                    .padding(18.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                text = "Total encaissé (archivées)",
                                color = Color.White.copy(alpha = 0.82f),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = KlinUpRepository.formatFcfa(totalRestitutedRevenue),
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 22.sp
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = Color.White.copy(alpha = 0.18f)
                        ) {
                            Text(
                                text = "${allArchived.size} cmd",
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = Color.White.copy(alpha = 0.14f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.CircleCheck,
                                    contentDescription = null,
                                    tint = Color(0xFF86EFAC),
                                    modifier = Modifier.size(15.dp)
                                )
                                Text(
                                    text = "$restitutedCount restituées",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = Color.White.copy(alpha = 0.14f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Ban,
                                    contentDescription = null,
                                    tint = Color(0xFFFCA5A5),
                                    modifier = Modifier.size(15.dp)
                                )
                                Text(
                                    text = "$cancelledCount annulées",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // ── Search Bar ─────────────────────────────────────────────────
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            shape = RoundedCornerShape(50),
            color = CardWhite,
            border = BorderStroke(1.dp, CardBorder)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = TablerIcons.Search,
                    contentDescription = null,
                    tint = Color(0xFF94A3B8),
                    modifier = Modifier.size(20.dp)
                )
                Box(modifier = Modifier.weight(1f)) {
                    if (searchQuery.isEmpty()) {
                        Text(
                            text = "Rechercher un ticket, client...",
                            fontSize = 14.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }
                    BasicTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        singleLine = true,
                        textStyle = TextStyle(fontSize = 14.sp, color = InkPrimary),
                        cursorBrush = SolidColor(BrandBlue),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Filter Pills ───────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            HistoryFilterPill(
                label = "Tous (${allArchived.size})",
                selected = activeFilter == HistoryFilter.TOUS,
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    activeFilter = HistoryFilter.TOUS
                }
            )
            HistoryFilterPill(
                label = "Restituées ($restitutedCount)",
                selected = activeFilter == HistoryFilter.RESTITUEES,
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    activeFilter = HistoryFilter.RESTITUEES
                }
            )
            HistoryFilterPill(
                label = "Annulées ($cancelledCount)",
                selected = activeFilter == HistoryFilter.ANNULEES,
                onClick = {
                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                    activeFilter = HistoryFilter.ANNULEES
                }
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        // ── Archived Orders List ───────────────────────────────────────
        if (filteredArchived.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(56.dp),
                        shape = CircleShape,
                        color = SoftBlueBg
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.History,
                                contentDescription = null,
                                tint = BrandBlue,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                    Text(
                        text = if (isLoading) "Chargement de l'historique..." else "Aucune commande archivée",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkSecondary
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    start = 20.dp,
                    end = 20.dp,
                    top = 4.dp,
                    bottom = 16.dp + LocalBottomBarPadding.current
                ),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(
                    items = filteredArchived,
                    key = { it.id },
                    contentType = { "history_order_card" }
                ) { order ->
                    val clientName = order.customerId?.let { customerMap[it]?.fullName } ?: "Client Passage"
                    HistoryOrderCard(
                        order = order,
                        clientName = clientName,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onOrderClick(order.id)
                        },
                        onInvoiceClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            invoiceOrder = order
                        }
                    )
                }
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }

    invoiceOrder?.let { order ->
        val customer = order.customerId?.let { customerMap[it] }
        val storeName = order.storeId?.let { storeMap[it]?.nom }
        OrderInvoiceDialog(
            order = order,
            customer = customer,
            storeName = storeName,
            onDismiss = { invoiceOrder = null }
        )
    }
}

@Composable
private fun HistoryFilterPill(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .clickable(role = Role.Tab, onClick = onClick),
        shape = RoundedCornerShape(999.dp),
        color = if (selected) BrandBlue else colors.chipBg
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
            color = if (selected) Color.White else InkSecondary,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            maxLines = 1
        )
    }
}

@Composable
private fun HistoryOrderCard(
    order: Order,
    clientName: String,
    onClick: () -> Unit,
    onInvoiceClick: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val isCancelled = order.statut == "annule"
    val (badgeBg, badgeText, badgeLabel) = if (isCancelled) {
        Triple(colors.softRedBg, colors.redText, "Annulée")
    } else {
        Triple(colors.softGreenBg, colors.greenText, "Restituée")
    }

    val articlesSummary = remember(order) {
        val itemsList = order.items.orEmpty()
        if (itemsList.isNotEmpty()) {
            itemsList.joinToString(", ") { "${it.article} x${it.quantite}" }
        } else {
            order.typeArticle
        }
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .clickable(role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        shadowElevation = 0.dp,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Text(
                        text = clientName,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Ticket ${order.displayNumber}",
                        fontSize = 13.sp,
                        color = InkMuted
                    )
                }

                Column(
                    horizontalAlignment = Alignment.End,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = badgeBg
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = if (isCancelled) TablerIcons.Ban else TablerIcons.CircleCheck,
                                contentDescription = null,
                                tint = badgeText,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = badgeLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = badgeText
                            )
                        }
                    }
                    Text(
                        text = KlinUpRepository.formatFcfa(order.prixTotal),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isCancelled) InkMuted else InkPrimary
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = TablerIcons.Hanger,
                    contentDescription = null,
                    tint = InkMuted,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = articlesSummary,
                    fontSize = 13.sp,
                    color = InkSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            HorizontalDivider(color = MaterialTheme.klinUpColors.divider)

            val paymentLabel = when (order.modeReglement.lowercase()) {
                "mobile_money", "momo" -> "Mobile Money"
                "especes", "espece" -> "Espèces"
                "abonnement" -> "Abonnement"
                "non_regle", "" -> "Non réglé"
                else -> order.modeReglement.replace("_", " ")
            }

            val agentName = remember(order.createdByName, order.createdById) {
                order.createdByName?.takeIf { it.isNotBlank() }
                    ?: KlinUpRepository.resolveStaffName(order.createdById)
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = ChipBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Calendar,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = KlinUpRepository.formatShortDate(order.createdAt),
                            fontSize = 11.5.sp,
                            color = InkSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = ChipBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.CreditCard,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = paymentLabel,
                            fontSize = 11.5.sp,
                            color = InkSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                if (!agentName.isNullOrBlank()) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = ChipBg,
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.User,
                                contentDescription = null,
                                tint = InkMuted,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = agentName,
                                fontSize = 11.5.sp,
                                color = InkSecondary,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(CardBorder.copy(alpha = 0.65f))
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(role = Role.Button, onClick = onInvoiceClick),
                    shape = RoundedCornerShape(12.dp),
                    color = SoftBlueBg,
                    border = BorderStroke(1.dp, MaterialTheme.klinUpColors.softBlueBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 9.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = TablerIcons.Receipt,
                            contentDescription = "Facture",
                            tint = MaterialTheme.klinUpColors.brandText,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Facture",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.klinUpColors.brandText
                        )
                    }
                }

                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(role = Role.Button, onClick = onClick),
                    shape = RoundedCornerShape(12.dp),
                    color = ChipBg,
                    border = BorderStroke(1.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 9.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Voir le détail",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = TablerIcons.ChevronRight,
                            contentDescription = null,
                            tint = InkPrimary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}
