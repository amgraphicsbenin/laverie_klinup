package com.klinup.app.ui.screens.gestion

import com.klinup.app.ui.components.TablerIcons

import com.klinup.app.ui.components.CustomerProfileFormCard
import com.klinup.app.ui.components.LocalBottomBarPadding
import com.klinup.app.ui.components.OrderInvoiceDialog
import com.klinup.app.ui.components.OrderPaymentSettlementDialog
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Autorenew
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.Checkroom
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.LocalLaundryService
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Phone
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material.icons.outlined.WorkspacePremium
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.klinup.app.data.models.CatalogItem
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.Expense
import com.klinup.app.data.models.ExpenseCatalog
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

private val PageBg: Color        @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val SegmentedBg: Color   @Composable get() = MaterialTheme.klinUpColors.chipBg
private val BrandBlue            = Color(0xFF2600F5)
private val BrandText: Color     @Composable get() = MaterialTheme.klinUpColors.brandText
private val PrimaryPurple        = Color(0xFF7E22CE)
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted
private val ChipBg: Color        @Composable get() = MaterialTheme.klinUpColors.chipBg

private val InvoiceBg: Color     @Composable get() = MaterialTheme.klinUpColors.softBlueBg
private val InvoiceBorder: Color @Composable get() = MaterialTheme.klinUpColors.softBlueBorder
private val CancelBg: Color      @Composable get() = MaterialTheme.klinUpColors.softRedBg
private val CancelBorder: Color  @Composable get() = MaterialTheme.klinUpColors.softRedBorder
private val CancelRed: Color     @Composable get() = MaterialTheme.klinUpColors.redText

