package com.klinup.app.ui.screens.kpi_detail

import com.klinup.app.ui.components.TablerIcons

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.Order
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.bouncyClickable
import com.klinup.app.ui.theme.klinUpColors
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

private enum class KpiKind(
    val key: String,
    val label: String,
    val primaryColor: Color,
    val secondaryColor: Color
) {
    CA_MENSUEL(
        key = "ca_mensuel",
        label = "CA Mensuel",
        primaryColor = Color(0xFF1A01DB),
        secondaryColor = Color(0xFF4F46E5)
    ),
    PANIER_MOYEN(
        key = "panier_moyen",
        label = "Panier Moyen",
        primaryColor = Color(0xFF2563EB),
        secondaryColor = Color(0xFF6366F1)
    ),
    ENCAISSEMENTS(
        key = "encaissements",
        label = "Encaissements",
        primaryColor = Color(0xFF0F766E),
        secondaryColor = Color(0xFF10B981)
    ),
    FINALISATION(
        key = "finalisation",
        label = "Finalisation",
        primaryColor = Color(0xFF5B21B6),
        secondaryColor = Color(0xFF8B5CF6)
    );

    companion object {
        fun fromKey(key: String): KpiKind = entries.firstOrNull { it.key == key } ?: CA_MENSUEL
    }
}

@Immutable
private data class ChartPoint(
    val label: String,
    val value: Double,
    val formattedValue: String,
    val count: Int
)

@Immutable
private data class BreakdownSlice(
    val label: String,
    val value: Double,
    val formattedValue: String,
    val percentage: Float,
    val color: Color
)

@Immutable
private data class StatTileData(
    val label: String,
    val value: String,
    val helper: String
)

@Immutable
private data class KpiDetailUiModel(
    val kind: KpiKind,
    val heroTitle: String,
    val heroValue: String,
    val heroBadge: String,
    val heroSubLeftLabel: String,
    val heroSubLeftValue: String,
    val heroSubRightLabel: String,
    val heroSubRightValue: String,
    val statTiles: List<StatTileData>,
    val chartTitle: String,
    val sevenDaysPoints: List<ChartPoint>,
    val sixMonthsPoints: List<ChartPoint>,
    val breakdownTitle: String,
    val breakdownCenterTop: String,
    val breakdownCenterBottom: String,
    val slices: List<BreakdownSlice>,
    val insightTitle: String,
    val insightMessage: String
)

@Composable
fun KpiDetailScreen(
    initialKpiType: String,
    onBack: () -> Unit
) {
    val kc = MaterialTheme.klinUpColors
    val haptics = LocalHapticFeedback.current
    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val navBarBottom = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    var selectedKpi by remember(initialKpiType) { mutableStateOf(KpiKind.fromKey(initialKpiType)) }
    var chartRange by remember { mutableStateOf("7 jours") }
    var selectedBarIndex by remember(selectedKpi, chartRange) { mutableIntStateOf(-1) }

    val allOrders by KlinUpRepository.orders.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()

    val storeOrders = remember(allOrders, selectedStoreId) {
        if (selectedStoreId.isNullOrBlank() || selectedStoreId == "all" || selectedStoreId == "GLOBAL") {
            allOrders
        } else {
            allOrders.filter { it.storeId == selectedStoreId }
        }
    }

    val model = remember(storeOrders, selectedKpi) {
        buildKpiDetailModel(selectedKpi, storeOrders)
    }

    val activePoints = if (chartRange == "7 jours") model.sevenDaysPoints else model.sixMonthsPoints

    // Trigger entry animation on KPI or range switch
    var animKey by remember { mutableIntStateOf(0) }
    LaunchedEffect(selectedKpi, chartRange) {
        animKey++
    }

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
                    text = "Analyse KPI",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = kc.inkPrimary
                )
                Text(
                    text = "Indicateurs détaillés en temps réel",
                    fontSize = 12.sp,
                    color = kc.inkSecondary
                )
            }
        }

        // ── KPI Selector Pills ────────────────────────────────────────────────
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            KpiKind.entries.forEach { kind ->
                val isSelected = kind == selectedKpi
                Surface(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .bouncyClickable(pressedScale = 0.95f, role = Role.Tab) {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            selectedKpi = kind
                        },
                    shape = RoundedCornerShape(999.dp),
                    color = if (isSelected) kind.primaryColor else kc.cardBg,
                    border = BorderStroke(
                        width = 1.dp,
                        color = if (isSelected) kind.primaryColor else kc.border
                    ),
                    shadowElevation = 0.dp
                ) {
                    Text(
                        text = kind.label,
                        color = if (isSelected) Color.White else kc.inkSecondary,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        // ── Scrollable Body ───────────────────────────────────────────────────
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            contentPadding = PaddingValues(
                start = 16.dp,
                end = 16.dp,
                top = 10.dp,
                bottom = 24.dp + navBarBottom
            ),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Hero Card with Animated Lucide Icon
            item(key = "hero_${selectedKpi.key}") {
                AnimatedContent(
                    targetState = model,
                    transitionSpec = {
                        fadeIn(tween(220)) togetherWith fadeOut(tween(180))
                    },
                    label = "hero_kpi"
                ) { ui ->
                    HeroKpiCard(ui)
                }
            }

            // 2. 4-Tile Metrics Grid
            item(key = "tiles_${selectedKpi.key}") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        model.statTiles.take(2).forEach { tile ->
                            MetricTile(tile = tile, modifier = Modifier.weight(1f))
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        model.statTiles.drop(2).take(2).forEach { tile ->
                            MetricTile(tile = tile, modifier = Modifier.weight(1f))
                        }
                    }
                }
            }

            // 3. Interactive Animated Bar + Line Chart
            item(key = "chart_${selectedKpi.key}_$chartRange") {
                AnimatedKpiTrendChartCard(
                    title = model.chartTitle,
                    points = activePoints,
                    primaryColor = if (kc.isDark) model.kind.secondaryColor else model.kind.primaryColor,
                    secondaryColor = model.kind.secondaryColor,
                    chartRange = chartRange,
                    onRangeChange = { newRange ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        chartRange = newRange
                    },
                    selectedIndex = selectedBarIndex,
                    onSelectBar = { idx ->
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        selectedBarIndex = if (selectedBarIndex == idx) -1 else idx
                    },
                    animTrigger = animKey
                )
            }

            // 4. Animated Donut + Breakdown Bars
            item(key = "donut_${selectedKpi.key}") {
                AnimatedBreakdownCard(
                    title = model.breakdownTitle,
                    centerTop = model.breakdownCenterTop,
                    centerBottom = model.breakdownCenterBottom,
                    slices = model.slices,
                    animTrigger = animKey
                )
            }

            // 5. Contextual Business Insight
            item(key = "insight_${selectedKpi.key}") {
                InsightBannerCard(
                    title = model.insightTitle,
                    message = model.insightMessage,
                    accentColor = if (kc.isDark) model.kind.secondaryColor else model.kind.primaryColor
                )
            }
        }
    }
}

