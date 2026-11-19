package com.klinup.app.ui.screens.dashboard

import com.klinup.app.ui.components.TablerIcons

import android.Manifest
import android.graphics.BitmapFactory
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.ui.components.LocalBottomBarPadding
import com.klinup.app.ui.components.NotificationBottomSheet
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material.icons.outlined.AlarmOff
import androidx.compose.material.icons.outlined.Autorenew
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material.icons.outlined.ShoppingBasket
import androidx.compose.material.icons.outlined.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.local.AppPreferences
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.KlinUpDropdownItem
import com.klinup.app.ui.components.KlinUpDropdownMenu
import com.klinup.app.ui.components.NavMotion
import com.klinup.app.ui.components.bouncyClickable
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.TextStyle as JavaTextStyle
import java.util.Locale
import kotlin.math.roundToInt

// ─── Design Tokens (Reactive Light + Pure Black Dark Mode) ───────────────────
private val BrandBlue          = Color(0xFF2600F5)
private val PeriodPillPurple   = Color(0xFF5B46F6)
private val MiniBarLight       = Color(0xFFE2E4E9)
private val MiniBarViolet      = Color(0xFF6B5BFF)

private val PageBg: Color         @Composable get() = MaterialTheme.klinUpColors.pageBg
private val CardWhite: Color      @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color     @Composable get() = MaterialTheme.klinUpColors.border
private val TrackGray: Color      @Composable get() = MaterialTheme.klinUpColors.trackBg
private val AvatarBg: Color       @Composable get() = MaterialTheme.klinUpColors.avatarBg
private val AvatarIconTint: Color @Composable get() = MaterialTheme.klinUpColors.avatarIcon
private val PillMoreBg: Color     @Composable get() = MaterialTheme.klinUpColors.chipBg

private val InkPrimary: Color     @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color   @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color       @Composable get() = MaterialTheme.klinUpColors.inkMuted

// Status Pastel Cards
private val BluePastelBg       = Color(0xFFB6C8FF)
private val GreenPastelBg      = Color(0xFFB2FFB8)
private val RedPastelBg        = Color(0xFFFDA8AA)
private val YellowPastelBg     = Color(0xFFFAF0B2)

// Top Clients Gold Theme
private val ClientCardBg: Color     @Composable get() = if (MaterialTheme.klinUpColors.isDark) Color(0xFF141106) else Color(0xFFFFFDF0)
private val ClientCardBorder: Color @Composable get() = if (MaterialTheme.klinUpColors.isDark) Color(0xFF4B3B10) else Color(0xFFFDE68A)
private val GoldBadge          = Color(0xFFF5C443)
private val GoldProgressFill   = Color(0xFFF5B731)
private val GoldMedal          = Color(0xFFF59E0B)

// Active Orders Status Pills
private val StatusWaitingBg    = Color(0xFFF7CE46)
private val StatusInProgressBg = Color(0xFF64E33A)

// ─── UI Models ────────────────────────────────────────────────────────────────
@Immutable
private data class IndexedOrder(
    val order: Order,
    val createdZoned: ZonedDateTime?,
    val createdDate: LocalDate?,
    val dueInstant: Instant?
)

@Immutable
private data class RevenueBar(
    val day: String,
    val fraction: Float,
    val amount: Double = 0.0
)

@Immutable
private data class RevenueChartState(
    val bars: List<RevenueBar>,
    val totalRevenue: Double,
    val ordersCount: Int
)

@Immutable
private data class SummaryMetric(
    val title: String,
    val count: String,
    val icon: ImageVector,
    val background: Color,
    val darkBackground: Color,
    val darkAccent: Color
)

@Immutable
private data class BestClientItem(
    val id: String,
    val name: String,
    val points: Int,
    val ordersCount: Int,
    val progress: Float,
    val tier: String
)

@Immutable
private data class ActiveOrderItem(
    val id: String,
    val customerName: String,
    val orderNumber: String,
    val dateTime: String,
    val status: String,
    val rawStatus: String,
    val totalPrice: Double,
    val articlesCount: Int,
    val isInProgress: Boolean
)