private enum class GestionTab { COMMANDES, CLIENTS, DEPENSES }
private enum class OrderQuickFilter { ACTIVES, URGENTES, RETARD }
private enum class CustomerQuickFilter { TOUS, ABONNES, FIDELITE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GestionScreen(
    onOrderClick: (String) -> Unit = {},
    onCustomerClick: (String) -> Unit = {},
    onExpenseClick: (String) -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current

    val orders by KlinUpRepository.orders.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val expenses by KlinUpRepository.expenses.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()
    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val isLoading by KlinUpRepository.isLoading.collectAsState()

    val canManageCustomers = currentUser?.canManageCustomersMobile ?: true
    val canManageExpenses = currentUser?.canManageExpensesMobile ?: true
    val allowedTabs = remember(canManageCustomers, canManageExpenses) {
        buildList {
            add(GestionTab.COMMANDES to "Commandes")
            if (canManageCustomers) add(GestionTab.CLIENTS to "Clients")
            if (canManageExpenses) add(GestionTab.DEPENSES to "Dépenses")
        }
    }

    var activeTab by rememberSaveable { mutableStateOf(GestionTab.COMMANDES) }
    LaunchedEffect(allowedTabs) {
        if (allowedTabs.none { it.first == activeTab }) {
            activeTab = GestionTab.COMMANDES
        }
    }
    var quickFilter by rememberSaveable { mutableStateOf(OrderQuickFilter.ACTIVES) }
    var customerFilter by rememberSaveable { mutableStateOf(CustomerQuickFilter.TOUS) }
    var expenseCategoryFilter by rememberSaveable { mutableStateOf("all") }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var updatingOrderId by remember { mutableStateOf<String?>(null) }
    var closingOrders by remember { mutableStateOf<Map<String, Pair<Order, Int>>>(emptyMap()) }
    var fadingOutOrderIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    var showNewCustomerDialog by remember { mutableStateOf(false) }
    var showNewExpenseSheet by remember { mutableStateOf(false) }
    var deleteExpenseTarget by remember { mutableStateOf<Expense?>(null) }

    var invoiceOrder by remember { mutableStateOf<Order?>(null) }
    var cancelOrderTarget by remember { mutableStateOf<Order?>(null) }
    var paymentPromptTarget by remember { mutableStateOf<Pair<Order, String>?>(null) }
    var isSettlingPayment by remember { mutableStateOf(false) }

    val customerMap = remember(customers) { customers.associateBy { it.id } }
    val storeMap = remember(stores) { stores.associateBy { it.id } }
    val nowInstant = remember(orders) { Instant.now() }

    val storeOrders = remember(orders, selectedStoreId) {
        if (selectedStoreId == "all" || selectedStoreId == "GLOBAL") orders
        else orders.filter { it.storeId == selectedStoreId }
    }

    val activeOrdersList = remember(storeOrders) {
        storeOrders.filter { !it.isCompletedOrCancelled }
    }
    val urgentOrdersCount = remember(activeOrdersList) {
        activeOrdersList.count { it.niveauUrgence.equals("Express", ignoreCase = true) }
    }
    val lateOrdersCount = remember(activeOrdersList, nowInstant) {
        activeOrdersList.count { order ->
            val due = KlinUpRepository.parseInstant(order.dueDate)
            due != null && due.isBefore(nowInstant)
        }
    }

    val filteredOrders = remember(activeOrdersList, quickFilter, searchQuery, customerMap, nowInstant) {
        val byQuick = when (quickFilter) {
            OrderQuickFilter.ACTIVES -> activeOrdersList
            OrderQuickFilter.URGENTES -> activeOrdersList.filter {
                it.niveauUrgence.equals("Express", ignoreCase = true)
            }
            OrderQuickFilter.RETARD -> activeOrdersList.filter {
                val due = KlinUpRepository.parseInstant(it.dueDate)
                due != null && due.isBefore(nowInstant)
            }
        }
        if (searchQuery.isBlank()) byQuick
        else byQuick.filter { order ->
            val clientName = order.customerId?.let { customerMap[it]?.fullName } ?: "Client Passage"
            clientName.contains(searchQuery, ignoreCase = true) ||
                order.ticketLabel.contains(searchQuery, ignoreCase = true) ||
                order.displayNumber.contains(searchQuery, ignoreCase = true) ||
                order.typeArticle.contains(searchQuery, ignoreCase = true)
        }
    }

    val storeCustomers = remember(customers, selectedStoreId) {
        customers.filter {
            selectedStoreId == "all" || selectedStoreId == "GLOBAL" || it.storeId == null || it.storeId == selectedStoreId
        }
    }

    val subscribedCustomersCount = remember(storeCustomers) {
        storeCustomers.count { it.activeSubscription != null }
    }
    val loyaltyCustomersCount = remember(storeCustomers) {
        storeCustomers.count { it.pointsFidelite > 0 }
    }

    val filteredCustomers = remember(storeCustomers, customerFilter, searchQuery) {
        storeCustomers
            .filter { cust ->
                when (customerFilter) {
                    CustomerQuickFilter.TOUS -> true
                    CustomerQuickFilter.ABONNES -> cust.activeSubscription != null
                    CustomerQuickFilter.FIDELITE -> cust.pointsFidelite > 0
                }
            }
            .filter { cust ->
                if (searchQuery.isBlank()) true
                else cust.fullName.contains(searchQuery, ignoreCase = true) ||
                    cust.telephone.contains(searchQuery, ignoreCase = true)
            }
            .sortedByDescending { it.pointsFidelite }
    }

    val displayedOrders = remember(filteredOrders, closingOrders) {
        if (closingOrders.isEmpty()) {
            filteredOrders
        } else {
            val presentIds = filteredOrders.map { it.id }.toSet()
            val list = filteredOrders.toMutableList()
            closingOrders.values
                .filter { (o, _) -> o.id !in presentIds }
                .sortedBy { (_, idx) -> idx }
                .forEach { (o, idx) ->
                    list.add(idx.coerceIn(0, list.size), o)
                }
            list
        }
    }

    val storeExpenses = remember(expenses, selectedStoreId) {
        expenses.filter {
            selectedStoreId == "all" || selectedStoreId == "GLOBAL" || it.storeId == selectedStoreId
        }
    }

    val filteredExpenses = remember(storeExpenses, expenseCategoryFilter, searchQuery) {
        storeExpenses.filter { exp ->
            val matchCat = expenseCategoryFilter == "all" || exp.category == expenseCategoryFilter
            val matchQuery = if (searchQuery.isBlank()) true else {
                exp.label.contains(searchQuery, ignoreCase = true) ||
                    (exp.description?.contains(searchQuery, ignoreCase = true) == true) ||
                    (exp.reference?.contains(searchQuery, ignoreCase = true) == true) ||
                    (exp.createdByName?.contains(searchQuery, ignoreCase = true) == true)
            }
            matchCat && matchQuery
        }
    }

    val totalExpensesAmount = remember(filteredExpenses) {
        filteredExpenses.filter { it.status != "rejetee" }.sumOf { it.amount }
    }

    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = statusBarTop + 10.dp)
        ) {
            // ── Header ────────────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Gestion",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
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

            // ── Segmented Control (Commandes | Clients) ───────────────────────
            if (allowedTabs.size > 1) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = SegmentedBg
                ) {
                    Row(
                        modifier = Modifier.padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        allowedTabs.forEach { (tab, label) ->
                            val isSelected = activeTab == tab
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable(role = Role.Tab) {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        activeTab = tab
                                    },
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) CardWhite else Color.Transparent,
                                shadowElevation = 0.dp
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 10.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isSelected) BrandText else InkMuted
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (activeTab == GestionTab.CLIENTS) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${storeCustomers.size} clients",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = InkSecondary
                    )
                    Button(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showNewCustomerDialog = true
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Plus,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Nouveau Client",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            } else if (activeTab == GestionTab.DEPENSES) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "${filteredExpenses.size} dépense(s)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = InkSecondary
                        )
                        Text(
                            text = "-${KlinUpRepository.formatFcfa(totalExpensesAmount)}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = CancelRed
                        )
                    }
                    Button(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showNewExpenseSheet = true
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Plus,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Nouvelle Dépense",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // ── Search Bar ────────────────────────────────────────────────────
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
                                text = when (activeTab) {
                                    GestionTab.COMMANDES -> "Rechercher un ticket ou un client..."
                                    GestionTab.CLIENTS -> "Rechercher par nom ou telephone..."
                                    GestionTab.DEPENSES -> "Rechercher une dépense, réf..."
                                },
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

            if (activeTab == GestionTab.COMMANDES) {
                Spacer(modifier = Modifier.height(12.dp))

                // ── Filter Pills Row ──────────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterPill(
                        label = "Actives (${activeOrdersList.size})",
                        selected = quickFilter == OrderQuickFilter.ACTIVES,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            quickFilter = OrderQuickFilter.ACTIVES
                        },
                        modifier = Modifier.weight(1f)
                    )
                    FilterPill(
                        label = "Urgentes ($urgentOrdersCount)",
                        selected = quickFilter == OrderQuickFilter.URGENTES,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            quickFilter = OrderQuickFilter.URGENTES
                        },
                        modifier = Modifier.weight(1f)
                    )
                    FilterPill(
                        label = "En retard ($lateOrdersCount)",
                        selected = quickFilter == OrderQuickFilter.RETARD,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            quickFilter = OrderQuickFilter.RETARD
                        },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (displayedOrders.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isLoading) "Chargement des commandes..." else "Aucune commande correspondante",
                            fontSize = 14.sp,
                            color = InkMuted
                        )
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
                            items = displayedOrders,
                            key = { it.id },
                            contentType = { "gestion_order_card" }
                        ) { order ->
                            val clientName = order.customerId?.let { customerMap[it]?.fullName } ?: "Client Passage"
                            val isClosing = closingOrders.containsKey(order.id)
                            val isFadingOut = order.id in fadingOutOrderIds
                            AnimatedVisibility(
                                visible = !isFadingOut,
                                exit = fadeOut(animationSpec = tween(durationMillis = 420, easing = FastOutSlowInEasing)) +
                                    shrinkVertically(
                                        animationSpec = tween(durationMillis = 420, easing = FastOutSlowInEasing),
                                        shrinkTowards = Alignment.Top
                                    )
                            ) {
                                Box(modifier = Modifier.fillMaxWidth()) {
                                    GestionOrderCard(
                                        order = order,
                                        clientName = clientName,
                                        isUpdating = updatingOrderId == order.id,
                                        onCardClick = {
                                            if (!isClosing) {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                onOrderClick(order.id)
                                            }
                                        },
                                        onInvoiceClick = { if (!isClosing) invoiceOrder = order },
                                        onCancelClick = { if (!isClosing) cancelOrderTarget = order },
                                        onPrimaryActionClick = { nextStatus ->
                                            if (isClosing) return@GestionOrderCard
                                            if (KlinUpRepository.requiresRemainingPayment(order, nextStatus)) {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                paymentPromptTarget = order to nextStatus
                                            } else if (nextStatus == "restitue") {
                                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                                val currentIdx = displayedOrders.indexOfFirst { it.id == order.id }.coerceAtLeast(0)
                                                closingOrders = closingOrders + (order.id to (order to currentIdx))
                                                scope.launch {
                                                    val updateJob = launch {
                                                        KlinUpRepository.updateOrderStatus(order.id, nextStatus)
                                                    }
                                                    delay(5000L)
                                                    fadingOutOrderIds = fadingOutOrderIds + order.id
                                                    delay(440L)
                                                    updateJob.join()
                                                    closingOrders = closingOrders - order.id
                                                    fadingOutOrderIds = fadingOutOrderIds - order.id
                                                }
                                            } else {
                                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                                updatingOrderId = order.id
                                                scope.launch {
                                                    val res = KlinUpRepository.updateOrderStatus(order.id, nextStatus)
                                                    updatingOrderId = null
                                                    if (res.isSuccess) {
                                                        KlinUpRepository.notifyOrderReadyIfApplicable(context, order, nextStatus)
                                                    }
                                                }
                                            }
                                        }
                                    )

                                    if (isClosing) {
                                        OrderClosingSuccessOverlay(
                                            ticketLabel = order.ticketLabel,
                                            modifier = Modifier.matchParentSize()
                                        )
                                    }
                                }
                            }
                        }
                        item { Spacer(modifier = Modifier.height(16.dp)) }
                    }
                }
            } else if (activeTab == GestionTab.DEPENSES) {
                Spacer(modifier = Modifier.height(12.dp))

                LazyRow(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = expenseCategoryFilter == "all",
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                expenseCategoryFilter = "all"
                            },
                            label = { Text("Toutes (${storeExpenses.size})", fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                        )
                    }
                    items(ExpenseCatalog.categories, key = { it.id }) { cat ->
                        val cnt = storeExpenses.count { it.category == cat.id }
                        FilterChip(
                            selected = expenseCategoryFilter == cat.id,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                expenseCategoryFilter = cat.id
                            },
                            label = {
                                Text(
                                    text = if (cnt > 0) "${cat.shortLabel} ($cnt)" else cat.shortLabel,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (filteredExpenses.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = if (isLoading) "Chargement des dépenses..." else "Aucune dépense enregistrée",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkSecondary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Appuyez sur « Nouvelle Dépense » pour en créer une.",
                                fontSize = 13.sp,
                                color = InkMuted
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
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = filteredExpenses,
                            key = { it.id },
                            contentType = { "gestion_expense_card" }
                        ) { expense ->
                            GestionExpenseCard(
                                expense = expense,
                                onClick = { onExpenseClick(expense.id) },
                                onDeleteClick = { deleteExpenseTarget = expense }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(16.dp)) }
                    }
                }
            } else {
                Spacer(modifier = Modifier.height(12.dp))

                // ── Customer Filter Pills ────────────────────────────────────
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CustomerFilterPill(
                        label = "Tous (${storeCustomers.size})",
                        selected = customerFilter == CustomerQuickFilter.TOUS,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            customerFilter = CustomerQuickFilter.TOUS
                        }
                    )
                    CustomerFilterPill(
                        label = "Abonnés ($subscribedCustomersCount)",
                        selected = customerFilter == CustomerQuickFilter.ABONNES,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            customerFilter = CustomerQuickFilter.ABONNES
                        }
                    )
                    CustomerFilterPill(
                        label = "Fidélité ($loyaltyCustomersCount)",
                        selected = customerFilter == CustomerQuickFilter.FIDELITE,
                        showMedalIcon = true,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            customerFilter = CustomerQuickFilter.FIDELITE
                        }
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (filteredCustomers.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isLoading) "Chargement des clients..." else "Aucun client trouvé",
                            fontSize = 14.sp,
                            color = InkMuted
                        )
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
                            items = filteredCustomers,
                            key = { it.id },
                            contentType = { "gestion_customer_card" }
                        ) { customer ->
                            val ordersCount = storeOrders.count { it.customerId == customer.id && it.statut != "annule" }
                            GestionCustomerCard(
                                customer = customer,
                                ordersCount = ordersCount,
                                onClick = {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    onCustomerClick(customer.id)
                                }
                            )
                        }
                        item { Spacer(modifier = Modifier.height(16.dp)) }
                    }
                }
            }
        }
    }

    if (showNewExpenseSheet) {
        var expCategory by remember { mutableStateOf("produits") }
        var expLabel by remember { mutableStateOf("") }
        var expAmount by remember { mutableStateOf("") }
        var expPayment by remember { mutableStateOf("especes") }
        var expMomoOperator by remember { mutableStateOf("MTN") }
        var expDate by remember { mutableStateOf(java.time.LocalDate.now().toString()) }
        var expReference by remember { mutableStateOf("") }
        var expDescription by remember { mutableStateOf("") }
        var isSavingExpense by remember { mutableStateOf(false) }
        var expenseError by remember { mutableStateOf<String?>(null) }

        val expSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

        ModalBottomSheet(
            onDismissRequest = { if (!isSavingExpense) showNewExpenseSheet = false },
            sheetState = expSheetState,
            containerColor = MaterialTheme.klinUpColors.altPageBg,
            contentColor = InkPrimary,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            FixModalStatusBar(isDark = MaterialTheme.klinUpColors.isDark)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .navigationBarsPadding()
                    .imePadding()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Nouvelle Dépense",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = InkPrimary
                    )
                    IconButton(onClick = { if (!isSavingExpense) showNewExpenseSheet = false }) {
                        Icon(imageVector = TablerIcons.X, contentDescription = "Fermer", tint = InkSecondary)
                    }
                }

                if (expenseError != null) {
                    Surface(
                        color = CancelBg,
                        border = BorderStroke(1.dp, CancelBorder),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = expenseError!!,
                            color = CancelRed,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }

                Text(
                    text = "Catégorie",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkSecondary
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(ExpenseCatalog.categories, key = { it.id }) { cat ->
                        FilterChip(
                            selected = expCategory == cat.id,
                            onClick = { expCategory = cat.id },
                            label = { Text(cat.shortLabel, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                        )
                    }
                }

                OutlinedTextField(
                    value = expLabel,
                    onValueChange = { expLabel = it },
                    label = { Text("Libellé de la dépense *") },
                    placeholder = { Text("Ex: Bidon lessive 20L, Facture eau...") },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = expAmount,
                    onValueChange = { input -> expAmount = input.filter { it.isDigit() || it == '.' } },
                    label = { Text("Montant (FCFA) *") },
                    placeholder = { Text("Ex: 15000") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Text(
                    text = "Mode de règlement",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkSecondary
                )
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(ExpenseCatalog.paymentMethods, key = { it.id }) { pm ->
                        FilterChip(
                            selected = expPayment == pm.id,
                            onClick = { expPayment = pm.id },
                            label = { Text(pm.label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                        )
                    }
                }

                if (expPayment == "mobile_money") {
                    com.klinup.app.ui.components.MomoOperatorSelector(
                        selectedOperator = expMomoOperator,
                        onSelect = { expMomoOperator = it }
                    )
                }

                OutlinedTextField(
                    value = expDate,
                    onValueChange = { expDate = it },
                    label = { Text("Date (AAAA-MM-JJ)") },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = expReference,
                    onValueChange = { expReference = it },
                    label = { Text("Référence / N° Reçu (optionnel)") },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = expDescription,
                    onValueChange = { expDescription = it },
                    label = { Text("Notes / Détails (optionnel)") },
                    maxLines = 3,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        val parsedAmount = expAmount.toDoubleOrNull() ?: 0.0
                        if (expLabel.isBlank()) {
                            expenseError = "Veuillez saisir un libellé."
                            return@Button
                        }
                        if (parsedAmount <= 0.0) {
                            expenseError = "Veuillez saisir un montant supérieur à 0 FCFA."
                            return@Button
                        }
                        isSavingExpense = true
                        expenseError = null
                        scope.launch {
                            val res = KlinUpRepository.createExpense(
                                category = expCategory,
                                label = expLabel,
                                amount = parsedAmount,
                                paymentMethod = expPayment,
                                expenseDate = expDate,
                                reference = expReference,
                                description = expDescription
                            )
                            isSavingExpense = false
                            res.onSuccess {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                showNewExpenseSheet = false
                            }.onFailure { err ->
                                expenseError = err.message ?: "Erreur lors de l'enregistrement."
                            }
                        }
                    },
                    enabled = !isSavingExpense,
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (isSavingExpense) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                    } else {
                        Text(
                            text = "Enregistrer la dépense",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }

    if (deleteExpenseTarget != null) {
        val target = deleteExpenseTarget!!
        var isDeleting by remember(target.id) { mutableStateOf(false) }
        var deleteReason by remember(target.id) { mutableStateOf("") }
        var showReasonError by remember(target.id) { mutableStateOf(false) }
        val isReasonValid = deleteReason.trim().isNotEmpty()
        AlertDialog(
            onDismissRequest = { if (!isDeleting) deleteExpenseTarget = null },
            containerColor = CardWhite,
            title = { Text("Supprimer la dépense ?", color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Voulez-vous vraiment supprimer « ${target.label} » (${KlinUpRepository.formatFcfa(target.amount)}) ?",
                        color = InkSecondary
                    )
                    Text(
                        text = "Motif de la suppression *",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkPrimary
                    )
                    OutlinedTextField(
                        value = deleteReason,
                        onValueChange = {
                            deleteReason = it
                            if (showReasonError && it.trim().isNotEmpty()) showReasonError = false
                        },
                        placeholder = { Text("Ex : Erreur de saisie, doublon...", color = InkMuted) },
                        isError = showReasonError,
                        supportingText = {
                            Text(
                                text = if (showReasonError) "Le motif est obligatoire pour supprimer." else "Champ obligatoire",
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
                        if (isDeleting) return@TextButton
                        val trimmed = deleteReason.trim()
                        if (trimmed.isEmpty()) {
                            showReasonError = true
                            return@TextButton
                        }
                        isDeleting = true
                        scope.launch {
                            KlinUpRepository.deleteExpense(target.id, reason = trimmed)
                            isDeleting = false
                            deleteExpenseTarget = null
                        }
                    }
                ) {
                    Text(
                        "Supprimer",
                        color = if (isReasonValid) CancelRed else CancelRed.copy(alpha = 0.45f),
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { if (!isDeleting) deleteExpenseTarget = null }) {
                    Text("Annuler", color = InkSecondary)
                }
            }
        )
    }

    if (showNewCustomerDialog) {
        val storesList by KlinUpRepository.stores.collectAsState()
        val catalogList by KlinUpRepository.catalog.collectAsState()
        val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()
        val subscriptionPlans = remember(catalogList) {
            catalogList.filter {
                (it.categorie.equals("abonnement", ignoreCase = true) ||
                    it.service.equals("abonnement", ignoreCase = true)) &&
                    (it.isActive ?: true) &&
                    !it.statut.equals("inactif", ignoreCase = true)
            }
        }

        var nom by remember { mutableStateOf("") }
        var prenom by remember { mutableStateOf("") }
        var indicatif by remember { mutableStateOf("🇧🇯 +229") }
        var telephone by remember { mutableStateOf("") }
        var adresse by remember { mutableStateOf("") }
        var quartier by remember { mutableStateOf("") }
        var ville by remember { mutableStateOf("Cotonou") }
        var selectedStore by remember(storesList, selectedStoreId) {
            mutableStateOf(
                storesList.firstOrNull { it.id == selectedStoreId || it.code == selectedStoreId }
                    ?: storesList.firstOrNull()
            )
        }
        var lat by remember { mutableStateOf("") }
        var lng by remember { mutableStateOf("") }
        var preference by remember { mutableStateOf("Plié") }
        var selectedSubPlan by remember { mutableStateOf<CatalogItem?>(null) }
        var isCreating by remember { mutableStateOf(false) }
        var createError by remember { mutableStateOf<String?>(null) }

        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

        ModalBottomSheet(
            onDismissRequest = { if (!isCreating) showNewCustomerDialog = false },
            sheetState = sheetState,
            containerColor = MaterialTheme.klinUpColors.altPageBg,
            contentColor = InkPrimary,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            FixModalStatusBar(isDark = MaterialTheme.klinUpColors.isDark)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.88f)
                    .navigationBarsPadding()
                    .imePadding()
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Nouveau Client",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary
                    )
                    IconButton(
                        onClick = { if (!isCreating) showNewCustomerDialog = false }
                    ) {
                        Icon(TablerIcons.X, contentDescription = "Fermer", tint = InkSecondary)
                    }
                }

                // Scrollable unified profile creation form
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    CustomerProfileFormCard(
                        title = "Informations du Client",
                        prenom = prenom,
                        onPrenomChange = { prenom = it },
                        nom = nom,
                        onNomChange = { nom = it },
                        indicatif = indicatif,
                        onIndicatifChange = { indicatif = it },
                        phone = telephone,
                        onPhoneChange = { telephone = it },
                        address = adresse,
                        onAddressChange = { adresse = it },
                        quartier = quartier,
                        onQuartierChange = { quartier = it },
                        ville = ville,
                        onVilleChange = { ville = it },
                        selectedStore = selectedStore,
                        stores = storesList,
                        onStoreChange = { selectedStore = it },
                        lat = lat,
                        onLatChange = { lat = it },
                        lng = lng,
                        onLngChange = { lng = it },
                        pref = preference,
                        onPrefChange = { preference = it },
                        showSubscriptionSection = true,
                        subscriptionPlans = subscriptionPlans,
                        selectedSubPlan = selectedSubPlan,
                        onSubPlanChange = { selectedSubPlan = it }
                    )

                    createError?.let { msg ->
                        Text(
                            text = msg,
                            color = CancelRed,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            modifier = Modifier.padding(horizontal = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                }

                HorizontalDivider(color = MaterialTheme.klinUpColors.divider)

                // Sticky Bottom Action Buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.klinUpColors.altPageBg)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showNewCustomerDialog = false },
                        enabled = !isCreating,
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Text("Annuler", fontWeight = FontWeight.Bold, color = InkSecondary)
                    }

                    Button(
                        onClick = {
                            isCreating = true
                            createError = null
                            val cleanIndicatif = indicatif.substringAfter("+").trim()
                            val parsedLat = lat.replace(",", ".").trim().toDoubleOrNull()
                            val parsedLng = lng.replace(",", ".").trim().toDoubleOrNull()
                            scope.launch {
                                val res = KlinUpRepository.createCustomer(
                                    nom = nom,
                                    prenom = prenom,
                                    telephone = telephone,
                                    adresse = adresse,
                                    preferencesPliage = preference,
                                    indicatif = cleanIndicatif,
                                    quartier = quartier,
                                    ville = ville,
                                    latitude = parsedLat,
                                    longitude = parsedLng,
                                    explicitStoreId = selectedStore?.id,
                                    subscriptionPlan = selectedSubPlan
                                )
                                isCreating = false
                                if (res.isSuccess) {
                                    showNewCustomerDialog = false
                                } else {
                                    createError = res.exceptionOrNull()?.message ?: "Impossible de créer le client."
                                }
                            }
                        },
                        enabled = !isCreating && telephone.isNotBlank() && (nom.isNotBlank() || prenom.isNotBlank()),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        if (isCreating) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp)
                            )
                        } else {
                            Text("Créer le client", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }
        }
    }

    // ── Invoice / Facture Modal ───────────────────────────────────────────────
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

    // ── Payment Settlement Dialog ─────────────────────────────────────────────
    paymentPromptTarget?.let { (targetOrder, targetStatus) ->
        OrderPaymentSettlementDialog(
            order = targetOrder,
            targetStatus = targetStatus,
            isSubmitting = isSettlingPayment,
            onDismiss = { if (!isSettlingPayment) paymentPromptTarget = null },
            onConfirm = { amountPaid, paymentMethod, momoRef, momoOp ->
                isSettlingPayment = true
                scope.launch {
                    val res = KlinUpRepository.deliverOrderWithPayment(
                        order = targetOrder,
                        amountPaid = amountPaid,
                        paymentMethod = paymentMethod,
                        targetStatus = targetStatus,
                        momoReference = momoRef,
                        momoOperator = momoOp
                    )
                    isSettlingPayment = false
                    if (res.isSuccess) {
                        paymentPromptTarget = null
                        if (targetStatus == "restitue") {
                            haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            val currentIdx = displayedOrders.indexOfFirst { it.id == targetOrder.id }.coerceAtLeast(0)
                            closingOrders = closingOrders + (targetOrder.id to (targetOrder to currentIdx))
                            delay(5000L)
                            fadingOutOrderIds = fadingOutOrderIds + targetOrder.id
                            delay(440L)
                            closingOrders = closingOrders - targetOrder.id
                            fadingOutOrderIds = fadingOutOrderIds - targetOrder.id
                        } else {
                            KlinUpRepository.notifyOrderReadyIfApplicable(context, targetOrder, targetStatus)
                        }
                    }
                }
            }
        )
    }

    // ── Cancel Confirmation Dialog ────────────────────────────────────────────
    cancelOrderTarget?.let { order ->
        var cancelReason by remember(order.id) { mutableStateOf("") }
        var showReasonError by remember(order.id) { mutableStateOf(false) }
        val isReasonValid = cancelReason.trim().isNotEmpty()
        AlertDialog(
            onDismissRequest = { cancelOrderTarget = null },
            containerColor = CardWhite,
            title = { Text("Annuler la commande ?", color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Voulez-vous vraiment annuler le ${order.ticketLabel} ?", color = InkSecondary)
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
                        val targetId = order.id
                        cancelOrderTarget = null
                        updatingOrderId = targetId
                        scope.launch {
                            KlinUpRepository.updateOrderStatus(targetId, "annule", reason = trimmed)
                            updatingOrderId = null
                        }
                    }
                ) {
                    Text(
                        "Annuler la commande",
                        color = if (isReasonValid) CancelRed else CancelRed.copy(alpha = 0.45f),
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { cancelOrderTarget = null }) {
                    Text("Retour", color = InkSecondary)
                }
            }
        )
    }
}

@Composable
private fun FilterPill(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.klinUpColors
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(999.dp))
            .clickable(role = Role.Tab, onClick = onClick),
        shape = RoundedCornerShape(999.dp),
        color = if (selected) colors.softBlueBg else SegmentedBg,
        border = BorderStroke(
            width = if (selected) 1.5.dp else 1.dp,
            color = if (selected) BrandText else CardBorder
        )
    ) {
        Box(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                color = if (selected) BrandText else InkSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun GestionOrderCard(
    order: Order,
    clientName: String,
    isUpdating: Boolean,
    onCardClick: () -> Unit,
    onInvoiceClick: () -> Unit,
    onCancelClick: () -> Unit,
    onPrimaryActionClick: (String) -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val canCancelOrder = currentUser?.canCancelOrders ?: false
    val statusLabel = KlinUpRepository.orderStatusLabel(order.statut)
    val nextStatus = KlinUpRepository.nextOrderStatus(order.statut)

    val (badgeBg, badgeText) = when (order.statut) {
        "pret", "a_recuperer", "a_livrer" -> colors.softGreenBg to colors.greenText
        "en_cours_lavage", "lavage_cours", "en_cours_repassage", "repassage_cours", "traitement" ->
            colors.softSkyBg to colors.skyText
        else -> colors.softAmberBg to colors.amberText
    }

    val articlesSummary = remember(order) {
        val itemsList = order.items.orEmpty()
        if (itemsList.isNotEmpty()) {
            itemsList.joinToString(", ") { "${it.article} x${it.quantite}" }
        } else {
            order.typeArticle
        }
    }

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

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .clickable(onClick = onCardClick),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        shadowElevation = 0.dp,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Top Row: Client + Ticket vs Status Pill + Price
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.User,
                            contentDescription = null,
                            tint = InkSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = clientName,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Text(
                        text = order.ticketLabel,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
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
                                imageVector = TablerIcons.Clock,
                                contentDescription = null,
                                tint = badgeText,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = statusLabel,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = badgeText
                            )
                        }
                    }

                    Text(
                        text = KlinUpRepository.formatFcfa(order.prixTotal),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = InkPrimary
                    )
                }
            }

            // Articles Summary
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

            // Subscription Box (shown when order uses a subscription)
            val sub = order.subscriptionDetails
            if (order.isSubscriptionOrder || sub != null || order.modeReglement.equals("abonnement", ignoreCase = true)) {
                val used = sub?.vetementsUtilises ?: sub?.usedClothes ?: 0
                val total = (sub?.vetementsInclus ?: sub?.totalClothes ?: 25).coerceAtLeast(1)
                val ratio = (used.toFloat() / total.toFloat()).coerceIn(0f, 1f)

                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = colors.cardSubtleBg,
                    border = BorderStroke(1.dp, colors.innerBorder)
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
                                .background(colors.trackBg)
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

            // Meta Chips (Retrait date + Mode de règlement)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = ChipBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
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
                            text = "Retrait : ${formatShortFrenchDate(order.dueDate)}",
                            fontSize = 11.sp,
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
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
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
                            text = order.modeReglement,
                            fontSize = 11.sp,
                            color = InkSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            HorizontalDivider(color = colors.divider)

            // Secondary Action Pills: Facture + Annuler
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Surface(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .clickable(role = Role.Button, onClick = onInvoiceClick),
                    shape = RoundedCornerShape(12.dp),
                    color = InvoiceBg,
                    border = BorderStroke(1.dp, InvoiceBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Receipt,
                            contentDescription = null,
                            tint = BrandText,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = "Facture",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = BrandText
                        )
                    }
                }

                if (canCancelOrder) {
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable(role = Role.Button, enabled = !isUpdating, onClick = onCancelClick),
                        shape = RoundedCornerShape(12.dp),
                        color = CancelBg,
                        border = BorderStroke(1.dp, CancelBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.Ban,
                                contentDescription = null,
                                tint = CancelRed,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = "Annuler",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = CancelRed
                            )
                        }
                    }
                }
            }

            // Primary CTA (filtré selon le rôle et les permissions de l'utilisateur)
            if (order.statut == "pret") {
                val canMarkPickup = currentUser?.canPerformOrderTransition(order.statut, "a_recuperer") ?: false
                val canMarkDelivery = currentUser?.canPerformOrderTransition(order.statut, "a_livrer") ?: false
                if (hasDeliveryOption) {
                    if (canMarkDelivery) {
                        Button(
                            onClick = { onPrimaryActionClick("a_livrer") },
                            enabled = !isUpdating,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
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
                                onClick = { onPrimaryActionClick("a_recuperer") },
                                enabled = !isUpdating,
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp),
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
                                onClick = { onPrimaryActionClick("a_livrer") },
                                enabled = !isUpdating,
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp),
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
                                .height(46.dp),
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
                                onClick = { onPrimaryActionClick(nextStatus) },
                                enabled = !isUpdating,
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp),
                                shape = RoundedCornerShape(999.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF008A00))
                            ) {
                                if (isUpdating) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        strokeWidth = 2.dp,
                                        modifier = Modifier.size(18.dp)
                                    )
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
                        onClick = { onPrimaryActionClick(nextStatus) },
                        enabled = !isUpdating,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(46.dp),
                        shape = RoundedCornerShape(999.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = stepColor)
                    ) {
                        if (isUpdating) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp)
                            )
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
    }
}

