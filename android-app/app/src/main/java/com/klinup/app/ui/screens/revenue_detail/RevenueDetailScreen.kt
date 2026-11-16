package com.klinup.app.ui.screens.revenue_detail

import com.klinup.app.ui.components.TablerIcons

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.People
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DateRangePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.Expense
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.bouncyClickable
import com.klinup.app.ui.theme.klinUpColors
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.roundToInt

private enum class RevenuePreset(val label: String) {
    TODAY("Aujourd'hui"),
    LAST_7("7 jours"),
    THIS_MONTH("Ce mois"),
    LAST_MONTH("Mois dernier"),
    LAST_90("3 mois"),
    THIS_YEAR("Année"),
    ALL("Tout"),
    CUSTOM("Personnalisé")
}

private enum class ChartMetricMode(val label: String) {
    BILLED("CA Facturé"),
    COLLECTED("Encaissé")
}

@Immutable
private data class RevenueBucket(
    val label: String,
    val fullLabel: String,
    val billed: Double,
    val collected: Double,
    val ordersCount: Int
)

@Immutable
private data class BreakdownItem(
    val label: String,
    val amount: Double,
    val count: Int,
    val share: Float,
    val color: Color
)

@Immutable
private data class TopCustomerRevenue(
    val name: String,
    val ordersCount: Int,
    val amount: Double,
    val share: Float
)

@Immutable
private data class RevenueAnalyticsModel(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val daysCount: Long,
    val totalBilled: Double,
    val totalCollected: Double,
    val pendingBalance: Double,
    val collectionRate: Float,
    val prevBilled: Double,
    val trendPct: Int,
    val totalExpenses: Double,
    val netResult: Double,
    val ordersCount: Int,
    val cancelledCount: Int,
    val cancelledAmount: Double,
    val avgBasket: Double,
    val maxTicket: Double,
    val avgDaily: Double,
    val bestDayLabel: String,
    val bestDayAmount: Double,
    val expressCount: Int,
    val expressRevenue: Double,
    val uniqueCustomers: Int,
    val repeatCustomers: Int,
    val finalizedCount: Int,
    val buckets: List<RevenueBucket>,
    val byService: List<BreakdownItem>,
    val byPayment: List<BreakdownItem>,
    val byWeekday: List<BreakdownItem>,
    val topCustomers: List<TopCustomerRevenue>,
    val insightText: String
)