// ─── Main Screen ──────────────────────────────────────────────────────────────
@Composable
fun DashboardScreen(
    userName: String = "User name",
    onNavigateToGestion: () -> Unit = {},
    onNavigateToClients: () -> Unit = {},
    onNavigateToCreate: () -> Unit = {},
    onProfileClick: () -> Unit = {},
    onOrderClick: (String) -> Unit = {},
    onCustomerClick: (String) -> Unit = {},
    onKpiClick: (String) -> Unit = {},
    onRevenueChartClick: () -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val haptics = LocalHapticFeedback.current

    val notifications by KlinUpNotificationManager.notifications.collectAsState()
    val unreadNotifCount by KlinUpNotificationManager.unreadCount.collectAsState()
    var showNotificationSheet by remember { mutableStateOf(false) }
    var hasNotifPermission by remember {
        mutableStateOf(KlinUpNotificationManager.hasNotificationPermission(context))
    }

    val notifPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasNotifPermission = granted || KlinUpNotificationManager.hasNotificationPermission(context)
    }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !hasNotifPermission) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val allOrders by KlinUpRepository.orders.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()

    val displayUserName = currentUser?.fullName ?: userName

    var selectedPeriod by remember { mutableStateOf("Cette semaine") }
    val periods = remember { listOf("Aujourd'hui", "Cette semaine", "Ce mois", "Cette année") }

    val storeOrders = remember(allOrders, selectedStoreId) {
        if (selectedStoreId == "all" || selectedStoreId == "GLOBAL") allOrders
        else allOrders.filter { it.storeId == selectedStoreId }
    }
    val nonCancelledOrders = remember(storeOrders) {
        storeOrders.filter { it.statut != "annule" }
    }
    val customerMap = remember(customers) { customers.associateBy { it.id } }

    // ── KPI Calculations (pre-indexed once per order refresh) ──────────────────
    val zone = remember { ZoneId.systemDefault() }
    val today = remember { LocalDate.now(zone) }
    val nowInstant = remember { Instant.now() }

    val indexedOrders = remember(storeOrders, zone) {
        storeOrders.map { order ->
            val createdInst = KlinUpRepository.parseInstant(order.createdAt)
            val zoned = createdInst?.atZone(zone)
            IndexedOrder(
                order = order,
                createdZoned = zoned,
                createdDate = zoned?.toLocalDate(),
                dueInstant = KlinUpRepository.parseInstant(order.dueDate)
            )
        }
    }
    val nonCancelledIndexed = remember(indexedOrders) {
        indexedOrders.filter { it.order.statut != "annule" }
    }

    val (monthlyRevenue, prevMonthRevenue) = remember(nonCancelledIndexed, today) {
        val prev = today.minusMonths(1)
        var currentSum = 0.0
        var prevSum = 0.0
        for (item in nonCancelledIndexed) {
            val d = item.createdDate ?: continue
            if (d.year == today.year && d.month == today.month) {
                currentSum += item.order.prixTotal
            } else if (d.year == prev.year && d.month == prev.month) {
                prevSum += item.order.prixTotal
            }
        }
        currentSum to prevSum
    }

    val monthlyRevenueText = remember(monthlyRevenue) {
        KlinUpRepository.formatFcfa(monthlyRevenue)
    }

    val monthlyTrendText = remember(monthlyRevenue, prevMonthRevenue) {
        if (prevMonthRevenue <= 0.0) {
            if (monthlyRevenue > 0.0) "+ 100% ce mois" else "0% ce mois"
        } else {
            val pct = (((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100.0).roundToInt()
            val sign = if (pct >= 0) "+" else ""
            "$sign $pct% ce mois"
        }
    }

    val (averageBasketText, averageBasketBars, averageBasketSubtitle) = remember(nonCancelledIndexed, today) {
        val avg = if (nonCancelledIndexed.isEmpty()) 0.0
        else nonCancelledIndexed.sumOf { it.order.prixTotal } / nonCancelledIndexed.size

        val dailyAvgs = (6 downTo 0).map { offset ->
            val targetDate = today.minusDays(offset.toLong())
            val dayOrders = nonCancelledIndexed.filter { it.createdDate == targetDate }
            if (dayOrders.isEmpty()) 0.0 else dayOrders.sumOf { it.order.prixTotal } / dayOrders.size
        }

        val hasRecentDays = dailyAvgs.any { it > 0.0 }
        val rawValues = if (hasRecentDays) {
            dailyAvgs
        } else {
            val recentOrders = nonCancelledIndexed
                .sortedBy { it.createdZoned?.toInstant()?.toEpochMilli() ?: 0L }
                .takeLast(7)
                .map { it.order.prixTotal }
            if (recentOrders.isEmpty()) List(7) { 0.0 }
            else List((7 - recentOrders.size).coerceAtLeast(0)) { 0.0 } + recentOrders
        }

        val maxVal = rawValues.maxOrNull()?.takeIf { it > 0.0 } ?: 1.0
        val normalized = rawValues.map { v ->
            if (v <= 0.0) 0f else (v / maxVal).toFloat().coerceIn(0.18f, 1f)
        }
        val subtitleLabel = if (hasRecentDays) {
            "7 derniers jours • Par cmd"
        } else if (nonCancelledIndexed.isNotEmpty()) {
            "Dernières cmd • Par cmd"
        } else {
            "Par commande"
        }
        Triple(KlinUpRepository.formatFcfa(avg), normalized, subtitleLabel)
    }

    val (collectedAmountText, collectionRatePct, remainingBalanceLabel) = remember(nonCancelledIndexed) {
        var billed = 0.0
        var collected = 0.0
        for (item in nonCancelledIndexed) {
            val o = item.order
            billed += o.prixTotal
            collected += if (o.statut == "restitue") o.prixTotal else o.avancePayee.coerceIn(0.0, o.prixTotal)
        }
        val rate = if (billed <= 0.0) 100 else ((collected / billed) * 100.0).roundToInt().coerceIn(0, 100)
        val remaining = (billed - collected).coerceAtLeast(0.0)
        Triple(
            KlinUpRepository.formatFcfa(collected),
            rate,
            "Reste : ${KlinUpRepository.formatFcfa(remaining)}"
        )
    }

    val (completionRatePct, completionRateText, completionSubtitle) = remember(nonCancelledIndexed) {
        val total = nonCancelledIndexed.size
        val completed = nonCancelledIndexed.count { it.order.statut == "restitue" }
        val pct = if (total == 0) 0 else ((completed * 100.0) / total).roundToInt().coerceIn(0, 100)
        Triple(pct, "$pct%", "$completed / $total livrées")
    }

    // ── Chart Bars (Dynamiques selon la période, zéro re-parsing) ─────────────
    val revenueChartState = remember(nonCancelledIndexed, selectedPeriod, today) {
        val monday = today.with(DayOfWeek.MONDAY)
        val sunday = today.with(DayOfWeek.SUNDAY)

        var totalRevenue = 0.0
        var ordersCount = 0

        val (labels, buckets) = when (selectedPeriod) {
            "Aujourd'hui" -> {
                val lbls = listOf("<10h", "10h", "12h", "14h", "16h", "18h", "20h+")
                val sums = DoubleArray(7)
                for (item in nonCancelledIndexed) {
                    val zdt = item.createdZoned ?: continue
                    if (item.createdDate != today) continue
                    val hr = zdt.hour
                    val idx = when {
                        hr < 10 -> 0
                        hr < 12 -> 1
                        hr < 14 -> 2
                        hr < 16 -> 3
                        hr < 18 -> 4
                        hr < 20 -> 5
                        else -> 6
                    }
                    val amt = item.order.prixTotal
                    sums[idx] += amt
                    totalRevenue += amt
                    ordersCount++
                }
                lbls to sums
            }
            "Ce mois" -> {
                val lbls = listOf("S1", "S2", "S3", "S4", "S5")
                val sums = DoubleArray(5)
                for (item in nonCancelledIndexed) {
                    val date = item.createdDate ?: continue
                    if (date.year != today.year || date.month != today.month) continue
                    val idx = ((date.dayOfMonth - 1) / 7).coerceIn(0, 4)
                    val amt = item.order.prixTotal
                    sums[idx] += amt
                    totalRevenue += amt
                    ordersCount++
                }
                lbls to sums
            }
            "Cette année" -> {
                val months = (5 downTo 0).map { today.minusMonths(it.toLong()) }
                val lbls = months.map {
                    it.month.getDisplayName(JavaTextStyle.SHORT, Locale.FRENCH)
                        .replace(".", "")
                        .replaceFirstChar { ch -> ch.uppercase() }
                        .take(4)
                }
                val sums = DoubleArray(6)
                for (item in nonCancelledIndexed) {
                    val date = item.createdDate ?: continue
                    val idx = months.indexOfFirst { it.year == date.year && it.month == date.month }
                    if (idx == -1) continue
                    val amt = item.order.prixTotal
                    sums[idx] += amt
                    totalRevenue += amt
                    ordersCount++
                }
                lbls to sums
            }
            else -> { // "Cette semaine"
                val lbls = listOf("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")
                val sums = DoubleArray(7)
                for (item in nonCancelledIndexed) {
                    val date = item.createdDate ?: continue
                    if (date.isBefore(monday) || date.isAfter(sunday)) continue
                    val amt = item.order.prixTotal
                    sums[date.dayOfWeek.value - 1] += amt
                    totalRevenue += amt
                    ordersCount++
                }
                lbls to sums
            }
        }

        val maxVal = buckets.maxOrNull()?.takeIf { it > 0.0 } ?: 1.0
        val bars = labels.mapIndexed { idx, label ->
            val v = buckets[idx]
            RevenueBar(
                day = label,
                fraction = if (v == 0.0) 0.04f else (v / maxVal).toFloat().coerceIn(0.08f, 1f),
                amount = v
            )
        }
        RevenueChartState(
            bars = bars,
            totalRevenue = totalRevenue,
            ordersCount = ordersCount
        )
    }

    // ── Summary 2×2 Metrics ───────────────────────────────────────────────────
    val iconProgress = TablerIcons.LayoutGrid
    val iconReady = TablerIcons.ShoppingBag
    val iconLate = TablerIcons.ClockOff
    val iconToday = TablerIcons.Refresh
    val summaryMetrics = remember(indexedOrders, today, nowInstant, iconProgress, iconReady, iconLate, iconToday) {
        var inProgressCount = 0
        var readyCount = 0
        var lateCount = 0
        var todayCount = 0
        val inProgressSet = setOf(
            "en_attente", "attente", "en_attente_validation",
            "traitement", "en_cours_lavage", "lavage_cours",
            "en_cours_repassage", "repassage_cours"
        )
        val readySet = setOf("pret", "a_recuperer", "a_livrer")

        for (item in indexedOrders) {
            val st = item.order.statut
            if (st in inProgressSet) inProgressCount++
            if (st in readySet) readyCount++
            if (!item.order.isCompletedOrCancelled) {
                val due = item.dueInstant
                if (due != null && due.isBefore(nowInstant)) lateCount++
            }
            if (st != "annule" && item.createdDate == today) todayCount++
        }

        listOf(
            SummaryMetric("En cours", inProgressCount.toString(), iconProgress, BluePastelBg, Color(0xFF121C3A), Color(0xFF93C5FD)),
            SummaryMetric("Prêtes", readyCount.toString(), iconReady, GreenPastelBg, Color(0xFF0E291A), Color(0xFF4ADE80)),
            SummaryMetric("Retard", lateCount.toString(), iconLate, RedPastelBg, Color(0xFF2B1014), Color(0xFFF87171)),
            SummaryMetric("Du jour", todayCount.toString(), iconToday, YellowPastelBg, Color(0xFF29200A), Color(0xFFFBBF24))
        )
    }

    // ── Best Clients ──────────────────────────────────────────────────────────
    val bestClients = remember(customers, storeOrders, selectedStoreId) {
        val ordersCountByCustomer = storeOrders
            .filter { !it.customerId.isNullOrBlank() && it.statut != "annule" }
            .groupingBy { it.customerId!! }
            .eachCount()

        customers
            .filter { selectedStoreId == "all" || selectedStoreId == "GLOBAL" || it.storeId == null || it.storeId == selectedStoreId }
            .sortedByDescending { it.pointsFidelite }
            .take(5)
            .map { cust ->
                val tier = KlinUpRepository.fidelityTier(cust.pointsFidelite)
                BestClientItem(
                    id = cust.id,
                    name = cust.fullName,
                    points = cust.pointsFidelite,
                    ordersCount = ordersCountByCustomer[cust.id] ?: 0,
                    progress = tier.progress,
                    tier = tier.tierName
                )
            }
    }

    // ── Active Orders ─────────────────────────────────────────────────────────
    val allActiveOrders = remember(storeOrders, customerMap) {
        storeOrders
            .filter { !it.isCompletedOrCancelled }
            .map { order ->
                val customerName = order.customerId?.let { customerMap[it]?.fullName } ?: "Client Passage"
                val isRunning = order.statut !in setOf("en_attente", "attente", "en_attente_validation")
                ActiveOrderItem(
                    id = order.id,
                    customerName = customerName,
                    orderNumber = order.displayNumber,
                    dateTime = KlinUpRepository.formatOrderDate(order.createdAt),
                    status = KlinUpRepository.orderStatusLabel(order.statut),
                    rawStatus = order.statut,
                    totalPrice = order.prixTotal,
                    articlesCount = order.items?.sumOf { it.quantite }?.coerceAtLeast(1) ?: 1,
                    isInProgress = isRunning
                )
            }
    }
    var showAllActiveOrders by remember { mutableStateOf(false) }
    val hasMoreActiveOrders = allActiveOrders.size > 3
    val displayedActiveOrders = remember(allActiveOrders, showAllActiveOrders) {
        if (showAllActiveOrders) allActiveOrders else allActiveOrders.take(3)
    }

    val pendingValidationOrLate = remember(storeOrders) {
        storeOrders.any { !it.isCompletedOrCancelled }
    }

    val mainListState = rememberLazyListState()
    val kpiRowState = rememberLazyListState()
    val clientsRowState = rememberLazyListState()

    val avatarVersion by AppPreferences.avatarVersion.collectAsState()
    val hideAmounts by AppPreferences.hideAmounts.collectAsState()
    val onToggleAmounts = {
        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        AppPreferences.toggleHideAmounts()
    }
    val userId = currentUser?.id.orEmpty()
    val avatar by produceState<ImageBitmap?>(null, userId, avatarVersion) {
        value = if (userId.isBlank()) null else withContext(Dispatchers.IO) {
            val f = AppPreferences.avatarFile(userId)
            if (!f.exists()) null else runCatching {
                val opts = BitmapFactory.Options().apply { inSampleSize = 2 }
                BitmapFactory.decodeFile(f.absolutePath, opts)?.asImageBitmap()
            }.getOrNull()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBg)
    ) {
        // ── 1. HEADER FIXE ────────────────────────────────────────────────────
        DashboardHeader(
            userName = displayUserName,
            avatar = avatar,
            unreadCount = unreadNotifCount,
            onProfileClick = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                onProfileClick()
            },
            onNotificationClick = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                hasNotifPermission = KlinUpNotificationManager.hasNotificationPermission(context)
                showNotificationSheet = true
            },
            modifier = Modifier
                .fillMaxWidth()
                .background(PageBg)
                .padding(
                    top = statusBarTop + 12.dp,
                    bottom = 10.dp,
                    start = 20.dp,
                    end = 20.dp
                )
        )

        LazyColumn(
            state = mainListState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(
                top = 10.dp,
                bottom = 28.dp + LocalBottomBarPadding.current
            ),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // ── 2. KPI CARDS CAROUSEL ─────────────────────────────────────────
            item(key = "kpi_carousel", contentType = "kpi_carousel") {
                LazyRow(
                    state = kpiRowState,
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    item(key = "ca_mensuel", contentType = "kpi_card") {
                        MonthlyRevenueKpiCard(
                            amount = AppPreferences.maskAmount(monthlyRevenueText, hideAmounts),
                            periodLabel = "Mois en cours",
                            trendText = monthlyTrendText,
                            hideAmounts = hideAmounts,
                            onToggleHideAmounts = onToggleAmounts,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onKpiClick("ca_mensuel")
                            }
                        )
                    }
                    item(key = "panier_moyen", contentType = "kpi_card") {
                        AverageBasketKpiCard(
                            amount = AppPreferences.maskAmount(averageBasketText, hideAmounts),
                            subtitle = averageBasketSubtitle,
                            barRatios = averageBasketBars,
                            hideAmounts = hideAmounts,
                            onToggleHideAmounts = onToggleAmounts,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onKpiClick("panier_moyen")
                            }
                        )
                    }
                    item(key = "encaissements", contentType = "kpi_card") {
                        EncaissementsKpiCard(
                            amount = AppPreferences.maskAmount(collectedAmountText, hideAmounts),
                            ratePct = collectionRatePct,
                            remainingLabel = if (hideAmounts) "Reste : •••••• FCFA" else remainingBalanceLabel,
                            hideAmounts = hideAmounts,
                            onToggleHideAmounts = onToggleAmounts,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onKpiClick("encaissements")
                            }
                        )
                    }
                    item(key = "finalisation", contentType = "kpi_card") {
                        CompletionRateKpiCard(
                            ratePct = completionRatePct,
                            rateText = completionRateText,
                            subtitle = completionSubtitle,
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onKpiClick("finalisation")
                            }
                        )
                    }
                }
            }

            // ── 3. CHIFFRE D'AFFAIRES CHART CARD ──────────────────────────────
            item(key = "revenue_chart", contentType = "revenue_chart") {
                RevenueChartCard(
                    chartState = revenueChartState,
                    selectedPeriod = selectedPeriod,
                    periods = periods,
                    hideAmounts = hideAmounts,
                    onToggleHideAmounts = onToggleAmounts,
                    onSelectPeriod = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        selectedPeriod = it
                    },
                    onCardClick = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        onRevenueChartClick()
                    },
                    modifier = Modifier.padding(horizontal = 20.dp)
                )
            }

            // ── 4. RÉCAPITULATIF COMMANDES ────────────────────────────────────
            item(key = "summary_section", contentType = "summary_section") {
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    DashboardSectionHeader(
                        icon = TablerIcons.Award,
                        title = "Récapitulatif commandes"
                    )
                    OrderSummaryGrid(
                        metrics = summaryMetrics,
                        onMetricClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onNavigateToGestion()
                        }
                    )
                }
            }

            // ── 5. MEILLEURS CLIENTS ──────────────────────────────────────────
            if (bestClients.isNotEmpty()) {
                item(key = "best_clients_section", contentType = "best_clients_section") {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        DashboardSectionHeader(
                            icon = TablerIcons.Award,
                            title = "Meilleurs clients",
                            modifier = Modifier.padding(horizontal = 20.dp)
                        )
                        LazyRow(
                            state = clientsRowState,
                            contentPadding = PaddingValues(horizontal = 20.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            itemsIndexed(
                                items = bestClients,
                                key = { _, it -> it.id },
                                contentType = { _, _ -> "best_client" }
                            ) { index, client ->
                                BestClientCard(
                                    client = client,
                                    rank = index + 1,
                                    onClick = {
                                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                        onCustomerClick(client.id)
                                    },
                                    modifier = Modifier.animateItem()
                                )
                            }
                            if (currentUser?.canManageCustomersMobile != false) {
                                item(key = "see_more_clients", contentType = "see_more_clients") {
                                    SeeMoreClientsCard(
                                        onClick = {
                                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                            onNavigateToClients()
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // ── 6. COMMANDES ACTIVES ──────────────────────────────────────────
            item(key = "active_orders_header", contentType = "section_header") {
                DashboardSectionHeader(
                    icon = TablerIcons.ShoppingCart,
                    title = "Commandes actives",
                    modifier = Modifier.padding(horizontal = 20.dp)
                )
            }

            if (displayedActiveOrders.isEmpty()) {
                item(key = "empty_active_orders", contentType = "empty_state") {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .clip(RoundedCornerShape(26.dp))
                            .bouncyClickable(role = Role.Button, onClick = onNavigateToCreate),
                        shape = RoundedCornerShape(26.dp),
                        color = CardWhite,
                        border = BorderStroke(1.dp, CardBorder)
                    ) {
                        Box(
                            modifier = Modifier.padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Aucune commande active — Créer une commande",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = InkMuted
                            )
                        }
                    }
                }
            } else {
                items(
                    items = displayedActiveOrders,
                    key = { it.id },
                    contentType = { "active_order" }
                ) { order ->
                    ActiveOrderCard(
                        order = order,
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onOrderClick(order.id)
                        },
                        modifier = Modifier
                            .padding(horizontal = 20.dp)
                            .animateItem()
                    )
                }
            }

            // ── 7. VOIR PLUS BUTTON ───────────────────────────────────────────
            if (hasMoreActiveOrders) {
                item(key = "see_more", contentType = "see_more") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .bouncyClickable(pressedScale = 0.95f, role = Role.Button) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    showAllActiveOrders = !showAllActiveOrders
                                },
                            shape = RoundedCornerShape(999.dp),
                            color = PillMoreBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = if (showAllActiveOrders) "Voir moins" else "Voir plus (${allActiveOrders.size - 3})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkPrimary
                                )
                                Icon(
                                    imageVector = TablerIcons.ArrowRight,
                                    contentDescription = null,
                                    tint = InkPrimary,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showNotificationSheet) {
        NotificationBottomSheet(
            notifications = notifications,
            unreadCount = unreadNotifCount,
            hasSystemPermission = hasNotifPermission,
            onRequestPermission = {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            },
            onRefresh = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                scope.launch { KlinUpRepository.refreshAll() }
            },
            onMarkAllRead = {
                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                KlinUpNotificationManager.markAllAsRead()
            },
            onNotificationClick = { notif ->
                KlinUpNotificationManager.markAsRead(notif.id)
                showNotificationSheet = false
                if (!notif.orderId.isNullOrBlank()) {
                    onOrderClick(notif.orderId)
                }
            },
            onDismiss = { showNotificationSheet = false }
        )
    }
}

// ─── Header ───────────────────────────────────────────────────────────────────
@Composable
private fun DashboardHeader(
    userName: String,
    avatar: ImageBitmap?,
    unreadCount: Int,
    onProfileClick: () -> Unit,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier
                .weight(1f)
                .clip(RoundedCornerShape(999.dp))
                .bouncyClickable(pressedScale = 0.97f, role = Role.Button, onClick = onProfileClick)
                .padding(vertical = 2.dp, horizontal = 2.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(AvatarBg),
                contentAlignment = Alignment.Center
            ) {
                if (avatar != null) {
                    Image(
                        bitmap = avatar,
                        contentDescription = "Photo de profil",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Icon(
                        imageVector = TablerIcons.User,
                        contentDescription = "Avatar utilisateur",
                        tint = AvatarIconTint,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Text(
                text = userName,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = InkPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .clickable(role = Role.Button, onClick = onNotificationClick)
                .semantics { contentDescription = "Ouvrir les notifications" },
            contentAlignment = Alignment.Center
        ) {
            Box {
                Icon(
                    imageVector = TablerIcons.Bell,
                    contentDescription = null,
                    tint = InkPrimary,
                    modifier = Modifier.size(25.dp)
                )
                if (unreadCount > 0) {
                    Box(
                        modifier = Modifier
                            .size(9.dp)
                            .clip(CircleShape)
                            .background(BrandBlue)
                            .align(Alignment.TopEnd)
                            .offset(x = 1.dp, y = (-1).dp)
                    )
                }
            }
        }
    }
}

// ─── KPI Card 1: CA Mensuel ───────────────────────────────────────────────────
@Composable
private fun KpiEyeToggleButton(
    hideAmounts: Boolean,
    tint: Color,
    bgColor: Color,
    onToggle: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(28.dp)
            .clip(CircleShape)
            .background(bgColor)
            .clickable(role = Role.Button, onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (hideAmounts) TablerIcons.EyeOff else TablerIcons.Eye,
            contentDescription = if (hideAmounts) "Afficher les montants" else "Masquer les montants",
            tint = tint,
            modifier = Modifier.size(15.dp)
        )
    }
}

@Composable
private fun MonthlyRevenueKpiCard(
    amount: String,
    periodLabel: String,
    trendText: String,
    hideAmounts: Boolean,
    onToggleHideAmounts: () -> Unit,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(214.dp)
            .height(168.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.965f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = BrandBlue
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "CA Mensuel",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    KpiEyeToggleButton(
                        hideAmounts = hideAmounts,
                        tint = Color.White,
                        bgColor = Color.White.copy(alpha = 0.20f),
                        onToggle = onToggleHideAmounts
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color.White.copy(alpha = 0.22f))
                        .padding(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = periodLabel,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Text(
                text = amount,
                color = Color.White,
                fontSize = 23.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.5).sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.22f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                ) {
                    Icon(
                        imageVector = TablerIcons.TrendingUp,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(13.dp)
                    )
                    Text(
                        text = trendText,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

// ─── KPI Card 2: Panier Moyen ─────────────────────────────────────────────────
@Composable
private fun AverageBasketKpiCard(
    amount: String,
    subtitle: String,
    barRatios: List<Float>,
    hideAmounts: Boolean,
    onToggleHideAmounts: () -> Unit,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(214.dp)
            .height(168.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.965f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = BrandBlue
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Panier Moyen",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    KpiEyeToggleButton(
                        hideAmounts = hideAmounts,
                        tint = Color.White,
                        bgColor = Color.White.copy(alpha = 0.20f),
                        onToggle = onToggleHideAmounts
                    )
                }
                Text(
                    text = amount,
                    color = Color.White,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.5).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                val maxRatio = barRatios.maxOrNull() ?: 0f
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.Bottom
                ) {
                    barRatios.forEachIndexed { idx, ratio ->
                        val isPeakOrToday = (ratio > 0f && (ratio == maxRatio || idx == barRatios.lastIndex))
                        val barHeight = if (ratio <= 0f) 5.dp else (7f + ratio * 27f).dp
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(barHeight)
                                .clip(RoundedCornerShape(6.dp))
                                .background(
                                    when {
                                        ratio <= 0f -> Color.White.copy(alpha = 0.20f)
                                        isPeakOrToday -> Color.White
                                        else -> Color.White.copy(alpha = 0.48f)
                                    }
                                )
                        )
                    }
                }

                Text(
                    text = subtitle,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

// ─── KPI Card 3: Encaissements ────────────────────────────────────────────────
@Composable
private fun EncaissementsKpiCard(
    amount: String,
    ratePct: Int,
    remainingLabel: String,
    hideAmounts: Boolean,
    onToggleHideAmounts: () -> Unit,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(214.dp)
            .height(168.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.965f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = Color(0xFF0F766E),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Encaissements",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(Color.White.copy(alpha = 0.22f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "$ratePct%",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        KpiEyeToggleButton(
                            hideAmounts = hideAmounts,
                            tint = Color.White,
                            bgColor = Color.White.copy(alpha = 0.20f),
                            onToggle = onToggleHideAmounts
                        )
                    }
                }
                Text(
                    text = amount,
                    color = Color.White,
                    fontSize = 23.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = (-0.5).sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(Color.White.copy(alpha = 0.22f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth((ratePct / 100f).coerceIn(0.05f, 1f))
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xFF6EE7B7))
                    )
                }
                Text(
                    text = remainingLabel,
                    color = Color.White.copy(alpha = 0.88f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

// ─── KPI Card 4: Finalisation ─────────────────────────────────────────────────
@Composable
private fun CompletionRateKpiCard(
    ratePct: Int,
    rateText: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .width(214.dp)
            .height(168.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.965f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = Color(0xFF5B21B6),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Finalisation",
                        color = Color.White,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = rateText,
                        color = Color.White,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = (-0.5).sp
                    )
                }

                // Mini Donut Ring
                Canvas(modifier = Modifier.size(44.dp)) {
                    val strokeW = 5.dp.toPx()
                    val pad = strokeW / 2f
                    val arcSize = Size(size.width - strokeW, size.height - strokeW)
                    drawArc(
                        color = Color.White.copy(alpha = 0.22f),
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = Offset(pad, pad),
                        size = arcSize,
                        style = Stroke(width = strokeW)
                    )
                    drawArc(
                        color = Color(0xFFC4B5FD),
                        startAngle = -90f,
                        sweepAngle = (ratePct / 100f) * 360f,
                        useCenter = false,
                        topLeft = Offset(pad, pad),
                        size = arcSize,
                        style = Stroke(width = strokeW, cap = StrokeCap.Round)
                    )
                }
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(Color.White.copy(alpha = 0.2f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = subtitle,
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

// ─── Revenue Chart Card ───────────────────────────────────────────────────────
@Composable
private fun RevenueChartCard(
    chartState: RevenueChartState,
    selectedPeriod: String,
    periods: List<String>,
    hideAmounts: Boolean,
    onToggleHideAmounts: () -> Unit,
    onSelectPeriod: (String) -> Unit,
    onCardClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    var menuExpanded by remember { mutableStateOf(false) }
    var hasMounted by remember { mutableStateOf(false) }
    var selectedBarDay by remember(selectedPeriod) { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { hasMounted = true }

    val activeBar = remember(chartState.bars, selectedBarDay) {
        chartState.bars.firstOrNull { it.day == selectedBarDay }
    }
    val chevronRotation by animateFloatAsState(
        targetValue = if (menuExpanded) 180f else 0f,
        animationSpec = tween(durationMillis = 220, easing = NavMotion.EmphasizedDecelerate),
        label = "period_chevron"
    )

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.985f, role = Role.Button, onClick = onCardClick),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        text = "Chiffre d'Affaires",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary
                    )
                    Text(
                        text = if (activeBar != null) {
                            "${activeBar.day} : ${AppPreferences.maskAmount(KlinUpRepository.formatFcfa(activeBar.amount), hideAmounts)}"
                        } else {
                            "${AppPreferences.maskAmount(KlinUpRepository.formatFcfa(chartState.totalRevenue), hideAmounts)} • ${chartState.ordersCount} cmd"
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.klinUpColors.brandText,
                        modifier = Modifier.animateContentSize()
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    KpiEyeToggleButton(
                        hideAmounts = hideAmounts,
                        tint = MaterialTheme.klinUpColors.brandText,
                        bgColor = MaterialTheme.klinUpColors.softBlueBg,
                        onToggle = onToggleHideAmounts
                    )

                    Box {
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .bouncyClickable(pressedScale = 0.95f, role = Role.DropdownList) {
                                menuExpanded = true
                            },
                        shape = RoundedCornerShape(999.dp),
                        color = PeriodPillPurple
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = selectedPeriod,
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Icon(
                                imageVector = TablerIcons.ChevronDown,
                                contentDescription = "Changer la période",
                                tint = Color.White,
                                modifier = Modifier
                                    .size(14.dp)
                                    .graphicsLayer { rotationZ = chevronRotation }
                            )
                        }
                    }

                    KlinUpDropdownMenu(
                        expanded = menuExpanded,
                        onDismissRequest = { menuExpanded = false }
                    ) {
                        periods.forEach { period ->
                            KlinUpDropdownItem(
                                text = period,
                                selected = period == selectedPeriod,
                                onClick = {
                                    menuExpanded = false
                                    onSelectPeriod(period)
                                }
                            )
                        }
                    }
                }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                chartState.bars.forEach { entry ->
                    val isBarSelected = selectedBarDay == entry.day
                    val animatedFraction by animateFloatAsState(
                        targetValue = if (hasMounted) entry.fraction else 0f,
                        animationSpec = tween(
                            durationMillis = 440,
                            easing = NavMotion.EmphasizedDecelerate
                        ),
                        label = "bar_${entry.day}"
                    )

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) {
                            selectedBarDay = if (isBarSelected) null else entry.day
                        }
                    ) {
                        Box(
                            modifier = Modifier
                                .width(10.dp)
                                .height(128.dp)
                                .clip(RoundedCornerShape(999.dp))
                                .background(TrackGray),
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(10.dp)
                                    .fillMaxHeight()
                                    .graphicsLayer {
                                        scaleY = animatedFraction.coerceIn(0f, 1f)
                                        transformOrigin = TransformOrigin(0.5f, 1f)
                                    }
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(
                                        when {
                                            isBarSelected -> PeriodPillPurple
                                            MaterialTheme.klinUpColors.isDark -> Color(0xFF607BFF)
                                            else -> BrandBlue
                                        }
                                    )
                            )
                        }

                        Text(
                            text = entry.day,
                            fontSize = 11.sp,
                            fontWeight = if (isBarSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isBarSelected) MaterialTheme.klinUpColors.brandText else InkSecondary
                        )
                    }
                }
            }
        }
    }
}

// ─── Section Header ───────────────────────────────────────────────────────────
@Composable
private fun DashboardSectionHeader(
    icon: ImageVector,
    title: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = InkPrimary,
            modifier = Modifier.size(18.dp)
        )
        Text(
            text = title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = InkPrimary
        )
    }
}