@Composable
private fun CustomerFilterPill(
    label: String,
    selected: Boolean,
    showMedalIcon: Boolean = false,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .clickable(role = Role.Tab, onClick = onClick),
        shape = RoundedCornerShape(999.dp),
        color = if (selected) BrandBlue else ChipBg
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            if (showMedalIcon) {
                Icon(
                    imageVector = TablerIcons.Award,
                    contentDescription = null,
                    tint = if (selected) Color.White else InkSecondary,
                    modifier = Modifier.size(14.dp)
                )
            }
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
                color = if (selected) Color.White else InkSecondary,
                maxLines = 1
            )
        }
    }
}

private data class TierPalette(
    val avatarBg: Color,
    val avatarText: Color,
    val badgeBg: Color,
    val badgeText: Color,
    val boxBg: Color,
    val boxBorder: Color,
    val barFill: Color
)

@Composable
private fun GestionCustomerCard(
    customer: Customer,
    ordersCount: Int,
    onClick: () -> Unit
) {
    val tier = KlinUpRepository.fidelityTier(customer.pointsFidelite)

    val isDark = MaterialTheme.klinUpColors.isDark
    val palette = if (isDark) {
        when (tier.tierName) {
            "Platine VIP" -> TierPalette(
                Color(0xFF181D42), Color(0xFF818CF8),
                Color(0xFF1A204A), Color(0xFFA5B4FC),
                Color(0xFF101326), Color(0xFF2B326B), Color(0xFF818CF8)
            )
            "Or" -> TierPalette(
                Color(0xFF29200A), Color(0xFFFBBF24),
                Color(0xFF2E2208), Color(0xFFFCD34D),
                Color(0xFF1A1405), Color(0xFF4F3E10), Color(0xFFFBBF24)
            )
            "Argent" -> TierPalette(
                Color(0xFF0E2438), Color(0xFF38BDF8),
                Color(0xFF0F2940), Color(0xFF7DD3FC),
                Color(0xFF091724), Color(0xFF1C466E), Color(0xFF38BDF8)
            )
            else -> TierPalette(
                Color(0xFF2B180A), Color(0xFFFB923C),
                Color(0xFF301A0A), Color(0xFFFDBA74),
                Color(0xFF1C1006), Color(0xFF573114), Color(0xFFFB923C)
            )
        }
    } else {
        when (tier.tierName) {
            "Platine VIP" -> TierPalette(
                Color(0xFFEEF2FF), Color(0xFF4F46E5),
                Color(0xFFEEF2FF), Color(0xFF4F46E5),
                Color(0xFFF5F7FF), Color(0xFFC7D2FE), Color(0xFF4F46E5)
            )
            "Or" -> TierPalette(
                Color(0xFFFEF9C3), Color(0xFFCA8A04),
                Color(0xFFFEF3C7), Color(0xFFB45309),
                Color(0xFFFFFBEB), Color(0xFFFDE68A), Color(0xFFD97706)
            )
            "Argent" -> TierPalette(
                Color(0xFFE0F2FE), Color(0xFF0284C7),
                Color(0xFFE0F2FE), Color(0xFF0284C7),
                Color(0xFFF0F9FF), Color(0xFFBAE6FD), Color(0xFF0284C7)
            )
            else -> TierPalette(
                Color(0xFFFDF2E9), Color(0xFFC26B27),
                Color(0xFFFEF3C7), Color(0xFFB45309),
                Color(0xFFFFF7ED), Color(0xFFFED7AA), Color(0xFFC26B27)
            )
        }
    }
    val avatarBg = palette.avatarBg
    val avatarText = palette.avatarText
    val badgeBg = palette.badgeBg
    val badgeText = palette.badgeText
    val boxBg = palette.boxBg
    val boxBorder = palette.boxBorder
    val barFill = palette.barFill

    val tierIcon = if (tier.tierName == "Bronze") {
        TablerIcons.Award
    } else {
        TablerIcons.ShieldCheck
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
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(50.dp)
                            .clip(CircleShape)
                            .background(avatarBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = customer.initials,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = avatarText
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = customer.fullName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = InkPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )

                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = badgeBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Icon(
                                    imageVector = tierIcon,
                                    contentDescription = null,
                                    tint = badgeText,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "${tier.tierName} • ${customer.pointsFidelite} pts",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = badgeText
                                )
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.Phone,
                                contentDescription = null,
                                tint = InkMuted,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                text = customer.telephone.ifBlank { "—" },
                                fontSize = 13.sp,
                                color = InkSecondary
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Order count pill
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = InvoiceBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = buildAnnotatedString {
                                withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = BrandBlue)) {
                                    append("$ordersCount ")
                                }
                                withStyle(SpanStyle(fontWeight = FontWeight.Medium, color = BrandBlue)) {
                                    append(if (ordersCount > 1) "cmdes" else "cmde")
                                }
                            },
                            fontSize = 12.sp
                        )
                        Icon(
                            imageVector = TablerIcons.ChevronRight,
                            contentDescription = null,
                            tint = BrandBlue,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }

            // Bottom loyalty progress box
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = boxBg,
                border = BorderStroke(1.dp, boxBorder)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                imageVector = tierIcon,
                                contentDescription = null,
                                tint = badgeText,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "Statut ${tier.tierName}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = badgeText
                            )
                        }
                        Text(
                            text = if (tier.nextTierName != null) {
                                "${tier.pointsRemaining} pts restants"
                            } else {
                                "Niveau Max"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = badgeText
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(MaterialTheme.klinUpColors.trackBg)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(tier.progress.coerceIn(0f, 1f))
                                .height(6.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(barFill)
                        )
                    }
                }
            }
        }
    }
}