// ─── Hero Card ────────────────────────────────────────────────────────────────
@Composable
private fun HeroKpiCard(model: KpiDetailUiModel) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = Color.Transparent,
        shadowElevation = 0.dp
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(model.kind.primaryColor, model.kind.secondaryColor)
                    )
                )
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = model.heroTitle,
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = model.heroValue,
                            color = Color.White,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = (-0.5).sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(Color.White.copy(alpha = 0.2f))
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
                                    text = model.heroBadge,
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    // Animated Lucide-style Canvas Icon
                    Box(
                        modifier = Modifier
                            .size(58.dp)
                            .clip(RoundedCornerShape(18.dp))
                            .background(Color.White.copy(alpha = 0.18f)),
                        contentAlignment = Alignment.Center
                    ) {
                        AnimatedKpiHeroIcon(
                            kind = model.kind,
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                }

                // Bottom Comparison Strip
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color.White.copy(alpha = 0.14f))
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = model.heroSubLeftLabel,
                            color = Color.White.copy(alpha = 0.78f),
                            fontSize = 11.sp
                        )
                        Text(
                            text = model.heroSubLeftValue,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(30.dp)
                            .background(Color.White.copy(alpha = 0.22f))
                    )
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 14.dp)
                    ) {
                        Text(
                            text = model.heroSubRightLabel,
                            color = Color.White.copy(alpha = 0.78f),
                            fontSize = 11.sp
                        )
                        Text(
                            text = model.heroSubRightValue,
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

// ─── Animated Hero Lucide-Style Canvas Icons ──────────────────────────────────
@Composable
private fun AnimatedKpiHeroIcon(
    kind: KpiKind,
    tint: Color,
    modifier: Modifier = Modifier
) {
    val transition = rememberInfiniteTransition(label = "kpi_hero_icon")
    val pulse by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(3600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "sweep"
    )

    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val stroke = Stroke(width = w * 0.09f, cap = StrokeCap.Round, join = StrokeJoin.Round)

        when (kind) {
            KpiKind.CA_MENSUEL -> {
                // Animated TrendingUp line + pulsing peak dot
                val path = Path().apply {
                    moveTo(w * 0.1f, h * 0.72f)
                    lineTo(w * 0.38f, h * (0.46f - 0.04f * pulse))
                    lineTo(w * 0.56f, h * (0.60f - 0.03f * pulse))
                    lineTo(w * 0.88f, h * (0.24f - 0.04f * pulse))
                }
                drawPath(path, color = tint, style = stroke)
                val arrow = Path().apply {
                    moveTo(w * 0.68f, h * (0.24f - 0.04f * pulse))
                    lineTo(w * 0.88f, h * (0.24f - 0.04f * pulse))
                    lineTo(w * 0.88f, h * (0.44f - 0.04f * pulse))
                }
                drawPath(arrow, color = tint, style = stroke)
                drawCircle(
                    color = tint.copy(alpha = 0.3f + 0.5f * pulse),
                    radius = w * (0.07f + 0.04f * pulse),
                    center = Offset(w * 0.88f, h * (0.24f - 0.04f * pulse))
                )
            }
            KpiKind.PANIER_MOYEN -> {
                // Animated ShoppingBag with gentle bounce
                val dy = h * 0.04f * pulse
                val bagTop = h * 0.34f + dy
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.18f, bagTop),
                    size = Size(w * 0.64f, h * 0.52f),
                    cornerRadius = CornerRadius(w * 0.12f, w * 0.12f),
                    style = stroke
                )
                drawArc(
                    color = tint,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(w * 0.34f, h * 0.14f + dy * 0.5f),
                    size = Size(w * 0.32f, h * 0.36f),
                    style = stroke
                )
                // Little animated sparkle inside bag
                drawCircle(
                    color = tint.copy(alpha = 0.45f + 0.55f * pulse),
                    radius = w * 0.055f,
                    center = Offset(w * 0.5f, bagTop + h * 0.26f)
                )
            }
            KpiKind.ENCAISSEMENTS -> {
                // Animated Wallet with sliding card & pulsing coin
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.12f, h * 0.26f),
                    size = Size(w * 0.76f, h * 0.54f),
                    cornerRadius = CornerRadius(w * 0.12f, w * 0.12f),
                    style = stroke
                )
                // Top flap line
                drawLine(
                    color = tint.copy(alpha = 0.75f),
                    start = Offset(w * 0.18f, h * 0.26f),
                    end = Offset(w * 0.72f, h * (0.14f + 0.03f * pulse)),
                    strokeWidth = w * 0.08f,
                    cap = StrokeCap.Round
                )
                // Clasp
                drawRoundRect(
                    color = tint.copy(alpha = 0.28f),
                    topLeft = Offset(w * 0.58f, h * 0.44f),
                    size = Size(w * 0.30f, h * 0.18f),
                    cornerRadius = CornerRadius(w * 0.06f, w * 0.06f)
                )
                drawCircle(
                    color = tint,
                    radius = w * (0.045f + 0.015f * pulse),
                    center = Offset(w * 0.68f, h * 0.53f)
                )
            }
            KpiKind.FINALISATION -> {
                // Rotating outer arc + animated checkmark
                drawArc(
                    color = tint.copy(alpha = 0.35f),
                    startAngle = 0f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = Offset(w * 0.1f, h * 0.1f),
                    size = Size(w * 0.8f, h * 0.8f),
                    style = stroke
                )
                drawArc(
                    color = tint,
                    startAngle = sweep,
                    sweepAngle = 220f,
                    useCenter = false,
                    topLeft = Offset(w * 0.1f, h * 0.1f),
                    size = Size(w * 0.8f, h * 0.8f),
                    style = stroke
                )
                val check = Path().apply {
                    moveTo(w * 0.32f, h * 0.52f)
                    lineTo(w * 0.45f, h * (0.65f - 0.02f * pulse))
                    lineTo(w * 0.69f, h * (0.37f - 0.02f * pulse))
                }
                drawPath(check, color = tint, style = stroke)
            }
        }
    }
}