// ─── Order Summary 2×2 Grid ───────────────────────────────────────────────────
@Composable
private fun OrderSummaryGrid(
    metrics: List<SummaryMetric>,
    onMetricClick: (SummaryMetric) -> Unit
) {
    val rows = metrics.chunked(2)
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        rows.forEach { pair ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                pair.forEach { metric ->
                    OrderSummaryCard(
                        metric = metric,
                        onClick = { onMetricClick(metric) },
                        modifier = Modifier.weight(1f)
                    )
                }
                if (pair.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun OrderSummaryCard(
    metric: SummaryMetric,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = MaterialTheme.klinUpColors.isDark
    val cardColor = if (isDark) metric.darkBackground else metric.background
    val iconBg = if (isDark) Color(0xFF1A1D27) else Color.White
    val iconTint = if (isDark) metric.darkAccent else InkPrimary

    Surface(
        modifier = modifier
            .height(104.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.96f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = cardColor,
        border = if (isDark) BorderStroke(1.dp, metric.darkAccent.copy(alpha = 0.25f)) else null
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = metric.title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = InkPrimary
                )

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center
                ) {
                    AnimatedSummaryMetricIcon(
                        title = metric.title,
                        color = iconTint,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Text(
                text = metric.count,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = InkPrimary,
                letterSpacing = (-0.5).sp
            )
        }
    }
}

// ─── Best Client Card ─────────────────────────────────────────────────────────
@Composable
private fun BestClientCard(
    client: BestClientItem,
    rank: Int = 1,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val isDark = MaterialTheme.klinUpColors.isDark
    val tierLower = client.tier.lowercase()
    val (tierAccent, tierSoftBg, tierCardBg) = when {
        tierLower.contains("platine") || tierLower.contains("vip") ->
            Triple(
                Color(0xFF6366F1),
                if (isDark) Color(0xFF26215C) else Color(0xFFE0E7FF),
                if (isDark) Color(0xFF151330) else Color(0xFFF4F6FF)
            )
        tierLower.contains("or") ->
            Triple(
                Color(0xFFD97706),
                if (isDark) Color(0xFF3A2807) else Color(0xFFFEF3C7),
                if (isDark) Color(0xFF1D1607) else Color(0xFFFFFBEB)
            )
        tierLower.contains("argent") ->
            Triple(
                Color(0xFF475569),
                if (isDark) Color(0xFF283548) else Color(0xFFE2E8F0),
                if (isDark) Color(0xFF141B26) else Color(0xFFF4F7FA)
            )
        else ->
            Triple(
                Color(0xFFB45309),
                if (isDark) Color(0xFF381F0C) else Color(0xFFFFEDD5),
                if (isDark) Color(0xFF1F1209) else Color(0xFFFFF7ED)
            )
    }

    val initials = remember(client.name) {
        client.name.trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .ifBlank { "CL" }
    }
    val progressClamped = client.progress.coerceIn(0f, 1f)
    val progressPct = (progressClamped * 100).toInt()
    val ordersLabel = "${client.ordersCount} ${if (client.ordersCount <= 1) "commande" else "commandes"}"

    Surface(
        modifier = modifier
            .width(248.dp)
            .height(172.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.97f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = tierCardBg,
        border = BorderStroke(
            width = 1.dp,
            color = tierAccent.copy(alpha = if (isDark) 0.35f else 0.22f)
        ),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(15.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Top bar: Rank + Tier pill on left, Points pill on right
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = tierSoftBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Award,
                            contentDescription = null,
                            tint = tierAccent,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "#$rank · ${client.tier}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) Color.White else tierAccent
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = GoldBadge
                ) {
                    Text(
                        text = "${client.points} pts",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF111827),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }

            // Middle: Initials avatar + Client Name + Orders count
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(tierSoftBg)
                        .border(1.5.dp, tierAccent.copy(alpha = 0.55f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = initials,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (isDark) Color.White else tierAccent
                    )
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Text(
                        text = client.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.ShoppingBag,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(13.dp)
                        )
                        Text(
                            text = ordersLabel,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = InkMuted,
                            maxLines = 1
                        )
                    }
                }
            }

            // Footer: Loyalty progress bar + percentage
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Progression fidélité",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = InkMuted
                    )
                    Text(
                        text = "$progressPct%",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isDark) Color.White else tierAccent
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
                            .fillMaxWidth(progressClamped.coerceAtLeast(0.04f))
                            .fillMaxHeight()
                            .clip(RoundedCornerShape(999.dp))
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        tierAccent.copy(alpha = 0.78f),
                                        tierAccent
                                    )
                                )
                            )
                    )
                }
            }
        }
    }
}