@Composable
internal fun InProgressStatusIcon(
    statut: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    when (statut.lowercase()) {
        "en_cours_livraison" -> {
            AnimatedLucideTruckIcon(
                color = Color.White,
                durationMillis = 1700,
                modifier = modifier
            )
            return
        }
        "en_cours_lavage", "lavage_cours" -> {
            AnimatedLucideDropletsIcon(
                color = Color.White,
                durationMillis = 1500,
                modifier = modifier
            )
            return
        }
        "en_cours_repassage", "repassage_cours" -> {
            AnimatedLucideWindIcon(
                color = Color.White,
                durationMillis = 1550,
                modifier = modifier
            )
            return
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "in_progress_icon_$statut")
    val spinAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "spin"
    )
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 850, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val animModifier = when (statut.lowercase()) {
        "traitement" -> modifier.graphicsLayer {
            rotationZ = spinAngle
        }
        "en_cours_lavage", "lavage_cours" -> modifier.graphicsLayer {
            rotationZ = -12f + (pulse * 24f)
            val s = 0.94f + (pulse * 0.12f)
            scaleX = s
            scaleY = s
        }
        "en_cours_repassage", "repassage_cours" -> modifier.graphicsLayer {
            val s = 0.86f + (pulse * 0.28f)
            scaleX = s
            scaleY = s
            alpha = 0.72f + (pulse * 0.28f)
        }
        "en_cours_livraison" -> modifier.graphicsLayer {
            translationX = -3.5f + (pulse * 7f)
            alpha = 0.80f + (pulse * 0.20f)
        }
        else -> modifier.graphicsLayer {
            val s = 0.90f + (pulse * 0.18f)
            scaleX = s
            scaleY = s
        }
    }

    Icon(
        imageVector = icon,
        contentDescription = null,
        tint = Color.White,
        modifier = animModifier
    )
}