// ─── 2x2 Metric Tile ──────────────────────────────────────────────────────────
@Composable
private fun MetricTile(
    tile: StatTileData,
    modifier: Modifier = Modifier
) {
    val kc = MaterialTheme.klinUpColors
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = tile.label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = kc.inkSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = tile.value,
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
                color = kc.inkPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = tile.helper,
                fontSize = 11.sp,
                color = kc.inkMuted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

// ─── Animated Bar + Trend Line Chart Card ─────────────────────────────────────
@Composable
private fun AnimatedKpiTrendChartCard(
    title: String,
    points: List<ChartPoint>,
    primaryColor: Color,
    secondaryColor: Color,
    chartRange: String,
    onRangeChange: (String) -> Unit,
    selectedIndex: Int,
    onSelectBar: (Int) -> Unit,
    animTrigger: Int
) {
    val kc = MaterialTheme.klinUpColors
    var playAnim by remember(animTrigger) { mutableStateOf(false) }
    LaunchedEffect(animTrigger) {
        playAnim = true
    }

    val chartProgress by animateFloatAsState(
        targetValue = if (playAnim) 1f else 0f,
        animationSpec = tween(durationMillis = 750, easing = FastOutSlowInEasing),
        label = "chart_progress"
    )

    val maxVal = remember(points) {
        (points.maxOfOrNull { it.value } ?: 1.0).coerceAtLeast(1.0)
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = title,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = kc.inkPrimary
                    )
                    val inspected = points.getOrNull(selectedIndex)
                    Text(
                        text = if (inspected != null) {
                            "${inspected.label} : ${inspected.formattedValue} (${inspected.count} cmd)"
                        } else {
                            "Appuyez sur une barre pour détailler"
                        },
                        fontSize = 11.sp,
                        color = if (inspected != null) primaryColor else kc.inkSecondary,
                        fontWeight = if (inspected != null) FontWeight.SemiBold else FontWeight.Normal
                    )
                }

                // Range Toggle Pills
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(kc.pageBg)
                        .padding(3.dp),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    listOf("7 jours", "6 mois").forEach { option ->
                        val active = option == chartRange
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(if (active) primaryColor else Color.Transparent)
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { onRangeChange(option) }
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = option,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (active) Color.White else kc.inkSecondary
                            )
                        }
                    }
                }
            }

            // Canvas + Clickable Columns
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(186.dp)
            ) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(156.dp)
                ) {
                    val count = points.size.coerceAtLeast(1)
                    val slotWidth = size.width / count
                    val barWidth = (slotWidth * 0.34f).coerceAtMost(18.dp.toPx())
                    val topPad = 14.dp.toPx()
                    val bottomPad = 10.dp.toPx()
                    val baselineY = size.height - bottomPad
                    val usableHeight = (baselineY - topPad).coerceAtLeast(10f)

                    // Subtle horizontal guide lines
                    for (i in 0..2) {
                        val y = topPad + (usableHeight * i / 2f)
                        drawLine(
                            color = kc.border.copy(alpha = 0.7f),
                            start = Offset(0f, y),
                            end = Offset(size.width, y),
                            strokeWidth = 1.dp.toPx()
                        )
                    }

                    val nodeOffsets = mutableListOf<Offset>()

                    points.forEachIndexed { idx, pt ->
                        val fraction = (pt.value / maxVal).toFloat().coerceIn(0f, 1f)
                        val animatedH = (usableHeight * fraction * chartProgress).coerceAtLeast(
                            if (pt.value > 0) 6.dp.toPx() else 3.dp.toPx()
                        )
                        val cx = slotWidth * idx + slotWidth / 2f
                        val barLeft = cx - barWidth / 2f
                        val barTop = baselineY - animatedH

                        val isSelected = idx == selectedIndex
                        val barBrush = Brush.verticalGradient(
                            colors = when {
                                isSelected -> listOf(secondaryColor, primaryColor)
                                selectedIndex >= 0 -> listOf(
                                    primaryColor.copy(alpha = 0.35f),
                                    primaryColor.copy(alpha = 0.25f)
                                )
                                else -> listOf(secondaryColor.copy(alpha = 0.9f), primaryColor)
                            }
                        )

                        // Track capsule clearly visible in both light & dark themes
                        drawRoundRect(
                            color = kc.trackBg,
                            topLeft = Offset(barLeft, topPad),
                            size = Size(barWidth, usableHeight),
                            cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
                        )
                        if (pt.value > 0) {
                            drawRoundRect(
                                brush = barBrush,
                                topLeft = Offset(barLeft, barTop),
                                size = Size(barWidth, animatedH),
                                cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
                            )
                        }
                        nodeOffsets.add(Offset(cx, barTop))
                    }

                    // Overlay Smooth Trend Curve + Nodes
                    if (nodeOffsets.size >= 2) {
                        val linePath = Path().apply {
                            moveTo(nodeOffsets.first().x, nodeOffsets.first().y)
                            for (i in 1 until nodeOffsets.size) {
                                val prev = nodeOffsets[i - 1]
                                val cur = nodeOffsets[i]
                                val midX = (prev.x + cur.x) / 2f
                                cubicTo(midX, prev.y, midX, cur.y, cur.x, cur.y)
                            }
                        }
                        drawPath(
                            path = linePath,
                            color = secondaryColor,
                            style = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round)
                        )
                        nodeOffsets.forEachIndexed { idx, center ->
                            val r = if (idx == selectedIndex) 5.dp.toPx() else 3.2.dp.toPx()
                            drawCircle(color = kc.cardBg, radius = r + 1.5.dp.toPx(), center = center)
                            drawCircle(color = if (idx == selectedIndex) primaryColor else secondaryColor, radius = r, center = center)
                        }
                    }
                }

                // Tap targets + X-axis labels
                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.Bottom
                ) {
                    points.forEachIndexed { idx, pt ->
                        val active = idx == selectedIndex
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null
                                ) { onSelectBar(idx) },
                            contentAlignment = Alignment.BottomCenter
                        ) {
                            Text(
                                text = pt.label,
                                fontSize = 11.sp,
                                fontWeight = if (active) FontWeight.Bold else FontWeight.Medium,
                                color = if (active) primaryColor else kc.inkSecondary,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── Animated Donut + Breakdown Card ──────────────────────────────────────────
@Composable
private fun AnimatedBreakdownCard(
    title: String,
    centerTop: String,
    centerBottom: String,
    slices: List<BreakdownSlice>,
    animTrigger: Int
) {
    val kc = MaterialTheme.klinUpColors
    var playAnim by remember(animTrigger) { mutableStateOf(false) }
    LaunchedEffect(animTrigger) {
        playAnim = true
    }
    val sweepProgress by animateFloatAsState(
        targetValue = if (playAnim) 1f else 0f,
        animationSpec = tween(durationMillis = 850, easing = FastOutSlowInEasing),
        label = "donut_sweep"
    )

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = kc.cardBg,
        border = BorderStroke(1.dp, kc.border),
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = kc.inkPrimary
            )

            if (slices.isEmpty()) {
                Text(
                    text = "Aucune donnée disponible pour cette répartition.",
                    fontSize = 13.sp,
                    color = kc.inkSecondary
                )
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Animated Donut Ring
                    Box(
                        modifier = Modifier.size(116.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val strokeW = 16.dp.toPx()
                            val pad = strokeW / 2f
                            val arcSize = Size(size.width - strokeW, size.height - strokeW)
                            drawArc(
                                color = kc.pageBg,
                                startAngle = 0f,
                                sweepAngle = 360f,
                                useCenter = false,
                                topLeft = Offset(pad, pad),
                                size = arcSize,
                                style = Stroke(width = strokeW)
                            )
                            var currentAngle = -90f
                            val gap = if (slices.size > 1) 4f else 0f
                            slices.forEach { slice ->
                                val fullSweep = (slice.percentage * 360f - gap).coerceAtLeast(2f)
                                val animatedSweep = fullSweep * sweepProgress
                                drawArc(
                                    color = slice.color,
                                    startAngle = currentAngle,
                                    sweepAngle = animatedSweep,
                                    useCenter = false,
                                    topLeft = Offset(pad, pad),
                                    size = arcSize,
                                    style = Stroke(width = strokeW, cap = StrokeCap.Round)
                                )
                                currentAngle += slice.percentage * 360f
                            }
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = centerTop,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = kc.inkPrimary
                            )
                            Text(
                                text = centerBottom,
                                fontSize = 10.sp,
                                color = kc.inkSecondary
                            )
                        }
                    }

                    // Legend + Animated Horizontal Bars
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        slices.forEach { slice ->
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(slice.color)
                                        )
                                        Text(
                                            text = slice.label,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = kc.inkPrimary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                    Text(
                                        text = "${(slice.percentage * 100).roundToInt()}%",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = kc.inkPrimary
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(kc.pageBg)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth((slice.percentage * sweepProgress).coerceIn(0.03f, 1f))
                                            .fillMaxHeight()
                                            .clip(RoundedCornerShape(999.dp))
                                            .background(slice.color)
                                    )
                                }
                                Text(
                                    text = slice.formattedValue,
                                    fontSize = 10.sp,
                                    color = kc.inkMuted
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ─── Insight Banner ───────────────────────────────────────────────────────────
@Composable
private fun InsightBannerCard(
    title: String,
    message: String,
    accentColor: Color
) {
    val kc = MaterialTheme.klinUpColors
    val cardBg = if (kc.isDark) kc.softBlueBg else accentColor.copy(alpha = 0.08f)
    val cardBorder = if (kc.isDark) kc.softBlueBorder else accentColor.copy(alpha = 0.22f)
    val iconBoxBg = if (kc.isDark) Color.White.copy(alpha = 0.10f) else accentColor.copy(alpha = 0.16f)
    val iconTint = if (kc.isDark) kc.inkPrimary else accentColor
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(26.dp),
        color = cardBg,
        border = BorderStroke(1.dp, cardBorder),
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBoxBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = TablerIcons.Sparkles,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(18.dp)
                )
            }
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = kc.inkPrimary
                )
                Text(
                    text = message,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = kc.inkSecondary
                )
            }
        }
    }
}