// ─── See More Clients Card ────────────────────────────────────────────────────
@Composable
private fun SeeMoreClientsCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.klinUpColors
    Surface(
        modifier = modifier
            .width(156.dp)
            .height(172.dp)
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.97f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = colors.softBlueBg,
        border = BorderStroke(1.dp, colors.softBlueBorder),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(BrandBlue.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = TablerIcons.Users,
                    contentDescription = null,
                    tint = colors.brandText,
                    modifier = Modifier.size(22.dp)
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "Voir plus",
                fontSize = 14.5.sp,
                fontWeight = FontWeight.Bold,
                color = colors.brandText
            )
            Spacer(modifier = Modifier.height(3.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "Tous les clients",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.inkSecondary
                )
                Icon(
                    imageVector = TablerIcons.ArrowRight,
                    contentDescription = null,
                    tint = colors.brandText,
                    modifier = Modifier.size(13.dp)
                )
            }
        }
    }
}

// ─── Active Order Card ────────────────────────────────────────────────────────
@Composable
private fun ActiveOrderCard(
    order: ActiveOrderItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isDark = MaterialTheme.klinUpColors.isDark
    val statusLower = order.rawStatus.lowercase()
    val (statusAccent, statusBg) = when (statusLower) {
        "en_attente", "attente", "en_attente_validation" ->
            (if (isDark) Color(0xFFFBBF24) else Color(0xFFD97706)) to if (isDark) Color(0xFF2D2006) else Color(0xFFFEF3C7)
        "traitement", "en_cours_lavage", "lavage_cours" ->
            (if (isDark) Color(0xFF38BDF8) else Color(0xFF0284C7)) to if (isDark) Color(0xFF0C2235) else Color(0xFFE0F2FE)
        "en_cours_repassage", "repassage_cours" ->
            (if (isDark) Color(0xFF60A5FA) else Color(0xFF2563EB)) to if (isDark) Color(0xFF121D3B) else Color(0xFFDBEAFE)
        "pret", "a_recuperer" ->
            (if (isDark) Color(0xFF4ADE80) else Color(0xFF16A34A)) to if (isDark) Color(0xFF0D2918) else Color(0xFFDCFCE7)
        "a_livrer", "en_cours_livraison" ->
            (if (isDark) Color(0xFFA78BFA) else Color(0xFF7C3AED)) to if (isDark) Color(0xFF21143B) else Color(0xFFEDE9FE)
        else ->
            (if (isDark) Color(0xFF94A3B8) else Color(0xFF475569)) to if (isDark) Color(0xFF1E293B) else Color(0xFFF1F5F9)
    }

    val initials = remember(order.customerName) {
        order.customerName.trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
            .ifBlank { "CL" }
    }
    val articlesLabel = "${order.articlesCount} ${if (order.articlesCount <= 1) "article" else "articles"}"

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.975f, role = Role.Button, onClick = onClick),
        shape = RoundedCornerShape(26.dp),
        color = CardWhite,
        shadowElevation = 0.dp,
        border = BorderStroke(1.dp, CardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Top Row: Avatar + Client Name + Ticket vs Status Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(statusBg)
                            .border(1.dp, statusAccent.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isDark) Color.White else statusAccent
                        )
                    }

                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = order.customerName,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "${order.orderNumber}  •  $articlesLabel",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = InkMuted,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = statusBg
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(statusAccent)
                        )
                        Text(
                            text = order.status,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDark) Color.White else statusAccent,
                            maxLines = 1
                        )
                    }
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(MaterialTheme.klinUpColors.divider.copy(alpha = 0.6f))
            )

            // Bottom Row: Date/Time vs Price + Chevron
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = TablerIcons.Calendar,
                        contentDescription = null,
                        tint = InkMuted,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = order.dateTime,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = InkSecondary
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = KlinUpRepository.formatFcfa(order.totalPrice),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = InkPrimary
                    )
                    Icon(
                        imageVector = TablerIcons.ChevronRight,
                        contentDescription = "Voir la commande",
                        tint = InkMuted,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun AnimatedSummaryMetricIcon(
    title: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    when (title) {
        "En cours" -> AnimatedLucideLayoutGridIcon(color = color, modifier = modifier)
        "Prêtes" -> AnimatedLucideShoppingBagIcon(color = color, modifier = modifier)
        "Retard" -> AnimatedLucideAlarmClockIcon(color = color, modifier = modifier)
        else -> AnimatedLucideRefreshCwIcon(color = color, modifier = modifier)
    }
}

@Composable
private fun AnimatedLucideLayoutGridIcon(
    color: Color,
    durationMillis: Int = 1600,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_layout_grid")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "grid_progress"
    )

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(width = 2f * u, cap = StrokeCap.Round, join = StrokeJoin.Round)
        val rects = listOf(
            Offset(3f * u, 3f * u),
            Offset(14f * u, 3f * u),
            Offset(14f * u, 14f * u),
            Offset(3f * u, 14f * u)
        )
        val tileSize = Size(7f * u, 7f * u)
        val corner = CornerRadius(1.5f * u, 1.5f * u)

        rects.forEachIndexed { idx, topLeft ->
            val wave = kotlin.math.sin((progress + idx * 0.25f) * Math.PI * 2.0).toFloat()
            val s = 0.90f + 0.14f * ((wave + 1f) * 0.5f)
            val pivot = Offset(topLeft.x + tileSize.width / 2f, topLeft.y + tileSize.height / 2f)
            scale(scaleX = s, scaleY = s, pivot = pivot) {
                drawRoundRect(
                    color = color,
                    topLeft = topLeft,
                    size = tileSize,
                    cornerRadius = corner,
                    style = stroke
                )
            }
        }
    }
}