@Composable
private fun AnimatedLucideTruckIcon(
    color: Color = Color.White,
    durationMillis: Int = 1700,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_truck")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "truck_progress"
    )

    // Suspension bounce (two subtle bumps per 1.7s cycle) & slight forward spring
    val bouncePhase = kotlin.math.sin(progress * Math.PI * 4.0).toFloat()
    val drivePhase = kotlin.math.sin(progress * Math.PI * 2.0).toFloat()
    val wheelRotation = progress * 360f * 2f

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(
            width = 2f * u,
            cap = StrokeCap.Round,
            join = StrokeJoin.Round
        )

        val truckDx = drivePhase * 0.9f * u
        val truckDy = -kotlin.math.abs(bouncePhase) * 0.7f * u

        // Animated speed lines behind the truck
        val speedOffset = (progress * 3f) % 1f
        val speedAlpha = (1f - speedOffset).coerceIn(0.15f, 0.95f)
        val line1Start = (1.5f - speedOffset * 2.0f) * u
        val line2Start = (0.5f - speedOffset * 2.5f) * u
        drawLine(
            color = color.copy(alpha = speedAlpha),
            start = Offset(line1Start.coerceAtLeast(0f), 8.5f * u),
            end = Offset((line1Start + 2.2f * u).coerceAtLeast(0.5f * u), 8.5f * u),
            strokeWidth = 1.6f * u,
            cap = StrokeCap.Round
        )
        drawLine(
            color = color.copy(alpha = speedAlpha * 0.85f),
            start = Offset(line2Start.coerceAtLeast(0f), 12f * u),
            end = Offset((line2Start + 2.8f * u).coerceAtLeast(0.5f * u), 12f * u),
            strokeWidth = 1.6f * u,
            cap = StrokeCap.Round
        )

        translate(left = truckDx, top = truckDy) {
            // Cargo box: M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2
            val cargoPath = Path().apply {
                moveTo(14f * u, 18f * u)
                lineTo(14f * u, 6f * u)
                arcTo(
                    rect = Rect(10f * u, 4f * u, 14f * u, 8f * u),
                    startAngleDegrees = 0f,
                    sweepAngleDegrees = -90f,
                    forceMoveTo = false
                )
                lineTo(4f * u, 4f * u)
                arcTo(
                    rect = Rect(2f * u, 4f * u, 6f * u, 8f * u),
                    startAngleDegrees = -90f,
                    sweepAngleDegrees = -90f,
                    forceMoveTo = false
                )
                lineTo(2f * u, 17f * u)
                arcTo(
                    rect = Rect(2f * u, 16f * u, 4f * u, 18f * u),
                    startAngleDegrees = 180f,
                    sweepAngleDegrees = -90f,
                    forceMoveTo = false
                )
                lineTo(5f * u, 18f * u)
            }
            drawPath(path = cargoPath, color = color, style = stroke)

            // Axle line between wheels: M15 18H9
            drawLine(
                color = color,
                start = Offset(9f * u, 18f * u),
                end = Offset(15f * u, 18f * u),
                strokeWidth = 2f * u,
                cap = StrokeCap.Round
            )

            // Cab: M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14
            val cabPath = Path().apply {
                moveTo(19f * u, 18f * u)
                lineTo(21f * u, 18f * u)
                arcTo(
                    rect = Rect(20f * u, 16f * u, 22f * u, 18f * u),
                    startAngleDegrees = 90f,
                    sweepAngleDegrees = -90f,
                    forceMoveTo = false
                )
                lineTo(22f * u, 13.35f * u)
                lineTo(21.78f * u, 12.726f * u)
                lineTo(18.30f * u, 8.376f * u)
                lineTo(17.52f * u, 8f * u)
                lineTo(14f * u, 8f * u)
            }
            drawPath(path = cabPath, color = color, style = stroke)
        }

        // Left & right wheels with spinning spokes
        val wheelY = 18f * u + (truckDy * 0.35f)
        val wheelRadius = 2.1f * u
        listOf(7f * u + truckDx, 17f * u + truckDx).forEach { wx ->
            val center = Offset(wx, wheelY)
            drawCircle(
                color = color,
                radius = wheelRadius,
                center = center,
                style = stroke
            )
            rotate(degrees = wheelRotation, pivot = center) {
                drawLine(
                    color = color,
                    start = Offset(wx - wheelRadius * 0.55f, wheelY),
                    end = Offset(wx + wheelRadius * 0.55f, wheelY),
                    strokeWidth = 1.2f * u,
                    cap = StrokeCap.Round
                )
            }
        }
    }
}

