package com.klinup.app.ui.screens.customer_detail

import com.klinup.app.ui.components.TablerIcons

import com.klinup.app.ui.components.CustomerProfileFormCard
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.material.icons.filled.Close
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.CheckCircleOutline
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material.icons.outlined.Checkroom
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.klinup.app.data.models.CatalogItem
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.components.KlinUpDropdownItem
import com.klinup.app.ui.components.KlinUpDropdownMenu
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.launch

private val BrandBlue            = Color(0xFF0D2FE8)
private val BrandText: Color     @Composable get() = MaterialTheme.klinUpColors.brandText
private val SurfaceBg: Color     @Composable get() = MaterialTheme.klinUpColors.altPageBg
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerDetailScreen(
    customerId: String,
    onBack: () -> Unit
) {
    val customers by KlinUpRepository.customers.collectAsState()
    val catalog by KlinUpRepository.catalog.collectAsState()
    val selectedStoreId by KlinUpRepository.selectedStoreId.collectAsState()
    val customer = remember(customers, customerId) { customers.firstOrNull { it.id == customerId } }

    val subscriptionPlans = remember(catalog, selectedStoreId) {
        catalog.filter { item ->
            val isSub = item.categorie.equals("abonnement", ignoreCase = true) ||
                item.service.equals("abonnement", ignoreCase = true)
            val isActive = (item.isActive ?: true) && !item.statut.equals("inactif", ignoreCase = true)
            val matchesStore = item.storeId == null || selectedStoreId == "all" || item.storeId == selectedStoreId
            isSub && isActive && matchesStore
        }
    }

    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current

    var isBusy by remember { mutableStateOf(false) }
    var feedbackMessage by remember { mutableStateOf<String?>(null) }
    var selectedPlan by remember { mutableStateOf<CatalogItem?>(null) }
    var planDropdownExpanded by remember { mutableStateOf(false) }
    var pendingSubscriptionPaymentPlan by remember { mutableStateOf<CatalogItem?>(null) }

    var showDeleteDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var rewardSheetTab by remember { mutableStateOf<String?>(null) } // "redeem" | "adjust"

    val rewardAdjustments by KlinUpRepository.rewardAdjustments.collectAsState()
    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val canValidateAdjustments = KlinUpRepository.canValidateRewardAdjustments(currentUser)

    if (customer == null) {
        Scaffold(containerColor = SurfaceBg) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Client introuvable", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = InkPrimary)
                    Button(
                        onClick = onBack,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        Text("Retour", color = Color.White)
                    }
                }
            }
        }
        return
    }

    val appColors = MaterialTheme.klinUpColors
    val tier = KlinUpRepository.fidelityTier(customer.pointsFidelite)
    val (tierAccent, tierSoftBg, tierBorder) = if (appColors.isDark) {
        when (tier.tierName) {
            "Platine VIP" -> Triple(Color(0xFF818CF8), Color(0xFF151836), Color(0xFF2D336B))
            "Or" -> Triple(Color(0xFFFBBF24), Color(0xFF241D08), Color(0xFF524011))
            "Argent" -> Triple(Color(0xFF38BDF8), Color(0xFF0D2136), Color(0xFF1C456E))
            else -> Triple(Color(0xFFFB923C), Color(0xFF26160A), Color(0xFF573114))
        }
    } else {
        when (tier.tierName) {
            "Platine VIP" -> Triple(Color(0xFF4F46E5), Color(0xFFEEF2FF), Color(0xFFC7D2FE))
            "Or" -> Triple(Color(0xFFCA8A04), Color(0xFFFEFCE8), Color(0xFFFDE68A))
            "Argent" -> Triple(Color(0xFF0284C7), Color(0xFFE0F2FE), Color(0xFFBAE6FD))
            else -> Triple(Color(0xFFC26B27), Color(0xFFFFF7ED), Color(0xFFFED7AA))
        }
    }

    Scaffold(
        containerColor = SurfaceBg,
        topBar = {
            Surface(color = CardWhite, shadowElevation = 0.dp) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Surface(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            onBack()
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .align(Alignment.CenterStart),
                        shape = CircleShape,
                        color = appColors.chipBg
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.ArrowLeft,
                                contentDescription = "Retour",
                                tint = InkPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Text(
                        text = "Fiche Client",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
            }
        },
        bottomBar = {
            Surface(
                color = SurfaceBg,
                shadowElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showDeleteDialog = true
                        },
                        enabled = !isBusy,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(50),
                        color = appColors.softRedBg
                    ) {
                        Row(
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = TablerIcons.Trash,
                                contentDescription = null,
                                tint = appColors.redText,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Supprimer",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = appColors.redText
                            )
                        }
                    }

                    Button(
                        onClick = {
                            haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                            showEditDialog = true
                        },
                        enabled = !isBusy,
                        modifier = Modifier
                            .weight(1.45f)
                            .height(50.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue),
                        contentPadding = PaddingValues(horizontal = 16.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Edit,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(17.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Modifier",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (feedbackMessage != null) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = appColors.softSkyBg,
                    border = BorderStroke(1.dp, appColors.softSkyBorder)
                ) {
                    Text(
                        text = feedbackMessage!!,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = appColors.skyText,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }

            // ── Header Avatar + Name + Phone ─────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(appColors.softBlueBg),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = customer.initials,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandText
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = customer.fullName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = customer.telephone.ifBlank { "Aucun téléphone" },
                        fontSize = 13.sp,
                        color = InkSecondary
                    )
                }
            }

            // ── Client Info Card ─────────────────────────────────
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
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.MapPin,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = customer.adresse?.takeIf { it.isNotBlank() } ?: "Adresse non renseignée",
                            fontSize = 14.sp,
                            color = InkSecondary
                        )
                    }

                    Text(
                        text = buildAnnotatedString {
                            withStyle(SpanStyle(color = InkSecondary)) {
                                append("Preferences :  ")
                            }
                            withStyle(SpanStyle(color = InkPrimary, fontWeight = FontWeight.Bold)) {
                                append(customer.preferencesPliage?.takeIf { it.isNotBlank() } ?: "Plié")
                            }
                        },
                        fontSize = 14.sp
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.CreditCard,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = buildAnnotatedString {
                                withStyle(SpanStyle(color = InkSecondary)) {
                                    append("Solde Dette :  ")
                                }
                                withStyle(
                                    SpanStyle(
                                        color = if (customer.soldeDette > 0.0) MaterialTheme.klinUpColors.redText else InkPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                ) {
                                    append(KlinUpRepository.formatFcfa(customer.soldeDette))
                                }
                            },
                            fontSize = 14.sp
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Calendar,
                            contentDescription = null,
                            tint = InkMuted,
                            modifier = Modifier.size(17.dp)
                        )
                        Text(
                            text = buildAnnotatedString {
                                withStyle(SpanStyle(color = InkSecondary)) {
                                    append("Membre depuis :  ")
                                }
                                withStyle(SpanStyle(color = InkPrimary, fontWeight = FontWeight.Bold)) {
                                    append(KlinUpRepository.formatShortDate(customer.createdAt))
                                }
                            },
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // ── Loyalty Card ─────────────────────────────────────
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(26.dp),
                color = CardWhite,
                shadowElevation = 0.dp,
                border = BorderStroke(1.dp, tierBorder)
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Surface(
                                modifier = Modifier.size(44.dp),
                                shape = CircleShape,
                                color = tierSoftBg,
                                border = BorderStroke(1.dp, tierBorder)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = if (tier.tierName == "Bronze") TablerIcons.Award else TablerIcons.ShieldCheck,
                                        contentDescription = null,
                                        tint = tierAccent,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = "Client ${tier.tierName}",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                                Text(
                                    text = "Statut Fidélité Actif",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = tierAccent
                                )
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(50),
                            color = tierSoftBg,
                            border = BorderStroke(1.dp, tierBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Star,
                                    contentDescription = null,
                                    tint = tierAccent,
                                    modifier = Modifier.size(14.dp)
                                )
                                Text(
                                    text = "${customer.pointsFidelite} pts",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = tierAccent
                                )
                            }
                        }
                    }

                    // Progress toward next tier
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = if (tier.nextTierName != null) {
                                    "${tier.pointsRemaining} pts restants vers ${tier.nextTierName}"
                                } else {
                                    "Niveau maximum atteint"
                                },
                                fontSize = 12.sp,
                                color = InkSecondary
                            )
                            Text(
                                text = "${tier.progressPercent}%",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = tierAccent
                            )
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(50))
                                .background(appColors.trackBg)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(tier.progress.coerceIn(0f, 1f))
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(50))
                                    .background(tierAccent)
                            )
                        }
                    }

                    // Benefits Box
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        color = appColors.cardSubtleBg,
                        border = BorderStroke(1.dp, appColors.innerBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "AVANTAGES DU STATUT ${tier.tierName.uppercase()} :",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkMuted,
                                letterSpacing = 0.5.sp
                            )
                            tier.benefits.forEach { benefit ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = TablerIcons.CircleCheck,
                                        contentDescription = null,
                                        tint = tierAccent,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = benefit,
                                        fontSize = 13.sp,
                                        color = InkPrimary
                                    )
                                }
                            }
                        }
                    }

                    // Loyalty Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                rewardSheetTab = "redeem"
                            },
                            enabled = !isBusy,
                            modifier = Modifier
                                .weight(1.6f)
                                .height(46.dp),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(containerColor = tierAccent),
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.Gift,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(17.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Échanger des Points",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        OutlinedButton(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                rewardSheetTab = "adjust"
                            },
                            enabled = !isBusy,
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, appColors.innerBorder),
                            contentPadding = PaddingValues(horizontal = 10.dp)
                        ) {
                            Icon(
                                imageVector = TablerIcons.Bolt,
                                contentDescription = null,
                                tint = tierAccent,
                                modifier = Modifier.size(17.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Ajuster",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkPrimary
                            )
                        }
                    }
                }
            }

            // ── Pending Reward Adjustments Card ──────────────────
            val pendingAdjustments = remember(rewardAdjustments, customer.id) {
                rewardAdjustments.filter { it.customerId == customer.id && it.status == "pending" }
            }
            if (pendingAdjustments.isNotEmpty()) {
                val pendingAmber = MaterialTheme.klinUpColors.amberText
                val pendingBg = if (appColors.isDark) Color(0xFF231A09) else Color(0xFFFFFBEB)
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(26.dp),
                    color = pendingBg,
                    border = BorderStroke(1.2.dp, pendingAmber.copy(alpha = 0.45f)),
                    shadowElevation = 0.dp
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Bolt,
                                    contentDescription = null,
                                    tint = pendingAmber,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "Ajustement en attente de validation",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = pendingAmber.copy(alpha = 0.16f)
                            ) {
                                Text(
                                    text = "${pendingAdjustments.size}",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = pendingAmber,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        pendingAdjustments.forEach { adj ->
                            val sign = if (adj.pointsDelta > 0) "+${adj.pointsDelta}" else "${adj.pointsDelta}"
                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                color = CardWhite,
                                border = BorderStroke(1.dp, pendingAmber.copy(alpha = 0.3f)),
                                shadowElevation = 0.dp
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "$sign pts demandés",
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = if (adj.pointsDelta >= 0) BrandText else MaterialTheme.klinUpColors.redText
                                        )
                                        Text(
                                            text = "En attente Admin",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = pendingAmber
                                        )
                                    }
                                    Text(
                                        text = "Motif : ${adj.reason}",
                                        fontSize = 12.sp,
                                        color = InkPrimary
                                    )
                                    Text(
                                        text = "Demandé par ${adj.requestedByName ?: "Agent"}",
                                        fontSize = 11.sp,
                                        color = InkSecondary
                                    )
                                    if (canValidateAdjustments) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(top = 4.dp),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            OutlinedButton(
                                                onClick = {
                                                    if (!isBusy) {
                                                        isBusy = true
                                                        scope.launch {
                                                            val res = KlinUpRepository.validateRewardAdjustment(adj.id, approve = false)
                                                            isBusy = false
                                                            feedbackMessage = if (res.isSuccess) {
                                                                "Ajustement refusé."
                                                            } else {
                                                                res.exceptionOrNull()?.message ?: "Erreur lors du refus."
                                                            }
                                                        }
                                                    }
                                                },
                                                enabled = !isBusy,
                                                shape = RoundedCornerShape(10.dp),
                                                border = BorderStroke(1.dp, Color(0xFFDC2626).copy(alpha = 0.5f)),
                                                modifier = Modifier.weight(1f).height(38.dp)
                                            ) {
                                                Text("Refuser", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFDC2626))
                                            }
                                            Button(
                                                onClick = {
                                                    if (!isBusy) {
                                                        isBusy = true
                                                        scope.launch {
                                                            val res = KlinUpRepository.validateRewardAdjustment(adj.id, approve = true)
                                                            isBusy = false
                                                            feedbackMessage = if (res.isSuccess) {
                                                                "Ajustement validé ($sign pts) !"
                                                            } else {
                                                                res.exceptionOrNull()?.message ?: "Erreur lors de la validation."
                                                            }
                                                        }
                                                    }
                                                },
                                                enabled = !isBusy,
                                                shape = RoundedCornerShape(10.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                                                modifier = Modifier.weight(1f).height(38.dp)
                                            ) {
                                                Text("Valider", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ── Subscription Card (Abonnement) ───────────────────
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
                    Text(
                        text = "Abonnement",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary
                    )

                    HorizontalDivider(color = appColors.divider)

                    val activeSub = customer.activeSubscription
                    if (activeSub != null) {
                        val total = activeSub.totalClothes.coerceAtLeast(1)
                        val remaining = activeSub.remainingClothes.coerceIn(0, total)
                        val progress = remaining.toFloat() / total.toFloat()

                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            color = appColors.softSkyBg,
                            border = BorderStroke(1.dp, appColors.softSkyBorder)
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
                                        text = activeSub.name.ifBlank { "Abonnement actif" },
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = InkPrimary
                                    )
                                    Text(
                                        text = "$remaining / $total vêt.",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = BrandText
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(50))
                                        .background(appColors.trackBg)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth(progress)
                                            .height(6.dp)
                                            .clip(RoundedCornerShape(50))
                                            .background(BrandBlue)
                                    )
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Expire le ${KlinUpRepository.formatShortDate(activeSub.expiresAt ?: activeSub.endDate)}",
                                        fontSize = 12.sp,
                                        color = InkSecondary
                                    )
                                    TextButton(
                                        enabled = !isBusy,
                                        onClick = {
                                            isBusy = true
                                            scope.launch {
                                                val res = KlinUpRepository.unsubscribeCustomer(customer.id)
                                                isBusy = false
                                                if (res.isSuccess) {
                                                    selectedPlan = null
                                                    planDropdownExpanded = false
                                                }
                                                feedbackMessage = if (res.isSuccess) "Abonnement résilié." else res.exceptionOrNull()?.message
                                            }
                                        },
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text("Résilier", fontSize = 12.sp, color = appColors.redText, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }

                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            color = appColors.softAmberBg,
                            border = BorderStroke(1.dp, appColors.amberText.copy(alpha = 0.3f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Lock,
                                    contentDescription = null,
                                    tint = appColors.amberText,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "Souscription bloquée : résiliez d'abord l'abonnement en cours pour en souscrire un nouveau.",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = InkSecondary,
                                    lineHeight = 16.sp
                                )
                            }
                        }
                    } else {
                        // Formula selector dropdown
                        Box(modifier = Modifier.fillMaxWidth()) {
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .clickable { planDropdownExpanded = true },
                                shape = RoundedCornerShape(14.dp),
                                color = CardWhite,
                                border = BorderStroke(1.dp, appColors.innerBorder)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = selectedPlan?.let {
                                            "${it.article} • ${KlinUpRepository.formatFcfa(it.prix)}"
                                        } ?: "-- Choisir une formule --",
                                        fontSize = 14.sp,
                                        color = if (selectedPlan != null) InkPrimary else InkSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Icon(
                                        imageVector = TablerIcons.ChevronDown,
                                        contentDescription = null,
                                        tint = InkSecondary
                                    )
                                }
                            }

                            KlinUpDropdownMenu(
                                expanded = planDropdownExpanded,
                                onDismissRequest = { planDropdownExpanded = false }
                            ) {
                                if (subscriptionPlans.isEmpty()) {
                                    KlinUpDropdownItem(
                                        text = "Aucune formule disponible",
                                        selected = false,
                                        onClick = { planDropdownExpanded = false }
                                    )
                                } else {
                                    subscriptionPlans.forEach { plan ->
                                        KlinUpDropdownItem(
                                            text = "${plan.article} (${KlinUpRepository.formatFcfa(plan.prix)})",
                                            selected = selectedPlan?.id == plan.id,
                                            onClick = {
                                                selectedPlan = plan
                                                planDropdownExpanded = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val plan = selectedPlan ?: return@Button
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                pendingSubscriptionPaymentPlan = plan
                            },
                            enabled = !isBusy && selectedPlan != null,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandBlue,
                                disabledContainerColor = BrandBlue.copy(alpha = 0.55f)
                            )
                        ) {
                            if (isBusy) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Text(
                                    text = "Souscrire",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }

    // ── Subscription Payment Confirmation Dialog ─────────────────
    pendingSubscriptionPaymentPlan?.let { planToPay ->
        com.klinup.app.ui.components.SubscriptionPaymentDialog(
            planName = planToPay.article,
            planPrice = planToPay.prix,
            customerName = customer.fullName,
            isSubmitting = isBusy,
            onDismiss = { if (!isBusy) pendingSubscriptionPaymentPlan = null },
            onConfirm = { _, _, _, _ ->
                isBusy = true
                scope.launch {
                    val res = KlinUpRepository.subscribeCustomer(customer.id, planToPay)
                    isBusy = false
                    pendingSubscriptionPaymentPlan = null
                    feedbackMessage = if (res.isSuccess) {
                        selectedPlan = null
                        "Abonnement ${planToPay.article} payé et activé."
                    } else {
                        res.exceptionOrNull()?.message ?: "Erreur lors de la souscription"
                    }
                }
            }
        )
    }

    // ── Delete Confirmation Dialog ───────────────────────────────
    if (showDeleteDialog) {
        var deleteReason by remember { mutableStateOf("") }
        var showReasonError by remember { mutableStateOf(false) }
        val isReasonValid = deleteReason.trim().isNotEmpty()
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            containerColor = CardWhite,
            title = { Text("Supprimer le client ?", color = InkPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Voulez-vous vraiment supprimer ${customer.fullName} ? Cette action est irréversible.", color = InkSecondary)
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
                        placeholder = { Text("Ex : Compte doublon, demande du client...", color = InkSecondary) },
                        isError = showReasonError,
                        supportingText = {
                            Text(
                                text = if (showReasonError) "Le motif est obligatoire pour supprimer." else "Champ obligatoire",
                                color = if (showReasonError) Color(0xFFEF4444) else InkSecondary
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
                            errorBorderColor = Color(0xFFEF4444),
                            errorContainerColor = Color(0xFFEF4444).copy(alpha = 0.05f),
                            cursorColor = BrandBlue
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val trimmed = deleteReason.trim()
                        if (trimmed.isEmpty()) {
                            showReasonError = true
                            return@Button
                        }
                        showDeleteDialog = false
                        isBusy = true
                        scope.launch {
                            val res = KlinUpRepository.deleteCustomer(customer.id, reason = trimmed)
                            isBusy = false
                            if (res.isSuccess) {
                                onBack()
                            } else {
                                feedbackMessage = res.exceptionOrNull()?.message ?: "Impossible de supprimer le client"
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isReasonValid) Color(0xFFEF4444) else Color(0xFFEF4444).copy(alpha = 0.45f)
                    )
                ) {
                    Text("Supprimer", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Annuler", color = InkSecondary)
                }
            }
        )
    }

    // ── Edit Customer Dialog (Identical to Creation Form) ────────
    if (showEditDialog) {
        val storesList by KlinUpRepository.stores.collectAsState()
        val initialCoords = customer.resolvedLatLng
        val initialIndicatif = com.klinup.app.ui.components.CountryDialCodes
            .findByDisplayOrCode(customer.indicatif)
            .displayValue

        var nom by remember(customer.id) { mutableStateOf(customer.nom) }
        var prenom by remember(customer.id) { mutableStateOf(customer.prenom ?: "") }
        var indicatif by remember(customer.id) { mutableStateOf(initialIndicatif) }
        var telephone by remember(customer.id) { mutableStateOf(customer.telephone) }
        var adresse by remember(customer.id) { mutableStateOf(customer.adresse ?: "") }
        var quartier by remember(customer.id) { mutableStateOf(customer.quartier ?: "") }
        var ville by remember(customer.id) { mutableStateOf(customer.ville ?: "Cotonou") }
        var selectedStore by remember(customer.id, storesList) {
            mutableStateOf(storesList.firstOrNull { it.id == customer.storeId || it.code == customer.storeId })
        }
        var lat by remember(customer.id) { mutableStateOf(initialCoords?.first?.toString() ?: "") }
        var lng by remember(customer.id) { mutableStateOf(initialCoords?.second?.toString() ?: "") }
        var preference by remember(customer.id) {
            mutableStateOf(
                if ((customer.preferencesPliage ?: "").contains("cintre", ignoreCase = true)) "Sur Cintre" else "Plié"
            )
        }

        val editSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

        ModalBottomSheet(
            onDismissRequest = { showEditDialog = false },
            sheetState = editSheetState,
            containerColor = MaterialTheme.klinUpColors.altPageBg,
            contentColor = InkPrimary,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
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
                        text = "Modifier le profil client",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkPrimary
                    )
                    androidx.compose.material3.IconButton(onClick = { showEditDialog = false }) {
                        Icon(TablerIcons.X, contentDescription = "Fermer", tint = InkSecondary)
                    }
                }

                // Scrollable identical profile form
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
                        showSubscriptionSection = false
                    )
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
                        onClick = { showEditDialog = false },
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
                            showEditDialog = false
                            isBusy = true
                            val cleanIndicatif = indicatif.substringAfter("+").trim()
                            val parsedLat = lat.replace(",", ".").trim().toDoubleOrNull()
                            val parsedLng = lng.replace(",", ".").trim().toDoubleOrNull()
                            scope.launch {
                                val res = KlinUpRepository.updateCustomer(
                                    customerId = customer.id,
                                    nom = nom,
                                    prenom = prenom,
                                    telephone = telephone,
                                    indicatif = cleanIndicatif,
                                    adresse = adresse,
                                    quartier = quartier,
                                    ville = ville,
                                    storeId = selectedStore?.id,
                                    latitude = parsedLat,
                                    longitude = parsedLng,
                                    preferencesPliage = preference
                                )
                                isBusy = false
                                feedbackMessage = if (res.isSuccess) "Fiche client mise à jour." else res.exceptionOrNull()?.message
                            }
                        },
                        enabled = telephone.isNotBlank() && (nom.isNotBlank() || prenom.isNotBlank()),
                        modifier = Modifier
                            .weight(1.4f)
                            .height(48.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        Text("Enregistrer", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }

    // ── Unified Reward & Points Bottom Sheet (Admin Parity) ──────
    rewardSheetTab?.let { activeTab ->
        val rewardCatalog = remember(catalog) { KlinUpRepository.getRewardCatalog(catalog) }
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        var deltaText by remember(rewardSheetTab) { mutableStateOf("") }
        var reasonText by remember(rewardSheetTab) { mutableStateOf("") }
        var sheetBusy by remember { mutableStateOf(false) }
        var sheetFeedback by remember { mutableStateOf<Pair<Boolean, String>?>(null) }

        ModalBottomSheet(
            onDismissRequest = { if (!sheetBusy) rewardSheetTab = null },
            sheetState = sheetState,
            containerColor = MaterialTheme.klinUpColors.altPageBg,
            contentColor = InkPrimary,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.86f)
                    .navigationBarsPadding()
                    .imePadding()
            ) {
                // Header: Title + Client + Points Pill + Close
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Fidélité & Récompenses",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary
                        )
                        Text(
                            text = "${customer.fullName} • ${tier.tierName}",
                            fontSize = 12.sp,
                            color = InkSecondary,
                            maxLines = 1
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = tierAccent.copy(alpha = 0.14f),
                            border = BorderStroke(1.dp, tierAccent.copy(alpha = 0.30f))
                        ) {
                            Text(
                                text = "${customer.pointsFidelite} pts",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = tierAccent,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                            )
                        }

                        androidx.compose.material3.IconButton(
                            onClick = { if (!sheetBusy) rewardSheetTab = null }
                        ) {
                            Icon(TablerIcons.X, contentDescription = "Fermer", tint = InkSecondary)
                        }
                    }
                }

                // Segmented Control Tabs (Catalogue Récompenses / Ajuster Points)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = CardWhite,
                    border = BorderStroke(1.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        val isRedeem = activeTab == "redeem"
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .clickable {
                                    rewardSheetTab = "redeem"
                                    sheetFeedback = null
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = if (isRedeem) BrandBlue else Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Gift,
                                    contentDescription = null,
                                    tint = if (isRedeem) Color.White else InkSecondary,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Catalogue (${rewardCatalog.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isRedeem) Color.White else InkSecondary,
                                    maxLines = 1
                                )
                            }
                        }

                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .clickable {
                                    rewardSheetTab = "adjust"
                                    sheetFeedback = null
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = if (!isRedeem) BrandBlue else Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Bolt,
                                    contentDescription = null,
                                    tint = if (!isRedeem) Color.White else InkSecondary,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Ajuster Points",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (!isRedeem) Color.White else InkSecondary,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }

                // Inline Feedback Banner
                sheetFeedback?.let { (isSuccess, msg) ->
                    val bannerBg = if (isSuccess) Color(0xFFF0FDF4) else Color(0xFFFFF1F2)
                    val bannerInk = if (isSuccess) Color(0xFF15803D) else Color(0xFFEF4444)
                    val bannerBorder = if (isSuccess) Color(0xFFBBF7D0) else Color(0xFFFFE4E6)
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = bannerBg,
                        border = BorderStroke(1.dp, bannerBorder)
                    ) {
                        Text(
                            text = msg,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = bannerInk,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)
                        )
                    }
                }

                // Scrollable Content
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (activeTab == "redeem") {
                        rewardCatalog.forEach { reward ->
                            val pts = customer.pointsFidelite
                            val canAfford = pts >= reward.cost
                            val rewardIcon = when (reward.iconName) {
                                "Tag" -> TablerIcons.Tag
                                "Shirt" -> TablerIcons.Hanger
                                "Truck" -> TablerIcons.TruckDelivery
                                "Sparkles" -> TablerIcons.Sparkles
                                else -> TablerIcons.Gift
                            }

                            Surface(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                color = CardWhite,
                                border = BorderStroke(1.dp, CardBorder)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(
                                                if (canAfford) tierAccent.copy(alpha = 0.12f)
                                                else MaterialTheme.klinUpColors.chipBg
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = rewardIcon,
                                            contentDescription = null,
                                            tint = if (canAfford) tierAccent else InkSecondary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }

                                    Column(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(2.dp)
                                    ) {
                                        Text(
                                            text = reward.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = InkPrimary
                                        )
                                        Text(
                                            text = reward.description,
                                            fontSize = 12.sp,
                                            color = InkSecondary
                                        )
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.padding(top = 2.dp)
                                        ) {
                                            Text(
                                                text = "Coût : ${reward.cost} pts",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = tierAccent
                                            )
                                            if (reward.discountAmount > 0) {
                                                Text(
                                                    text = "• ${KlinUpRepository.formatFcfa(reward.discountAmount.toDouble())}",
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = InkSecondary
                                                )
                                            }
                                        }
                                    }

                                    Button(
                                        onClick = {
                                            sheetBusy = true
                                            sheetFeedback = null
                                            scope.launch {
                                                val res = KlinUpRepository.redeemCustomerReward(customer.id, reward)
                                                sheetBusy = false
                                                sheetFeedback = if (res.isSuccess) {
                                                    true to "${reward.title} échangé ! Nouveau solde : ${res.getOrNull()} pts."
                                                } else {
                                                    false to (res.exceptionOrNull()?.message ?: "Échec de l'échange.")
                                                }
                                            }
                                        },
                                        enabled = canAfford && !sheetBusy,
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                                        modifier = Modifier.height(38.dp),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = tierAccent,
                                            disabledContainerColor = MaterialTheme.klinUpColors.chipBg
                                        )
                                    ) {
                                        Text(
                                            text = if (canAfford) "Échanger" else "-${reward.cost - pts} pts",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (canAfford) Color.White else InkSecondary
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Tab 2: Ajuster Points
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(26.dp),
                            color = CardWhite,
                            border = BorderStroke(1.dp, CardBorder)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Text(
                                    text = "Bonus Rapides",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkPrimary
                                )

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    listOf(10, 25, 50, 100).forEach { bonus ->
                                        Surface(
                                            modifier = Modifier
                                                .weight(1f)
                                                .clip(RoundedCornerShape(12.dp))
                                                .clickable(enabled = !sheetBusy) {
                                                    val cleanReason = reasonText.trim()
                                                    if (cleanReason.isEmpty()) {
                                                        deltaText = "$bonus"
                                                        sheetFeedback = false to "Veuillez saisir le motif obligatoire avant d'envoyer pour validation."
                                                    } else {
                                                        sheetBusy = true
                                                        sheetFeedback = null
                                                        scope.launch {
                                                            val res = KlinUpRepository.adjustCustomerPoints(
                                                                customerId = customer.id,
                                                                pointsDelta = bonus,
                                                                reason = cleanReason
                                                            )
                                                            sheetBusy = false
                                                            if (res.isSuccess) {
                                                                sheetFeedback = true to "Demande (+$bonus pts) envoyée pour validation Admin."
                                                                deltaText = ""
                                                                reasonText = ""
                                                            } else {
                                                                sheetFeedback = false to (res.exceptionOrNull()?.message ?: "Erreur lors de la demande.")
                                                            }
                                                        }
                                                    }
                                                },
                                            shape = RoundedCornerShape(12.dp),
                                            color = BrandBlue.copy(alpha = 0.10f),
                                            border = BorderStroke(1.dp, BrandBlue.copy(alpha = 0.25f))
                                        ) {
                                            Box(
                                                modifier = Modifier.padding(vertical = 10.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "+$bonus pts",
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = BrandBlue
                                                )
                                            }
                                        }
                                    }
                                }

                                HorizontalDivider(color = MaterialTheme.klinUpColors.divider)

                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        text = "Variation personnalisée (positif ou négatif)",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = InkPrimary
                                    )
                                    OutlinedTextField(
                                        value = deltaText,
                                        onValueChange = { deltaText = it },
                                        placeholder = { Text("Ex : 50 ou -20", color = InkSecondary) },
                                        singleLine = true,
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = InkPrimary,
                                            unfocusedTextColor = InkPrimary,
                                            focusedContainerColor = CardWhite,
                                            unfocusedContainerColor = MaterialTheme.klinUpColors.chipBg,
                                            focusedBorderColor = BrandBlue,
                                            unfocusedBorderColor = Color(0xFF94A3B8),
                                            cursorColor = BrandBlue
                                        )
                                    )
                                }

                                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(
                                        text = "Motif de l'ajustement *",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = InkPrimary
                                    )
                                    OutlinedTextField(
                                        value = reasonText,
                                        onValueChange = { reasonText = it },
                                        placeholder = { Text("Motif obligatoire (ex : Offert par la gérance, correction...)", color = InkSecondary) },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = InkPrimary,
                                            unfocusedTextColor = InkPrimary,
                                            focusedContainerColor = CardWhite,
                                            unfocusedContainerColor = MaterialTheme.klinUpColors.chipBg,
                                            focusedBorderColor = BrandBlue,
                                            unfocusedBorderColor = Color(0xFF94A3B8),
                                            cursorColor = BrandBlue
                                        )
                                    )
                                }

                                val parsedDelta = deltaText.trim().toIntOrNull() ?: 0
                                val hasValidReason = reasonText.trim().isNotEmpty()
                                Button(
                                    onClick = {
                                        if (parsedDelta != 0 && hasValidReason) {
                                            sheetBusy = true
                                            sheetFeedback = null
                                            scope.launch {
                                                val res = KlinUpRepository.adjustCustomerPoints(
                                                    customerId = customer.id,
                                                    pointsDelta = parsedDelta,
                                                    reason = reasonText.trim()
                                                )
                                                sheetBusy = false
                                                if (res.isSuccess) {
                                                    val sign = if (parsedDelta > 0) "+$parsedDelta" else "$parsedDelta"
                                                    sheetFeedback = true to "Demande ($sign pts) envoyée pour validation Admin."
                                                    deltaText = ""
                                                    reasonText = ""
                                                } else {
                                                    sheetFeedback = false to (res.exceptionOrNull()?.message ?: "Erreur lors de l'ajustement.")
                                                }
                                            }
                                        }
                                    },
                                    enabled = parsedDelta != 0 && hasValidReason && !sheetBusy,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                                ) {
                                    if (sheetBusy) {
                                        CircularProgressIndicator(
                                            color = Color.White,
                                            strokeWidth = 2.dp,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    } else {
                                        Text("Valider l'ajustement", fontWeight = FontWeight.Bold, color = Color.White)
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