@Composable
private fun AnimatedLucideShoppingBagIcon(
    color: Color,
    durationMillis: Int = 1600,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_shopping_bag")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "bag_progress"
    )

    val bounce = kotlin.math.sin(progress * Math.PI * 2.0).toFloat()
    val sway = kotlin.math.sin(progress * Math.PI * 2.0).toFloat() * 5f

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(width = 2f * u, cap = StrokeCap.Round, join = StrokeJoin.Round)

        rotate(degrees = sway, pivot = Offset(12f * u, 4f * u)) {
            translate(left = 0f, top = -kotlin.math.abs(bounce) * 0.9f * u) {
                // Bag body: M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z
                val bagPath = Path().apply {
                    moveTo(6f * u, 2f * u)
                    lineTo(3f * u, 6f * u)
                    lineTo(3f * u, 20f * u)
                    arcTo(Rect(3f * u, 18f * u, 7f * u, 22f * u), 180f, -90f, false)
                    lineTo(19f * u, 22f * u)
                    arcTo(Rect(17f * u, 18f * u, 21f * u, 22f * u), 90f, -90f, false)
                    lineTo(21f * u, 6f * u)
                    lineTo(18f * u, 2f * u)
                    close()
                }
                drawPath(path = bagPath, color = color, style = stroke)

                // Top rim: M3 6h18
                drawLine(color = color, start = Offset(3f * u, 6f * u), end = Offset(21f * u, 6f * u), strokeWidth = 2f * u, cap = StrokeCap.Round)

                // Handle: M16 10a4 4 0 0 1-8 0
                val handlePath = Path().apply {
                    arcTo(Rect(8f * u, 6f * u, 16f * u, 14f * u), 0f, 180f, true)
                }
                drawPath(path = handlePath, color = color, style = stroke)
            }
        }
    }
}