@Composable
private fun AnimatedLucideDropletsIcon(
    color: Color = Color.White,
    durationMillis: Int = 1500,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_droplets")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "droplets_progress"
    )

    // Staggered vertical drop/bob + subtle opacity/scale ripple per droplet (1.5s loop)
    val phase1 = kotlin.math.sin(progress * Math.PI * 2.0).toFloat()
    val phase2 = kotlin.math.sin((progress + 0.35f) * Math.PI * 2.0).toFloat()

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(
            width = 2f * u,
            cap = StrokeCap.Round,
            join = StrokeJoin.Round
        )

        // Small left droplet:
        // M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z
        val leftDropDy = phase1 * 1.1f * u
        val leftAlpha = (0.82f + 0.18f * ((phase1 + 1f) * 0.5f)).coerceIn(0.75f, 1f)
        translate(left = 0f, top = leftDropDy) {
            val leftDrop = Path().apply {
                moveTo(7f * u, 16.3f * u)
                cubicTo(9.2f * u, 16.3f * u, 11f * u, 14.47f * u, 11f * u, 12.25f * u)
                cubicTo(11f * u, 11.09f * u, 10.43f * u, 9.99f * u, 9.29f * u, 9.06f * u)
                cubicTo(8.15f * u, 8.13f * u, 7.29f * u, 6.75f * u, 7f * u, 5.3f * u)
                cubicTo(6.71f * u, 6.75f * u, 5.86f * u, 8.14f * u, 4.71f * u, 9.06f * u)
                cubicTo(3.56f * u, 9.98f * u, 3f * u, 11.1f * u, 3f * u, 12.25f * u)
                cubicTo(3f * u, 14.47f * u, 4.8f * u, 16.3f * u, 7f * u, 16.3f * u)
                close()
            }
            drawPath(path = leftDrop, color = color.copy(alpha = leftAlpha), style = stroke)
        }

        // Larger right droplet:
        // M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97
        val rightDropDy = phase2 * 1.25f * u
        val rightAlpha = (0.82f + 0.18f * ((phase2 + 1f) * 0.5f)).coerceIn(0.75f, 1f)
        translate(left = 0f, top = rightDropDy) {
            val rightDrop = Path().apply {
                moveTo(12.56f * u, 6.6f * u)
                cubicTo(13.25f * u, 5.5f * u, 13.75f * u, 4.25f * u, 14f * u, 3.02f * u)
                cubicTo(14.5f * u, 5.52f * u, 16f * u, 7.92f * u, 18f * u, 9.52f * u)
                cubicTo(20f * u, 11.12f * u, 21f * u, 13.02f * u, 21f * u, 15.02f * u)
                cubicTo(21f * u, 18.88f * u, 17.87f * u, 22f * u, 14.01f * u, 22f * u)
                cubicTo(12.16f * u, 22f * u, 10.39f * u, 21.27f * u, 9.09f * u, 19.99f * u)
            }
            drawPath(path = rightDrop, color = color.copy(alpha = rightAlpha), style = stroke)
        }
    }
}