// ─── Data Builder ─────────────────────────────────────────────────────────────
private fun parseOrderDate(raw: String, zone: ZoneId): LocalDate? {
    if (raw.isBlank()) return null
    KlinUpRepository.parseInstant(raw)?.let { inst ->
        return inst.atZone(zone).toLocalDate()
    }
    return try {
        LocalDate.parse(raw.take(10))
    } catch (_: Exception) {
        null
    }
}

private fun collectedAmount(order: Order): Double {
    if (order.statut == "annule") return 0.0
    return if (order.statut == "restitue") order.prixTotal
    else order.avancePayee.coerceIn(0.0, order.prixTotal)
}

private fun buildKpiDetailModel(kind: KpiKind, storeOrders: List<Order>): KpiDetailUiModel {
    val zone = ZoneId.systemDefault()
    val today = LocalDate.now(zone)
    val nonCancelled = storeOrders.filter { it.statut != "annule" }
    val dated = nonCancelled.map { it to parseOrderDate(it.createdAt.orEmpty(), zone) }
    val allDated = storeOrders.map { it to parseOrderDate(it.createdAt.orEmpty(), zone) }

    val slicePalette = listOf(
        Color(0xFF4F46E5),
        Color(0xFF10B981),
        Color(0xFFF59E0B),
        Color(0xFF8B5CF6),
        Color(0xFFEC4899)
    )

    fun buildSevenDays(valueSelector: (List<Order>) -> Double, formatter: (Double) -> String): List<ChartPoint> {
        return (6 downTo 0).map { offset ->
            val day = today.minusDays(offset.toLong())
            val dayOrders = dated.filter { it.second == day }.map { it.first }
            val v = valueSelector(dayOrders)
            val lbl = day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                .replace(".", "")
                .replaceFirstChar { it.uppercase() }
                .take(3)
            ChartPoint(label = lbl, value = v, formattedValue = formatter(v), count = dayOrders.size)
        }
    }

    fun buildSixMonths(valueSelector: (List<Order>) -> Double, formatter: (Double) -> String): List<ChartPoint> {
        return (5 downTo 0).map { offset ->
            val monthDate = today.minusMonths(offset.toLong())
            val monthOrders = dated.filter {
                val d = it.second
                d != null && d.year == monthDate.year && d.month == monthDate.month
            }.map { it.first }
            val v = valueSelector(monthOrders)
            val lbl = monthDate.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                .replace(".", "")
                .replaceFirstChar { it.uppercase() }
                .take(4)
            ChartPoint(label = lbl, value = v, formattedValue = formatter(v), count = monthOrders.size)
        }
    }

    return when (kind) {
        KpiKind.CA_MENSUEL -> {
            val prevMonth = today.minusMonths(1)
            val curOrders = dated.filter { it.second?.year == today.year && it.second?.month == today.month }.map { it.first }
            val prevOrders = dated.filter { it.second?.year == prevMonth.year && it.second?.month == prevMonth.month }.map { it.first }
            val curCa = curOrders.sumOf { it.prixTotal }
            val prevCa = prevOrders.sumOf { it.prixTotal }
            val totalCa = nonCancelled.sumOf { it.prixTotal }
            val trendPct = if (prevCa <= 0.0) (if (curCa > 0) 100 else 0) else (((curCa - prevCa) / prevCa) * 100.0).roundToInt()
            val sign = if (trendPct >= 0) "+" else ""
            val avgDaily = if (today.dayOfMonth > 0) curCa / today.dayOfMonth else 0.0

            val byService = nonCancelled
                .groupBy { it.typeService.ifBlank { "Classique" } }
                .entries
                .sortedByDescending { e -> e.value.sumOf { it.prixTotal } }
                .take(4)
            val slices = if (totalCa <= 0.0) emptyList() else byService.mapIndexed { idx, (svc, list) ->
                val sum = list.sumOf { it.prixTotal }
                BreakdownSlice(
                    label = svc,
                    value = sum,
                    formattedValue = "${KlinUpRepository.formatFcfa(sum)} • ${list.size} cmd",
                    percentage = (sum / totalCa).toFloat(),
                    color = slicePalette[idx % slicePalette.size]
                )
            }

            KpiDetailUiModel(
                kind = kind,
                heroTitle = "Chiffre d'Affaires Mensuel",
                heroValue = KlinUpRepository.formatFcfa(curCa),
                heroBadge = "$sign$trendPct% vs mois dernier",
                heroSubLeftLabel = "Mois précédent",
                heroSubLeftValue = KlinUpRepository.formatFcfa(prevCa),
                heroSubRightLabel = "CA Cumulé total",
                heroSubRightValue = KlinUpRepository.formatFcfa(totalCa),
                statTiles = listOf(
                    StatTileData("Commandes (mois)", "${curOrders.size}", "Hors annulations"),
                    StatTileData("Moyenne / jour", KlinUpRepository.formatFcfa(avgDaily), "Sur ${today.dayOfMonth} jours"),
                    StatTileData("Express / Urgent", "${curOrders.count { it.niveauUrgence != "normal" }}", "Commandes prioritaires"),
                    StatTileData("Abonnements", "${curOrders.count { it.isSubscriptionOrder }}", "Commandes forfait")
                ),
                chartTitle = "Évolution du Chiffre d'Affaires",
                sevenDaysPoints = buildSevenDays({ list -> list.sumOf { it.prixTotal } }) { KlinUpRepository.formatFcfa(it) },
                sixMonthsPoints = buildSixMonths({ list -> list.sumOf { it.prixTotal } }) { KlinUpRepository.formatFcfa(it) },
                breakdownTitle = "Répartition par type de service",
                breakdownCenterTop = "${byService.size}",
                breakdownCenterBottom = "services",
                slices = slices,
                insightTitle = "Analyse Chiffre d'Affaires",
                insightMessage = if (curCa >= prevCa) {
                    "Bonne dynamique ce mois-ci avec ${KlinUpRepository.formatFcfa(curCa)} générés sur ${curOrders.size} commandes actives ou finalisées."
                } else {
                    "Le chiffre d'affaires est en retrait de ${KlinUpRepository.formatFcfa(prevCa - curCa)} par rapport au mois précédent. Misez sur les relances clients et les options Express."
                }
            )
        }

        KpiKind.PANIER_MOYEN -> {
            val avg = if (nonCancelled.isEmpty()) 0.0 else nonCancelled.sumOf { it.prixTotal } / nonCancelled.size
            val curOrders = dated.filter { it.second?.year == today.year && it.second?.month == today.month }.map { it.first }
            val curAvg = if (curOrders.isEmpty()) 0.0 else curOrders.sumOf { it.prixTotal } / curOrders.size
            val maxOrder = nonCancelled.maxOfOrNull { it.prixTotal } ?: 0.0
            val minOrder = nonCancelled.minOfOrNull { it.prixTotal } ?: 0.0
            val avgItems = if (nonCancelled.isEmpty()) 0.0 else nonCancelled.sumOf { it.items?.size ?: 0 }.toDouble() / nonCancelled.size
            val pctDiff = if (avg <= 0.0) 0 else (((curAvg - avg) / avg) * 100.0).roundToInt()
            val sign = if (pctDiff >= 0) "+" else ""

            val buckets = listOf(
                "< 2 500 F" to nonCancelled.filter { it.prixTotal < 2500 },
                "2 500 - 5 000 F" to nonCancelled.filter { it.prixTotal in 2500.0..4999.9 },
                "5 000 - 10 000 F" to nonCancelled.filter { it.prixTotal in 5000.0..9999.9 },
                "10 000 F+" to nonCancelled.filter { it.prixTotal >= 10000 }
            ).filter { it.second.isNotEmpty() }

            val totalCount = nonCancelled.size.coerceAtLeast(1)
            val slices = buckets.mapIndexed { idx, (lbl, list) ->
                BreakdownSlice(
                    label = lbl,
                    value = list.size.toDouble(),
                    formattedValue = "${list.size} commandes",
                    percentage = list.size.toFloat() / totalCount,
                    color = slicePalette[idx % slicePalette.size]
                )
            }

            KpiDetailUiModel(
                kind = kind,
                heroTitle = "Panier Moyen",
                heroValue = KlinUpRepository.formatFcfa(avg),
                heroBadge = "$sign$pctDiff% ce mois vs global",
                heroSubLeftLabel = "Panier ce mois",
                heroSubLeftValue = KlinUpRepository.formatFcfa(curAvg),
                heroSubRightLabel = "Plus gros panier",
                heroSubRightValue = KlinUpRepository.formatFcfa(maxOrder),
                statTiles = listOf(
                    StatTileData("Articles / cmd", String.format(Locale.FRENCH, "%.1f", avgItems), "Moyenne d'articles"),
                    StatTileData("Plus petit panier", KlinUpRepository.formatFcfa(minOrder), "Minimum enregistré"),
                    StatTileData("Livraison domicile", "${nonCancelled.count { it.livraisonDomicile }}", "Commandes livrées"),
                    StatTileData("Base calculée", "${nonCancelled.size}", "Commandes valides")
                ),
                chartTitle = "Évolution du Panier Moyen",
                sevenDaysPoints = buildSevenDays(
                    { list -> if (list.isEmpty()) 0.0 else list.sumOf { it.prixTotal } / list.size },
                    { KlinUpRepository.formatFcfa(it) }
                ),
                sixMonthsPoints = buildSixMonths(
                    { list -> if (list.isEmpty()) 0.0 else list.sumOf { it.prixTotal } / list.size },
                    { KlinUpRepository.formatFcfa(it) }
                ),
                breakdownTitle = "Distribution des montants",
                breakdownCenterTop = KlinUpRepository.formatFcfa(avg).replace(" FCFA", ""),
                breakdownCenterBottom = "FCFA moy.",
                slices = slices,
                insightTitle = "Analyse Panier Moyen",
                insightMessage = "Votre panier moyen s'établit à ${KlinUpRepository.formatFcfa(avg)} avec une moyenne de ${String.format(Locale.FRENCH, "%.1f", avgItems)} articles par commande. Proposer le repassage ou la livraison augmente ce panier."
            )
        }

        KpiKind.ENCAISSEMENTS -> {
            val totalBilled = nonCancelled.sumOf { it.prixTotal }
            val totalCollected = nonCancelled.sumOf { collectedAmount(it) }
            val remaining = (totalBilled - totalCollected).coerceAtLeast(0.0)
            val rate = if (totalBilled <= 0.0) 100 else ((totalCollected / totalBilled) * 100.0).roundToInt()
            val unpaidCount = nonCancelled.count { it.prixTotal - collectedAmount(it) > 0.5 }
            val fullyPaidCount = nonCancelled.size - unpaidCount

            val byMode = nonCancelled
                .groupBy { it.modeReglement.ifBlank { "Espèces" } }
                .entries
                .sortedByDescending { e -> e.value.sumOf { collectedAmount(it) } }
                .take(4)
            val totalForSlices = (totalCollected + remaining).coerceAtLeast(1.0)
            val slices = buildList {
                byMode.forEachIndexed { idx, (mode, list) ->
                    val sum = list.sumOf { collectedAmount(it) }
                    if (sum > 0) {
                        add(
                            BreakdownSlice(
                                label = mode,
                                value = sum,
                                formattedValue = "${KlinUpRepository.formatFcfa(sum)} • ${list.size} cmd",
                                percentage = (sum / totalForSlices).toFloat(),
                                color = slicePalette[idx % slicePalette.size]
                            )
                        )
                    }
                }
                if (remaining > 0.5) {
                    add(
                        BreakdownSlice(
                            label = "Reste à percevoir",
                            value = remaining,
                            formattedValue = "${KlinUpRepository.formatFcfa(remaining)} • $unpaidCount cmd",
                            percentage = (remaining / totalForSlices).toFloat(),
                            color = Color(0xFFEF4444)
                        )
                    )
                }
            }

            KpiDetailUiModel(
                kind = kind,
                heroTitle = "Encaissements Totaux",
                heroValue = KlinUpRepository.formatFcfa(totalCollected),
                heroBadge = "$rate% du facturé encaissé",
                heroSubLeftLabel = "Reste à encaisser",
                heroSubLeftValue = KlinUpRepository.formatFcfa(remaining),
                heroSubRightLabel = "Total facturé",
                heroSubRightValue = KlinUpRepository.formatFcfa(totalBilled),
                statTiles = listOf(
                    StatTileData("Taux recouvrement", "$rate%", "Sur commandes actives"),
                    StatTileData("Soldées", "$fullyPaidCount", "Commandes payées à 100%"),
                    StatTileData("En attente solde", "$unpaidCount", "Reste dû à percevoir"),
                    StatTileData("Frais livraison", KlinUpRepository.formatFcfa(nonCancelled.sumOf { it.fraisLivraison }), "Cumul livraison")
                ),
                chartTitle = "Rythme des Encaissements",
                sevenDaysPoints = buildSevenDays({ list -> list.sumOf { collectedAmount(it) } }) { KlinUpRepository.formatFcfa(it) },
                sixMonthsPoints = buildSixMonths({ list -> list.sumOf { collectedAmount(it) } }) { KlinUpRepository.formatFcfa(it) },
                breakdownTitle = "Modes de règlement & Impayés",
                breakdownCenterTop = "$rate%",
                breakdownCenterBottom = "encaissé",
                slices = slices,
                insightTitle = "Suivi de Trésorerie",
                insightMessage = if (remaining > 0.5) {
                    "Il reste ${KlinUpRepository.formatFcfa(remaining)} à encaisser sur $unpaidCount commande(s). Vérifiez les commandes prêtes pour accélérer le règlement."
                } else {
                    "Excellent ! 100% des commandes facturées ont été intégralement encaissées."
                }
            )
        }

        KpiKind.FINALISATION -> {
            val total = storeOrders.size
            val completed = storeOrders.count { it.statut == "restitue" }
            val ready = storeOrders.count { it.statut == "pret" }
            val inProgress = storeOrders.count { it.statut !in setOf("restitue", "pret", "annule") }
            val cancelled = storeOrders.count { it.statut == "annule" }
            val validTotal = (total - cancelled).coerceAtLeast(1)
            val rate = if (total == 0) 0 else ((completed * 100.0) / validTotal).roundToInt()

            val rawSlices = listOf(
                Triple("Restituées", completed, Color(0xFF10B981)),
                Triple("Prêtes", ready, Color(0xFF3B82F6)),
                Triple("En cours", inProgress, Color(0xFFF59E0B)),
                Triple("Annulées", cancelled, Color(0xFFEF4444))
            ).filter { it.second > 0 }

            val denom = total.coerceAtLeast(1).toFloat()
            val slices = rawSlices.map { (lbl, cnt, col) ->
                BreakdownSlice(
                    label = lbl,
                    value = cnt.toDouble(),
                    formattedValue = "$cnt commande(s)",
                    percentage = cnt / denom,
                    color = col
                )
            }

            fun completionRateFor(list: List<Order>): Double {
                val valid = list.filter { it.statut != "annule" }
                if (valid.isEmpty()) return 0.0
                return (valid.count { it.statut == "restitue" } * 100.0) / valid.size
            }

            fun buildAllSevenDays(): List<ChartPoint> {
                return (6 downTo 0).map { offset ->
                    val day = today.minusDays(offset.toLong())
                    val dayOrders = allDated.filter { it.second == day }.map { it.first }
                    val r = completionRateFor(dayOrders)
                    val lbl = day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                        .replace(".", "")
                        .replaceFirstChar { it.uppercase() }
                        .take(3)
                    ChartPoint(lbl, r, "${r.roundToInt()}%", dayOrders.size)
                }
            }

            fun buildAllSixMonths(): List<ChartPoint> {
                return (5 downTo 0).map { offset ->
                    val monthDate = today.minusMonths(offset.toLong())
                    val monthOrders = allDated.filter {
                        val d = it.second
                        d != null && d.year == monthDate.year && d.month == monthDate.month
                    }.map { it.first }
                    val r = completionRateFor(monthOrders)
                    val lbl = monthDate.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH)
                        .replace(".", "")
                        .replaceFirstChar { it.uppercase() }
                        .take(4)
                    ChartPoint(lbl, r, "${r.roundToInt()}%", monthOrders.size)
                }
            }

            KpiDetailUiModel(
                kind = kind,
                heroTitle = "Taux de Finalisation",
                heroValue = "$rate%",
                heroBadge = "$completed commandes restituées",
                heroSubLeftLabel = "Prêtes à livrer",
                heroSubLeftValue = "$ready commande(s)",
                heroSubRightLabel = "En traitement",
                heroSubRightValue = "$inProgress commande(s)",
                statTiles = listOf(
                    StatTileData("Restituées", "$completed", "Clôturées avec succès"),
                    StatTileData("Prêtes", "$ready", "En attente de retrait"),
                    StatTileData("En cours", "$inProgress", "Lavage / Repassage"),
                    StatTileData("Annulées", "$cancelled", "Hors calcul de taux")
                ),
                chartTitle = "Taux de Finalisation (%)",
                sevenDaysPoints = buildAllSevenDays(),
                sixMonthsPoints = buildAllSixMonths(),
                breakdownTitle = "Répartition par statut",
                breakdownCenterTop = "$rate%",
                breakdownCenterBottom = "livrées",
                slices = slices,
                insightTitle = "Performance Opérationnelle",
                insightMessage = if (ready > 0) {
                    "$ready commande(s) sont prêtes et n'attendent plus que le retrait ou la livraison pour booster votre taux de finalisation."
                } else {
                    "Votre flux de traitement est fluide avec $rate% des commandes valides déjà restituées aux clients."
                }
            )
        }
    }
}