@Composable
private fun AnimatedLucideAlarmClockIcon(
    color: Color,
    durationMillis: Int = 1500,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_alarm_clock")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "alarm_progress"
    )

    // Brief ringing burst during first half of loop, resting on second half
    val ringAngle = if (progress < 0.55f) {
        kotlin.math.sin((progress / 0.55f) * Math.PI * 6.0).toFloat() * 10f
    } else 0f

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(width = 2f * u, cap = StrokeCap.Round, join = StrokeJoin.Round)
        val center = Offset(12f * u, 13f * u)

        rotate(degrees = ringAngle, pivot = center) {
            // Clock circle: cx=12 cy=13 r=8
            drawCircle(color = color, radius = 8f * u, center = center, style = stroke)
            // Hands: M12 9v4l2 2
            val hands = Path().apply {
                moveTo(12f * u, 9f * u)
                lineTo(12f * u, 13f * u)
                lineTo(14f * u, 15f * u)
            }
            drawPath(path = hands, color = color, style = stroke)
            // Bells: M5 3 2 6 and m22 6-3-3
            drawLine(color = color, start = Offset(5f * u, 3f * u), end = Offset(2f * u, 6f * u), strokeWidth = 2f * u, cap = StrokeCap.Round)
            drawLine(color = color, start = Offset(22f * u, 6f * u), end = Offset(19f * u, 3f * u), strokeWidth = 2f * u, cap = StrokeCap.Round)
            // Legs: M6.38 18.7 4 21 and M17.64 18.67 20 21
            drawLine(color = color, start = Offset(6.38f * u, 18.7f * u), end = Offset(4f * u, 21f * u), strokeWidth = 2f * u, cap = StrokeCap.Round)
            drawLine(color = color, start = Offset(17.64f * u, 18.67f * u), end = Offset(20f * u, 21f * u), strokeWidth = 2f * u, cap = StrokeCap.Round)
        }
    }
}