@Composable
private fun AnimatedLucideWindIcon(
    color: Color = Color.White,
    durationMillis: Int = 1550,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_wind")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wind_progress"
    )

    // Staggered horizontal steam/wind flow for the 3 Lucide Wind curves (1.55s loop)
    val p1 = kotlin.math.sin(progress * Math.PI * 2.0).toFloat()
    val p2 = kotlin.math.sin((progress + 0.25f) * Math.PI * 2.0).toFloat()
    val p3 = kotlin.math.sin((progress + 0.50f) * Math.PI * 2.0).toFloat()

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(
            width = 2f * u,
            cap = StrokeCap.Round,
            join = StrokeJoin.Round
        )

        // Top curve: M9.6 4.6A2 2 0 1 1 11 8H2
        translate(left = p1 * 1.1f * u, top = 0f) {
            val topPath = Path().apply {
                arcTo(
                    rect = Rect(9f * u, 4f * u, 13f * u, 8f * u),
                    startAngleDegrees = -135f,
                    sweepAngleDegrees = 225f,
                    forceMoveTo = true
                )
                lineTo(2f * u, 8f * u)
            }
            val a = (0.72f + 0.28f * ((p1 + 1f) * 0.5f)).coerceIn(0.65f, 1f)
            drawPath(path = topPath, color = color.copy(alpha = a), style = stroke)
        }

        // Middle curve: M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2
        translate(left = p2 * 1.25f * u, top = 0f) {
            val midPath = Path().apply {
                arcTo(
                    rect = Rect(17f * u, 7f * u, 22f * u, 12f * u),
                    startAngleDegrees = -136f,
                    sweepAngleDegrees = 226f,
                    forceMoveTo = true
                )
                lineTo(2f * u, 12f * u)
            }
            val a = (0.72f + 0.28f * ((p2 + 1f) * 0.5f)).coerceIn(0.65f, 1f)
            drawPath(path = midPath, color = color.copy(alpha = a), style = stroke)
        }

        // Bottom curve: M12.6 19.4A2 2 0 1 0 14 16H2
        translate(left = p3 * 1.1f * u, top = 0f) {
            val bottomPath = Path().apply {
                arcTo(
                    rect = Rect(12f * u, 16f * u, 16f * u, 20f * u),
                    startAngleDegrees = 135f,
                    sweepAngleDegrees = -225f,
                    forceMoveTo = true
                )
                lineTo(2f * u, 16f * u)
            }
            val a = (0.72f + 0.28f * ((p3 + 1f) * 0.5f)).coerceIn(0.65f, 1f)
            drawPath(path = bottomPath, color = color.copy(alpha = a), style = stroke)
        }
    }
}