private val BrandBlue = Color(0xFF0D2FE8)
private val BrandIndigo = Color(0xFF4F46E5)
private val EmeraldGreen = Color(0xFF10B981)
private val DangerRed = Color(0xFFEF4444)
private val AmberGold = Color(0xFFF59E0B)
private val VioletAccent = Color(0xFF8B5CF6)
private val PinkAccent = Color(0xFFEC4899)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RevenueDetailScreen(
    onBack: () -> Unit
) {
    val kc = MaterialTheme.klinUpColors
    val haptics = LocalHapticFeedback.current
    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    val allOrders by KlinUpRepository.orders.collectAsState()
    val allExpenses by KlinUpRepository.expenses.collectAsState()
    val allCustomers by KlinUpRepository.customers.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()

    val zone = remember { ZoneId.systemDefault() }
    val today = remember { LocalDate.now(zone) }

    var selectedPreset by remember { mutableStateOf(RevenuePreset.THIS_MONTH) }
    var customStartDate by remember { mutableStateOf(today.withDayOfMonth(1)) }
    var customEndDate by remember { mutableStateOf(today) }
    var showDateRangePicker by remember { mutableStateOf(false) }

    var chartMode by remember { mutableStateOf(ChartMetricMode.BILLED) }
    var selectedBarIndex by remember { mutableIntStateOf(-1) }

    val storeOrders = remember(allOrders, selectedStoreId) {
        if (selectedStoreId.isBlank() || selectedStoreId == "all" || selectedStoreId == "GLOBAL") {
            allOrders
        } else {
            allOrders.filter { it.storeId == selectedStoreId }
        }
    }

    val storeExpenses = remember(allExpenses, selectedStoreId) {
        if (selectedStoreId.isBlank() || selectedStoreId == "all" || selectedStoreId == "GLOBAL") {
            allExpenses.filter { it.status != "rejetee" }
        } else {
            allExpenses.filter { it.storeId == selectedStoreId && it.status != "rejetee" }
        }
    }

    val storeLabel = remember(stores, selectedStoreId) {
        if (selectedStoreId.isBlank() || selectedStoreId == "all" || selectedStoreId == "GLOBAL") {
            "Tous les magasins"
        } else {
            stores.firstOrNull { it.id == selectedStoreId || it.code == selectedStoreId }?.nom ?: selectedStoreId
        }
    }

    val earliestOrderDate = remember(storeOrders) {
        storeOrders.mapNotNull { parseDate(it.createdAt, zone) }.minOrNull() ?: today.withDayOfMonth(1)
    }

    val (activeStart, activeEnd) = remember(selectedPreset, customStartDate, customEndDate, today, earliestOrderDate) {
        when (selectedPreset) {
            RevenuePreset.TODAY -> today to today
            RevenuePreset.LAST_7 -> today.minusDays(6) to today
            RevenuePreset.THIS_MONTH -> today.withDayOfMonth(1) to today
            RevenuePreset.LAST_MONTH -> {
                val prev = today.minusMonths(1)
                prev.withDayOfMonth(1) to prev.withDayOfMonth(prev.lengthOfMonth())
            }
            RevenuePreset.LAST_90 -> today.minusDays(89) to today
            RevenuePreset.THIS_YEAR -> today.withDayOfYear(1) to today
            RevenuePreset.ALL -> earliestOrderDate to today
            RevenuePreset.CUSTOM -> {
                if (customStartDate.isAfter(customEndDate)) customEndDate to customStartDate
                else customStartDate to customEndDate
            }
        }
    }

    val analytics = remember(storeOrders, storeExpenses, allCustomers, activeStart, activeEnd, zone) {
        buildRevenueAnalytics(
            orders = storeOrders,
            expenses = storeExpenses,
            customers = allCustomers,
            startDate = activeStart,
            endDate = activeEnd,
            zone = zone
        )
    }

    val dateFormatter = remember { DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.FRENCH) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(kc.pageBg)
    ) {
        // ── Top Bar ───────────────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = statusBarTop + 10.dp, start = 16.dp, end = 16.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .bouncyClickable(pressedScale = 0.92f, role = Role.Button, onClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onBack()
                    }),
                shape = CircleShape,
                color = kc.cardBg,
                border = BorderStroke(1.dp, kc.border),
                shadowElevation = 0.dp
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = TablerIcons.ArrowLeft,
                        contentDescription = "Retour",
                        tint = kc.inkPrimary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Statistiques du CA",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = kc.inkPrimary
                )
                Text(
                    text = storeLabel,
                    fontSize = 12.sp,
                    color = kc.inkSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }

        // ── Period Presets Row ────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            RevenuePreset.entries.forEach { preset ->
                val isSelected = preset == selectedPreset
                Surface(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .bouncyClickable(pressedScale = 0.95f, role = Role.Tab) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            selectedBarIndex = -1
                            if (preset == RevenuePreset.CUSTOM) {
                                showDateRangePicker = true
                            } else {
                                selectedPreset = preset
                            }
                        },
                    shape = RoundedCornerShape(999.dp),
                    color = if (isSelected) BrandBlue else kc.cardBg,
                    border = if (isSelected) null else BorderStroke(1.dp, kc.border)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 13.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        if (preset == RevenuePreset.CUSTOM) {
                            Icon(
                                imageVector = TablerIcons.Calendar,
                                contentDescription = null,
                                tint = if (isSelected) Color.White else kc.inkSecondary,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                        Text(
                            text = preset.label,
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color.White else kc.inkSecondary
                        )
                    }
                }
            }
        }

        // ── Active Date Range Banner ──────────────────────────────────────────
        Surface(
            onClick = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                showDateRangePicker = true
            },
            shape = RoundedCornerShape(26.dp),
            color = kc.cardBg,
            border = BorderStroke(1.dp, kc.border),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = TablerIcons.Calendar,
                        contentDescription = null,
                        tint = kc.brandText,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "${activeStart.format(dateFormatter)}  →  ${activeEnd.format(dateFormatter)}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = kc.inkPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = kc.softBlueBg
                ) {
                    Text(
                        text = "${analytics.daysCount} j",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = kc.brandText,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                    )
                }
            }
        }

        // ── Main Content ──────────────────────────────────────────────────────
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = 6.dp,
                bottom = navBarBottom + 24.dp
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Hero CA Card
            item(key = "hero_ca") {
                AnimatedContent(
                    targetState = analytics,
                    transitionSpec = { fadeIn(tween(220)) togetherWith fadeOut(tween(140)) },
                    label = "hero_ca_anim"
                ) { data ->
                    RevenueHeroCard(data = data)
                }
            }

            // 2. Advanced KPI Grid (6 tiles)
            item(key = "stat_grid") {
                val tiles = listOf(
                    Triple("Commandes actives", "${dataCountLabel(analytics.ordersCount)}", "Hors ${analytics.cancelledCount} annulée(s)"),
                    Triple("Panier moyen", KlinUpRepository.formatFcfa(analytics.avgBasket), "Ticket max : ${KlinUpRepository.formatFcfa(analytics.maxTicket)}"),
                    Triple("Moyenne / jour", KlinUpRepository.formatFcfa(analytics.avgDaily), "Pic : ${analytics.bestDayLabel}"),
                    Triple("Dépenses période", "-${KlinUpRepository.formatFcfa(analytics.totalExpenses)}", "Résultat net : ${KlinUpRepository.formatFcfa(analytics.netResult)}"),
                    Triple("Commandes Express", "${analytics.expressCount}", "CA Express : ${KlinUpRepository.formatFcfa(analytics.expressRevenue)}"),
                    Triple("Clients actifs", "${analytics.uniqueCustomers}", "${analytics.repeatCustomers} fidèles (2+ cmd)")
                )
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    tiles.chunked(2).forEach { pair ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            pair.forEach { (title, value, helper) ->
                                Surface(
                                    shape = RoundedCornerShape(26.dp),
                                    color = kc.cardBg,
                                    border = BorderStroke(1.dp, kc.border),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(14.dp),
                                        verticalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Text(
                                            text = title,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = kc.inkSecondary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = value,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = kc.inkPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = helper,
                                            fontSize = 11.sp,
                                            color = kc.inkMuted,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Interactive Revenue Evolution Chart
            item(key = "chart_card") {
                RevenueEvolutionCard(
                    buckets = analytics.buckets,
                    mode = chartMode,
                    onModeChange = {
                        chartMode = it
                        selectedBarIndex = -1
                    },
                    selectedIndex = selectedBarIndex,
                    onSelectBar = { idx ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        selectedBarIndex = if (selectedBarIndex == idx) -1 else idx
                    }
                )
            }

            // 4. Breakdown by Service
            if (analytics.byService.isNotEmpty()) {
                item(key = "service_breakdown") {
                    BreakdownCard(
                        title = "Répartition par type de service",
                        icon = TablerIcons.Receipt,
                        items = analytics.byService
                    )
                }
            }

            // 5. Breakdown by Payment Method
            if (analytics.byPayment.isNotEmpty()) {
                item(key = "payment_breakdown") {
                    BreakdownCard(
                        title = "Répartition par mode de règlement",
                        icon = TablerIcons.Cash,
                        items = analytics.byPayment
                    )
                }
            }

            // 6. Breakdown by Weekday
            if (analytics.byWeekday.isNotEmpty()) {
                item(key = "weekday_breakdown") {
                    BreakdownCard(
                        title = "Performance par jour de la semaine",
                        icon = TablerIcons.Calendar,
                        items = analytics.byWeekday
                    )
                }
            }

            // 7. Top Customers on Period
            if (analytics.topCustomers.isNotEmpty()) {
                item(key = "top_customers") {
                    TopCustomersCard(customers = analytics.topCustomers)
                }
            }

            // 8. Insight Card
            item(key = "insight") {
                Surface(
                    shape = RoundedCornerShape(26.dp),
                    color = kc.softBlueBg,
                    border = BorderStroke(1.dp, kc.softBlueBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = BrandBlue,
                            modifier = Modifier.size(34.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = TablerIcons.Sparkles,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "Synthèse de la période",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = kc.inkPrimary
                            )
                            Text(
                                text = analytics.insightText,
                                fontSize = 13.sp,
                                color = kc.inkSecondary,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // ── Material 3 Custom Date Range Picker Dialog ───────────────────────────
    if (showDateRangePicker) {
        val initialStartMillis = remember(activeStart) {
            activeStart.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        }
        val initialEndMillis = remember(activeEnd) {
            activeEnd.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
        }
        val pickerState = rememberDateRangePickerState(
            initialSelectedStartDateMillis = initialStartMillis,
            initialSelectedEndDateMillis = initialEndMillis
        )

        DatePickerDialog(
            onDismissRequest = { showDateRangePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        val sMillis = pickerState.selectedStartDateMillis
                        val eMillis = pickerState.selectedEndDateMillis ?: sMillis
                        if (sMillis != null && eMillis != null) {
                            customStartDate = Instant.ofEpochMilli(sMillis).atZone(ZoneOffset.UTC).toLocalDate()
                            customEndDate = Instant.ofEpochMilli(eMillis).atZone(ZoneOffset.UTC).toLocalDate()
                            selectedPreset = RevenuePreset.CUSTOM
                            selectedBarIndex = -1
                        }
                        showDateRangePicker = false
                    },
                    enabled = pickerState.selectedStartDateMillis != null
                ) {
                    Text("Appliquer", color = kc.brandText, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDateRangePicker = false }) {
                    Text("Annuler", color = kc.inkSecondary)
                }
            },
            colors = DatePickerDefaults.colors(containerColor = kc.cardBg)
        ) {
            DateRangePicker(
                state = pickerState,
                title = {
                    Text(
                        text = "Sélectionner une plage de dates",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(start = 20.dp, top = 16.dp)
                    )
                },
                colors = DatePickerDefaults.colors(
                    containerColor = kc.cardBg,
                    selectedDayContainerColor = BrandBlue,
                    todayDateBorderColor = kc.brandText,
                    todayContentColor = kc.brandText,
                    dayInSelectionRangeContainerColor = BrandBlue.copy(alpha = 0.14f)
                )
            )
        }
    }
}

@Composable
private fun RevenueHeroCard(data: RevenueAnalyticsModel) {
    val trendPositive = data.trendPct >= 0
    val sign = if (trendPositive) "+" else ""
    val ratePct = (data.collectionRate * 100f).roundToInt().coerceIn(0, 100)

    Surface(
        shape = RoundedCornerShape(26.dp),
        color = Color.Transparent,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(Color(0xFF0D2FE8), Color(0xFF3730A3))
                    )
                )
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Chiffre d'affaires",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = if (trendPositive) EmeraldGreen.copy(alpha = 0.22f) else DangerRed.copy(alpha = 0.24f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = if (trendPositive) TablerIcons.TrendingUp else TablerIcons.TrendingDown,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = "$sign${data.trendPct}% vs période préc.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }

                Text(
                    text = KlinUpRepository.formatFcfa(data.totalBilled),
                    fontSize = 30.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )

                // Collection rate progress bar
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Taux d'encaissement",
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.80f)
                        )
                        Text(
                            text = "$ratePct%",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(7.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color.White.copy(alpha = 0.20f))
                    ) {
                        val animProgress by animateFloatAsState(
                            targetValue = data.collectionRate.coerceIn(0f, 1f),
                            animationSpec = tween(550, easing = FastOutSlowInEasing),
                            label = "collection_rate"
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(animProgress)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(999.dp))
                                .background(EmeraldGreen)
                        )
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.16f))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Encaissé", fontSize = 11.sp, color = Color.White.copy(alpha = 0.72f))
                        Text(
                            text = KlinUpRepository.formatFcfa(data.totalCollected),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Reste à percevoir", fontSize = 11.sp, color = Color.White.copy(alpha = 0.72f))
                        Text(
                            text = KlinUpRepository.formatFcfa(data.pendingBalance),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Période préc.", fontSize = 11.sp, color = Color.White.copy(alpha = 0.72f))
                        Text(
                            text = KlinUpRepository.formatFcfa(data.prevBilled),
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

@Composable
private fun RevenueEvolutionCard(
    buckets: List<RevenueBucket>,
    mode: ChartMetricMode,
    onModeChange: (ChartMetricMode) -> Unit,
    selectedIndex: Int,
    onSelectBar: (Int) -> Unit
) {
    val kc = MaterialTheme.klinUpColors
    val values = remember(buckets, mode) {
        buckets.map { if (mode == ChartMetricMode.BILLED) it.billed else it.collected }
    }
    val maxVal = remember(values) { values.maxOrNull()?.takeIf { it > 0.0 } ?: 1.0 }

    Surface(
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        modifier = Modifier.fillMaxWidth()
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
                Text(
                    text = "Évolution sur la période",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = kc.inkPrimary
                )
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(kc.chipBg)
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    ChartMetricMode.entries.forEach { m ->
                        val active = m == mode
                        Surface(
                            onClick = { onModeChange(m) },
                            shape = RoundedCornerShape(999.dp),
                            color = if (active) BrandBlue else Color.Transparent
                        ) {
                            Text(
                                text = m.label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (active) Color.White else kc.inkSecondary,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }

            if (selectedIndex in buckets.indices) {
                val b = buckets[selectedIndex]
                val valAmt = if (mode == ChartMetricMode.BILLED) b.billed else b.collected
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = kc.softBlueBg,
                    border = BorderStroke(1.dp, kc.softBlueBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = b.fullLabel,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = kc.inkPrimary
                            )
                            Text(
                                text = "${b.ordersCount} commande(s)",
                                fontSize = 11.sp,
                                color = kc.inkSecondary
                            )
                        }
                        Text(
                            text = KlinUpRepository.formatFcfa(valAmt),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = kc.brandText
                        )
                    }
                }
            }

            if (buckets.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aucune donnée sur cette période", fontSize = 13.sp, color = kc.inkMuted)
                }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    buckets.forEachIndexed { idx, bucket ->
                        val v = if (mode == ChartMetricMode.BILLED) bucket.billed else bucket.collected
                        val ratio = (v / maxVal).toFloat().coerceIn(0f, 1f)
                        val animRatio by animateFloatAsState(
                            targetValue = ratio,
                            animationSpec = tween(420, easing = FastOutSlowInEasing),
                            label = "bar_$idx"
                        )
                        val isSelected = idx == selectedIndex
                        val barColor = when {
                            isSelected -> AmberGold
                            mode == ChartMetricMode.COLLECTED -> EmeraldGreen
                            kc.isDark -> Color(0xFF607BFF)
                            else -> BrandBlue
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Bottom,
                            modifier = Modifier
                                .width(if (buckets.size <= 8) 38.dp else 32.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { onSelectBar(idx) }
                                .padding(vertical = 4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(18.dp)
                                    .height(130.dp),
                                contentAlignment = Alignment.BottomCenter
                            ) {
                                Canvas(modifier = Modifier.fillMaxSize()) {
                                    // Track
                                    drawRoundRect(
                                        color = kc.chipBg,
                                        topLeft = Offset.Zero,
                                        size = size,
                                        cornerRadius = CornerRadius(12f, 12f)
                                    )
                                    val barH = (size.height * animRatio).coerceAtLeast(if (v > 0) 8f else 0f)
                                    if (barH > 0f) {
                                        drawRoundRect(
                                            color = barColor,
                                            topLeft = Offset(0f, size.height - barH),
                                            size = Size(size.width, barH),
                                            cornerRadius = CornerRadius(12f, 12f)
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = bucket.label,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSelected) kc.brandText else kc.inkMuted,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BreakdownCard(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    items: List<BreakdownItem>
) {
    val kc = MaterialTheme.klinUpColors
    Surface(
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(icon, contentDescription = null, tint = kc.brandText, modifier = Modifier.size(18.dp))
                Text(title, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = kc.inkPrimary)
            }

            items.forEach { item ->
                val pct = (item.share * 100f).roundToInt().coerceIn(0, 100)
                val itemColor = if (kc.isDark && item.color == BrandBlue) Color(0xFF607BFF) else item.color
                Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(9.dp)
                                    .clip(CircleShape)
                                    .background(itemColor)
                            )
                            Text(
                                text = "${item.label} (${item.count})",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = kc.inkPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = "${KlinUpRepository.formatFcfa(item.amount)} • $pct%",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = kc.inkSecondary
                        )
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(999.dp))
                            .background(kc.chipBg)
                    ) {
                        val animShare by animateFloatAsState(
                            targetValue = item.share.coerceIn(0f, 1f),
                            animationSpec = tween(450, easing = FastOutSlowInEasing),
                            label = "share_${item.label}"
                        )
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(animShare)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(999.dp))
                                .background(itemColor)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TopCustomersCard(customers: List<TopCustomerRevenue>) {
    val kc = MaterialTheme.klinUpColors
    Surface(
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(TablerIcons.Users, contentDescription = null, tint = kc.brandText, modifier = Modifier.size(18.dp))
                Text("Top clients sur la période", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = kc.inkPrimary)
            }

            customers.forEachIndexed { idx, c ->
                if (idx > 0) HorizontalDivider(color = kc.divider)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = if (idx == 0) AmberGold.copy(alpha = 0.16f) else kc.chipBg,
                            modifier = Modifier.size(30.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = "#${idx + 1}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (idx == 0) AmberGold else kc.inkSecondary
                                )
                            }
                        }
                        Column {
                            Text(
                                text = c.name,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = kc.inkPrimary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${c.ordersCount} commande(s)",
                                fontSize = 11.sp,
                                color = kc.inkMuted
                            )
                        }
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = KlinUpRepository.formatFcfa(c.amount),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = kc.inkPrimary
                        )
                        Text(
                            text = "${(c.share * 100f).roundToInt()}% du CA",
                            fontSize = 11.sp,
                            color = kc.inkMuted
                        )
                    }
                }
            }
        }
    }
}

private fun dataCountLabel(count: Int): String = "$count"

private fun parseDate(iso: String?, zone: ZoneId): LocalDate? {
    if (iso.isNullOrBlank()) return null
    return runCatching {
        Instant.parse(iso).atZone(zone).toLocalDate()
    }.getOrElse {
        runCatching { LocalDate.parse(iso.take(10)) }.getOrNull()
    }
}

private fun collectedAmount(order: Order): Double {
    return if (order.statut == "restitue") order.prixTotal
    else order.avancePayee.coerceIn(0.0, order.prixTotal)
}

private fun buildRevenueAnalytics(
    orders: List<Order>,
    expenses: List<Expense>,
    customers: List<Customer>,
    startDate: LocalDate,
    endDate: LocalDate,
    zone: ZoneId
): RevenueAnalyticsModel {
    val palette = listOf(BrandBlue, EmeraldGreen, AmberGold, VioletAccent, PinkAccent)
    val customerNames = customers.associate { it.id to it.fullName }

    val daysCount = (ChronoUnit.DAYS.between(startDate, endDate) + 1).coerceAtLeast(1L)
    val prevEnd = startDate.minusDays(1)
    val prevStart = prevEnd.minusDays(daysCount - 1)

    val allDated = orders.map { it to parseDate(it.createdAt, zone) }
    val periodAll = allDated.filter { (_, d) -> d != null && !d.isBefore(startDate) && !d.isAfter(endDate) }
    val periodActive = periodAll.filter { (o, _) -> o.statut != "annule" }
    val periodCancelled = periodAll.filter { (o, _) -> o.statut == "annule" }.map { it.first }

    val prevActive = allDated.filter { (o, d) ->
        o.statut != "annule" && d != null && !d.isBefore(prevStart) && !d.isAfter(prevEnd)
    }.map { it.first }

    val activeOrders = periodActive.map { it.first }
    val totalBilled = activeOrders.sumOf { it.prixTotal }
    val totalCollected = activeOrders.sumOf { collectedAmount(it) }
    val pendingBalance = (totalBilled - totalCollected).coerceAtLeast(0.0)
    val collectionRate = if (totalBilled > 0.0) (totalCollected / totalBilled).toFloat().coerceIn(0f, 1f) else 0f

    val prevBilled = prevActive.sumOf { it.prixTotal }
    val trendPct = if (prevBilled <= 0.0) {
        if (totalBilled > 0.0) 100 else 0
    } else {
        (((totalBilled - prevBilled) / prevBilled) * 100.0).roundToInt()
    }

    val totalExpenses = expenses.filter { exp ->
        val d = parseDate(exp.expenseDate.ifBlank { exp.createdAt }, zone)
        d != null && !d.isBefore(startDate) && !d.isAfter(endDate)
    }.sumOf { it.amount }
    val netResult = totalBilled - totalExpenses

    val avgBasket = if (activeOrders.isEmpty()) 0.0 else totalBilled / activeOrders.size
    val maxTicket = activeOrders.maxOfOrNull { it.prixTotal } ?: 0.0
    val avgDaily = totalBilled / daysCount.toDouble()

    val byDay = periodActive.groupBy { it.second!! }
    val bestDayEntry = byDay.maxByOrNull { (_, list) -> list.sumOf { it.first.prixTotal } }
    val dayFmt = DateTimeFormatter.ofPattern("dd/MM", Locale.FRENCH)
    val fullDayFmt = DateTimeFormatter.ofPattern("EEE dd MMM", Locale.FRENCH)
    val bestDayLabel = bestDayEntry?.key?.format(dayFmt) ?: "—"
    val bestDayAmount = bestDayEntry?.value?.sumOf { it.first.prixTotal } ?: 0.0

    val expressOrders = activeOrders.filter { it.niveauUrgence.equals("Express", ignoreCase = true) }
    val expressRevenue = expressOrders.sumOf { it.prixTotal }

    val byCustomerId = activeOrders.filter { !it.customerId.isNullOrBlank() }.groupBy { it.customerId!! }
    val uniqueCustomers = byCustomerId.size
    val repeatCustomers = byCustomerId.count { it.value.size >= 2 }
    val finalizedCount = activeOrders.count { it.statut == "restitue" }

    // Adaptive chart buckets
    val buckets: List<RevenueBucket> = when {
        daysCount <= 31L -> {
            (0 until daysCount.toInt()).map { offset ->
                val day = startDate.plusDays(offset.toLong())
                val dayOrders = byDay[day]?.map { it.first }.orEmpty()
                RevenueBucket(
                    label = if (daysCount <= 7L) {
                        day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                            .replace(".", "")
                            .replaceFirstChar { it.uppercase() }
                            .take(3)
                    } else {
                        day.format(dayFmt)
                    },
                    fullLabel = day.format(fullDayFmt),
                    billed = dayOrders.sumOf { it.prixTotal },
                    collected = dayOrders.sumOf { collectedAmount(it) },
                    ordersCount = dayOrders.size
                )
            }
        }
        daysCount <= 120L -> {
            val totalWeeks = ((daysCount + 6) / 7).toInt()
            (0 until totalWeeks).map { w ->
                val wStart = startDate.plusDays(w * 7L)
                val wEnd = minOf(endDate, wStart.plusDays(6))
                val wOrders = periodActive.filter { (_, d) -> !d!!.isBefore(wStart) && !d.isAfter(wEnd) }.map { it.first }
                RevenueBucket(
                    label = "S${w + 1}",
                    fullLabel = "${wStart.format(dayFmt)} - ${wEnd.format(dayFmt)}",
                    billed = wOrders.sumOf { it.prixTotal },
                    collected = wOrders.sumOf { collectedAmount(it) },
                    ordersCount = wOrders.size
                )
            }
        }
        else -> {
            val startYm = YearMonth.from(startDate)
            val endYm = YearMonth.from(endDate)
            val months = mutableListOf<YearMonth>()
            var cur = startYm
            while (!cur.isAfter(endYm)) {
                months.add(cur)
                cur = cur.plusMonths(1)
            }
            months.map { ym ->
                val mOrders = periodActive.filter { (_, d) -> YearMonth.from(d) == ym }.map { it.first }
                val mLbl = ym.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                    .replace(".", "")
                    .replaceFirstChar { it.uppercase() }
                RevenueBucket(
                    label = mLbl,
                    fullLabel = "$mLbl ${ym.year}",
                    billed = mOrders.sumOf { it.prixTotal },
                    collected = mOrders.sumOf { collectedAmount(it) },
                    ordersCount = mOrders.size
                )
            }
        }
    }

    val denomCa = totalBilled.coerceAtLeast(1.0)
    val byService = activeOrders
        .groupBy { it.typeService.ifBlank { "Classique" } }
        .entries
        .sortedByDescending { e -> e.value.sumOf { it.prixTotal } }
        .take(5)
        .mapIndexed { idx, (svc, list) ->
            val sum = list.sumOf { it.prixTotal }
            BreakdownItem(
                label = svc,
                amount = sum,
                count = list.size,
                share = (sum / denomCa).toFloat(),
                color = palette[idx % palette.size]
            )
        }

    val byPayment = activeOrders
        .groupBy {
            when (it.modeReglement.lowercase()) {
                "especes", "espece" -> "Espèces"
                "mobile_money", "momo" -> "Mobile Money"
                "abonnement" -> "Abonnement"
                "non_regle", "" -> "Non réglé"
                else -> it.modeReglement
            }
        }
        .entries
        .sortedByDescending { e -> e.value.sumOf { it.prixTotal } }
        .mapIndexed { idx, (mode, list) ->
            val sum = list.sumOf { it.prixTotal }
            BreakdownItem(
                label = mode,
                amount = sum,
                count = list.size,
                share = (sum / denomCa).toFloat(),
                color = palette[idx % palette.size]
            )
        }

    val byWeekday = periodActive
        .groupBy { it.second!!.dayOfWeek }
        .entries
        .sortedByDescending { e -> e.value.sumOf { it.first.prixTotal } }
        .mapIndexed { idx, (dow, list) ->
            val sum = list.sumOf { it.first.prixTotal }
            val lbl = dow.getDisplayName(TextStyle.FULL, Locale.FRENCH)
                .replaceFirstChar { it.uppercase() }
            BreakdownItem(
                label = lbl,
                amount = sum,
                count = list.size,
                share = (sum / denomCa).toFloat(),
                color = palette[idx % palette.size]
            )
        }

    val topCustomers = byCustomerId.entries
        .sortedByDescending { e -> e.value.sumOf { it.prixTotal } }
        .take(5)
        .map { (cid, list) ->
            val sum = list.sumOf { it.prixTotal }
            TopCustomerRevenue(
                name = customerNames[cid] ?: "Client",
                ordersCount = list.size,
                amount = sum,
                share = (sum / denomCa).toFloat()
            )
        }

    val topSvc = byService.firstOrNull()
    val insightText = buildString {
        if (activeOrders.isEmpty()) {
            append("Aucune commande enregistrée sur cette période du ${startDate.format(dayFmt)} au ${endDate.format(dayFmt)}.")
        } else {
            append("Sur cette période de $daysCount jour(s), le CA atteint ${KlinUpRepository.formatFcfa(totalBilled)} ")
            append("(${if (trendPct >= 0) "+" else ""}$trendPct% par rapport aux $daysCount jours précédents), ")
            append("avec un taux d'encaissement de ${(collectionRate * 100f).roundToInt()}%. ")
            if (topSvc != null) {
                append("Le service « ${topSvc.label} » représente ${(topSvc.share * 100f).roundToInt()}% du CA. ")
            }
            if (bestDayAmount > 0.0) {
                append("Votre meilleur jour a été le $bestDayLabel (${KlinUpRepository.formatFcfa(bestDayAmount)}).")
            }
        }
    }

    return RevenueAnalyticsModel(
        startDate = startDate,
        endDate = endDate,
        daysCount = daysCount,
        totalBilled = totalBilled,
        totalCollected = totalCollected,
        pendingBalance = pendingBalance,
        collectionRate = collectionRate,
        prevBilled = prevBilled,
        trendPct = trendPct,
        totalExpenses = totalExpenses,
        netResult = netResult,
        ordersCount = activeOrders.size,
        cancelledCount = periodCancelled.size,
        cancelledAmount = periodCancelled.sumOf { it.prixTotal },
        avgBasket = avgBasket,
        maxTicket = maxTicket,
        avgDaily = avgDaily,
        bestDayLabel = bestDayLabel,
        bestDayAmount = bestDayAmount,
        expressCount = expressOrders.size,
        expressRevenue = expressRevenue,
        uniqueCustomers = uniqueCustomers,
        repeatCustomers = repeatCustomers,
        finalizedCount = finalizedCount,
        buckets = buckets,
        byService = byService,
        byPayment = byPayment,
        byWeekday = byWeekday,
        topCustomers = topCustomers,
        insightText = insightText
    )
}