@Composable
private fun AnimatedLucideRefreshCwIcon(
    color: Color,
    durationMillis: Int = 1800,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "lucide_refresh_cw")
    val angle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "refresh_angle"
    )

    Canvas(modifier = modifier) {
        val u = size.minDimension / 24f
        val stroke = Stroke(width = 2f * u, cap = StrokeCap.Round, join = StrokeJoin.Round)
        val center = Offset(12f * u, 12f * u)

        rotate(degrees = angle, pivot = center) {
            // Top arc + arrow
            val topArc = Path().apply {
                arcTo(Rect(3f * u, 3f * u, 21f * u, 21f * u), 180f, 138f, true)
            }
            drawPath(path = topArc, color = color, style = stroke)
            val topArrow = Path().apply {
                moveTo(21f * u, 3f * u)
                lineTo(21f * u, 8f * u)
                lineTo(16f * u, 8f * u)
            }
            drawPath(path = topArrow, color = color, style = stroke)

            // Bottom arc + arrow
            val bottomArc = Path().apply {
                arcTo(Rect(3f * u, 3f * u, 21f * u, 21f * u), 0f, 138f, true)
            }
            drawPath(path = bottomArc, color = color, style = stroke)
            val bottomArrow = Path().apply {
                moveTo(8f * u, 16f * u)
                lineTo(3f * u, 16f * u)
                lineTo(3f * u, 21f * u)
            }
            drawPath(path = bottomArrow, color = color, style = stroke)
        }
    }
}