@Composable
internal fun OrderClosingSuccessOverlay(
    ticketLabel: String,
    modifier: Modifier = Modifier
) {
    val overlayAlpha = remember { Animatable(0f) }
    val badgeScale = remember { Animatable(0.35f) }
    val ringProgress = remember { Animatable(0f) }
    val checkProgress = remember { Animatable(0f) }
    val burstProgress = remember { Animatable(0f) }
    val textAlpha = remember { Animatable(0f) }
    val countdownProgress = remember { Animatable(1f) }

    LaunchedEffect(Unit) {
        launch {
            countdownProgress.animateTo(0f, tween(durationMillis = 5000, easing = LinearEasing))
        }
        launch {
            overlayAlpha.animateTo(1f, tween(durationMillis = 220, easing = FastOutSlowInEasing))
        }
        launch {
            badgeScale.animateTo(
                targetValue = 1f,
                animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessMediumLow
                )
            )
        }
        launch {
            ringProgress.animateTo(1f, tween(durationMillis = 720, easing = FastOutSlowInEasing))
        }
        launch {
            delay(90L)
            checkProgress.animateTo(1f, tween(durationMillis = 380, easing = FastOutSlowInEasing))
        }
        launch {
            delay(120L)
            burstProgress.animateTo(1f, tween(durationMillis = 780, easing = FastOutSlowInEasing))
        }
        launch {
            delay(200L)
            textAlpha.animateTo(1f, tween(durationMillis = 260, easing = FastOutSlowInEasing))
        }
    }

    val isDark = MaterialTheme.klinUpColors.isDark
    val overlayBg = if (isDark) Color(0xF2062417) else Color(0xF5ECFDF5)
    val emerald = Color(0xFF059669)
    val emeraldBright = Color(0xFF10B981)
    val gold = Color(0xFFF59E0B)
    val sky = Color(0xFF3B82F6)

    Surface(
        modifier = modifier.graphicsLayer { alpha = overlayAlpha.value },
        shape = RoundedCornerShape(26.dp),
        color = overlayBg,
        border = BorderStroke(1.5.dp, emeraldBright.copy(alpha = 0.7f))
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // Concentric shockwaves + radial celebration confetti particles + animated checkmark
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f - 18.dp.toPx())

                // Expanding shockwave rings
                val r1 = (24.dp.toPx() + ringProgress.value * 84.dp.toPx())
                val a1 = ((1f - ringProgress.value) * 0.45f).coerceIn(0f, 1f)
                drawCircle(
                    color = emeraldBright.copy(alpha = a1),
                    radius = r1,
                    center = center,
                    style = Stroke(width = 3.dp.toPx())
                )

                val r2Progress = ((ringProgress.value - 0.18f) / 0.82f).coerceIn(0f, 1f)
                if (r2Progress > 0f) {
                    val r2 = (20.dp.toPx() + r2Progress * 64.dp.toPx())
                    val a2 = ((1f - r2Progress) * 0.35f).coerceIn(0f, 1f)
                    drawCircle(
                        color = gold.copy(alpha = a2),
                        radius = r2,
                        center = center,
                        style = Stroke(width = 2.dp.toPx())
                    )
                }

                // 12 radial confetti sparkles
                val particleColors = listOf(emeraldBright, gold, sky, Color(0xFF34D399))
                val pAlpha = (1f - burstProgress.value).coerceIn(0f, 1f)
                if (pAlpha > 0.02f) {
                    for (i in 0 until 12) {
                        val angleRad = (i * (360.0 / 12.0)) * (Math.PI / 180.0)
                        val dist = (22.dp.toPx() + burstProgress.value * (if (i % 2 == 0) 74.dp.toPx() else 52.dp.toPx()))
                        val px = center.x + (kotlin.math.cos(angleRad) * dist).toFloat()
                        val py = center.y + (kotlin.math.sin(angleRad) * dist).toFloat() + (burstProgress.value * 10.dp.toPx())
                        val radius = (if (i % 2 == 0) 4.5.dp.toPx() else 3.2.dp.toPx()) * (1f - burstProgress.value * 0.4f)
                        drawCircle(
                            color = particleColors[i % particleColors.size].copy(alpha = pAlpha),
                            radius = radius,
                            center = Offset(px, py)
                        )
                    }
                }
            }

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .graphicsLayer {
                            scaleX = badgeScale.value
                            scaleY = badgeScale.value
                        }
                        .clip(CircleShape)
                        .background(emerald),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.size(30.dp)) {
                        val w = size.width
                        val h = size.height
                        val fullCheck = Path().apply {
                            moveTo(w * 0.20f, h * 0.52f)
                            lineTo(w * 0.42f, h * 0.74f)
                            lineTo(w * 0.82f, h * 0.28f)
                        }
                        val partialCheck = Path()
                        val measure = PathMeasure()
                        measure.setPath(fullCheck, false)
                        measure.getSegment(
                            startDistance = 0f,
                            stopDistance = measure.length * checkProgress.value,
                            destination = partialCheck,
                            startWithMoveTo = true
                        )
                        drawPath(
                            path = partialCheck,
                            color = Color.White,
                            style = Stroke(
                                width = 3.5.dp.toPx(),
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round
                            )
                        )
                    }
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp),
                    modifier = Modifier.graphicsLayer { alpha = textAlpha.value }
                ) {
                    Text(
                        text = "Commande clôturée !",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isDark) Color(0xFF6EE7B7) else Color(0xFF065F46)
                    )
                    Text(
                        text = "$ticketLabel restitué avec succès",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isDark) Color(0xFFA7F3D0) else Color(0xFF047857)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .width(120.dp)
                            .height(4.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(emeraldBright.copy(alpha = 0.22f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(countdownProgress.value.coerceIn(0f, 1f))
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(999.dp))
                                .background(emeraldBright)
                        )
                    }
                }
            }
        }
    }
}

private fun formatShortFrenchDate(iso: String?): String {
    if (iso.isNullOrBlank()) return "—"
    return runCatching {
        val instant = Instant.parse(iso)
        val zdt = instant.atZone(ZoneId.systemDefault())
        DateTimeFormatter.ofPattern("d MMM", Locale.FRENCH).format(zdt)
    }.getOrElse { iso.take(10) }
}

@Composable
private fun FixModalStatusBar(isDark: Boolean) {
    val view = LocalView.current
    SideEffect {
        val win = (view.parent as? DialogWindowProvider)?.window ?: return@SideEffect
        val controller = WindowCompat.getInsetsController(win, view)
        controller.isAppearanceLightStatusBars = !isDark
        controller.isAppearanceLightNavigationBars = !isDark
    }
}

@Composable
private fun GestionExpenseCard(
    expense: Expense,
    onClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = InvoiceBg,
                            border = BorderStroke(1.dp, InvoiceBorder),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = ExpenseCatalog.categoryLabel(expense.category),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = BrandText,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                        Surface(
                            color = ChipBg,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = if (expense.source == "admin") "Admin" else "App",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkSecondary,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                            )
                        }
                        if (!expense.receiptUrl.isNullOrBlank()) {
                            Surface(
                                color = MaterialTheme.klinUpColors.softGreenBg,
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = "Facture",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.klinUpColors.greenText,
                                    modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = expense.label,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (!expense.description.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = expense.description,
                            fontSize = 12.sp,
                            color = InkSecondary,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "-${KlinUpRepository.formatFcfa(expense.amount)}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = CancelRed
                    )
                    IconButton(
                        onClick = onDeleteClick,
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Trash,
                            contentDescription = "Supprimer",
                            tint = InkMuted,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            HorizontalDivider(color = CardBorder)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${expense.expenseDate.ifBlank { formatShortFrenchDate(expense.createdAt) }} • ${ExpenseCatalog.paymentLabel(expense.paymentMethod)}",
                    fontSize = 12.sp,
                    color = InkSecondary
                )
                val metaRight = listOfNotNull(
                    expense.reference?.takeIf { it.isNotBlank() }?.let { "Réf: $it" },
                    expense.createdByName?.takeIf { it.isNotBlank() }
                ).joinToString(" • ")
                if (metaRight.isNotBlank()) {
                    Text(
                        text = metaRight,
                        fontSize = 11.sp,
                        color = InkMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
