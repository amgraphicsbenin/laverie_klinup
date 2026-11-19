package com.klinup.app.ui.components

import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import com.klinup.app.R
import com.klinup.app.data.local.AppNotification
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.data.local.NotificationCategory
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors

private enum class NotificationFilter { ALL, UNREAD }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationBottomSheet(
    notifications: List<AppNotification>,
    unreadCount: Int,
    hasSystemPermission: Boolean,
    onRequestPermission: () -> Unit,
    onRefresh: () -> Unit,
    onMarkAllRead: () -> Unit,
    onNotificationClick: (AppNotification) -> Unit,
    onDismiss: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val context = LocalContext.current
    val haptics = LocalHapticFeedback.current
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var selectedFilter by remember { mutableStateOf(NotificationFilter.ALL) }

    val displayedNotifications = remember(notifications, selectedFilter) {
        when (selectedFilter) {
            NotificationFilter.ALL -> notifications
            NotificationFilter.UNREAD -> notifications.filter { !it.isRead }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = colors.pageBg,
        contentColor = colors.inkPrimary,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp, bottom = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(colors.border)
                )
            }
        }
    ) {
        val view = LocalView.current
        SideEffect {
            val win = (view.parent as? DialogWindowProvider)?.window ?: return@SideEffect
            val controller = WindowCompat.getInsetsController(win, view)
            controller.isAppearanceLightStatusBars = !colors.isDark
            controller.isAppearanceLightNavigationBars = !colors.isDark
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(bottom = 26.dp)
        ) {
            // ── En-tête du centre de notifications ───────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(13.dp))
                            .background(colors.softBlueBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = TablerIcons.Bell,
                            contentDescription = null,
                            tint = colors.brandText,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                        Text(
                            text = "Notifications",
                            fontSize = 19.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = colors.inkPrimary
                        )
                        Text(
                            text = when {
                                unreadCount == 0 -> "Tout est à jour"
                                unreadCount == 1 -> "1 alerte non lue"
                                else -> "$unreadCount alertes non lues"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (unreadCount > 0) colors.brandText else colors.inkMuted
                        )
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (unreadCount > 0) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = colors.softBlueBg,
                            border = BorderStroke(1.dp, colors.softBlueBorder),
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .bouncyClickable(pressedScale = 0.96f, role = Role.Button) {
                                    haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                    onMarkAllRead()
                                }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 11.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Checks,
                                    contentDescription = null,
                                    tint = colors.brandText,
                                    modifier = Modifier.size(15.dp)
                                )
                                Text(
                                    text = "Tout lire",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.brandText
                                )
                            }
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = colors.cardBg,
                        border = BorderStroke(1.dp, colors.border),
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .bouncyClickable(pressedScale = 0.94f, role = Role.Button) {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                onRefresh()
                            }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.Refresh,
                                contentDescription = "Actualiser",
                                tint = colors.inkSecondary,
                                modifier = Modifier.size(17.dp)
                            )
                        }
                    }
                }
            }

            // ── Sélecteur de filtre (Toutes / Non lues) ──────────────────────
            if (notifications.isNotEmpty()) {
                NotificationFilterBar(
                    selected = selectedFilter,
                    totalCount = notifications.size,
                    unreadCount = unreadCount,
                    onSelect = {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        selectedFilter = it
                    }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            // ── Bannière d'autorisation Android (si non accordée) ─────────────
            if (!hasSystemPermission) {
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = colors.softBlueBg,
                    border = BorderStroke(1.dp, colors.softBlueBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(11.dp))
                                .background(colors.brandBlue.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = TablerIcons.Bell,
                                contentDescription = null,
                                tint = colors.brandText,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = "Activer les alertes système",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.inkPrimary
                            )
                            Text(
                                text = "Recevez les notifications même hors de l'app.",
                                fontSize = 11.5.sp,
                                color = colors.inkMuted,
                                lineHeight = 15.sp
                            )
                        }
                        Button(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    onRequestPermission()
                                } else {
                                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                    }
                                    runCatching { context.startActivity(intent) }
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 7.dp)
                        ) {
                            Text(
                                text = "Activer",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            // ── Liste des notifications ───────────────────────────────────────
            if (displayedNotifications.isEmpty()) {
                val isUnreadEmpty = selectedFilter == NotificationFilter.UNREAD && notifications.isNotEmpty()
                Surface(
                    shape = RoundedCornerShape(22.dp),
                    color = colors.cardBg,
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 38.dp, horizontal = 24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(54.dp)
                                .clip(RoundedCornerShape(18.dp))
                                .background(if (isUnreadEmpty) colors.softGreenBg else colors.chipBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isUnreadEmpty) TablerIcons.Checks else TablerIcons.BellOff,
                                contentDescription = null,
                                tint = if (isUnreadEmpty) colors.greenText else colors.inkMuted,
                                modifier = Modifier.size(26.dp)
                            )
                        }
                        Text(
                            text = if (isUnreadEmpty) "Aucune alerte non lue" else "Aucune notification",
                            fontSize = 15.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.inkPrimary
                        )
                        Text(
                            text = if (isUnreadEmpty) {
                                "Vous avez consulté toutes vos notifications."
                            } else {
                                "Toutes les commandes et alertes sont à jour."
                            },
                            fontSize = 12.5.sp,
                            color = colors.inkMuted,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 460.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 4.dp)
                ) {
                    items(displayedNotifications, key = { it.id }) { notif ->
                        SwipeableNotificationCard(
                            notif = notif,
                            onMarkAsRead = {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                KlinUpNotificationManager.markAsRead(notif.id)
                            },
                            onClick = { onNotificationClick(notif) },
                            modifier = Modifier.animateItem()
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationFilterBar(
    selected: NotificationFilter,
    totalCount: Int,
    unreadCount: Int,
    onSelect: (NotificationFilter) -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = colors.chipBg,
        modifier = Modifier
            .fillMaxWidth()
            .height(42.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            FilterTabItem(
                label = "Toutes",
                count = totalCount,
                selected = selected == NotificationFilter.ALL,
                modifier = Modifier.weight(1f),
                onClick = { onSelect(NotificationFilter.ALL) }
            )
            FilterTabItem(
                label = "Non lues",
                count = unreadCount,
                selected = selected == NotificationFilter.UNREAD,
                highlightCount = unreadCount > 0,
                modifier = Modifier.weight(1f),
                onClick = { onSelect(NotificationFilter.UNREAD) }
            )
        }
    }
}

@Composable
private fun FilterTabItem(
    label: String,
    count: Int,
    selected: Boolean,
    modifier: Modifier = Modifier,
    highlightCount: Boolean = false,
    onClick: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val containerColor by animateColorAsState(
        targetValue = if (selected) colors.cardBg else Color.Transparent,
        animationSpec = tween(160),
        label = "notif_tab_bg"
    )
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = containerColor,
        border = if (selected) BorderStroke(1.dp, colors.border) else null,
        modifier = modifier
            .fillMaxHeight()
            .clip(RoundedCornerShape(10.dp))
            .bouncyClickable(pressedScale = 0.98f, role = Role.Tab, onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                fontSize = 12.5.sp,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                color = if (selected) colors.inkPrimary else colors.inkMuted
            )
            Spacer(modifier = Modifier.width(6.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(
                        when {
                            highlightCount && selected -> colors.brandBlue
                            highlightCount -> colors.softBlueBg
                            selected -> colors.chipBg
                            else -> colors.border.copy(alpha = 0.6f)
                        }
                    )
                    .padding(horizontal = 6.dp, vertical = 1.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "$count",
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = when {
                        highlightCount && selected -> Color.White
                        highlightCount -> colors.brandText
                        selected -> colors.inkPrimary
                        else -> colors.inkMuted
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SwipeableNotificationCard(
    notif: AppNotification,
    onMarkAsRead: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = MaterialTheme.klinUpColors
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { targetValue ->
            if (!notif.isRead && targetValue != SwipeToDismissBoxValue.Settled) {
                onMarkAsRead()
            }
            false
        }
    )

    SwipeToDismissBox(
        state = dismissState,
        modifier = modifier.fillMaxWidth(),
        enableDismissFromStartToEnd = !notif.isRead,
        enableDismissFromEndToStart = !notif.isRead,
        backgroundContent = {
            val direction = dismissState.dismissDirection
            val bgColor by animateColorAsState(
                targetValue = if (direction != SwipeToDismissBoxValue.Settled) {
                    colors.softGreenBg
                } else {
                    Color.Transparent
                },
                animationSpec = tween(180),
                label = "notif_swipe_bg"
            )
            val alignment = when (direction) {
                SwipeToDismissBoxValue.EndToStart -> Alignment.CenterEnd
                else -> Alignment.CenterStart
            }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(20.dp))
                    .background(bgColor)
                    .padding(horizontal = 20.dp),
                contentAlignment = alignment
            ) {
                if (direction != SwipeToDismissBoxValue.Settled) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Checks,
                            contentDescription = null,
                            tint = colors.greenText,
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "Marquer comme lue",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.greenText
                        )
                    }
                }
            }
        }
    ) {
        NotificationRowCard(
            notif = notif,
            onClick = onClick
        )
    }
}

@Composable
private fun NotificationRowCard(
    notif: AppNotification,
    onClick: () -> Unit
) {
    val colors = MaterialTheme.klinUpColors
    val (categoryLabel, accentColor, badgeBg, iconRes) = when (notif.category) {
        NotificationCategory.LATE -> Quadruple(
            "RETARD",
            colors.redText,
            colors.softRedBg,
            R.drawable.ic_tabler_clock_exclamation
        )
        NotificationCategory.VALIDATION -> Quadruple(
            "VALIDATION",
            colors.amberText,
            colors.softAmberBg,
            R.drawable.ic_tabler_clipboard_check
        )
        NotificationCategory.READY -> Quadruple(
            "PRÊTE",
            colors.greenText,
            colors.softGreenBg,
            R.drawable.ic_tabler_circle_check
        )
        NotificationCategory.NEW_ORDER -> Quadruple(
            "COMMANDE",
            colors.brandText,
            colors.softBlueBg,
            R.drawable.ic_tabler_shopping_bag_plus
        )
        NotificationCategory.INFO -> Quadruple(
            "INFO",
            colors.skyText,
            colors.softSkyBg,
            R.drawable.ic_tabler_gift
        )
    }

    val cardBg = if (notif.isRead) colors.cardSubtleBg else colors.cardBg
    val borderColor = if (notif.isRead) colors.border else accentColor.copy(alpha = 0.28f)

    Surface(
        shape = RoundedCornerShape(20.dp),
        color = cardBg,
        border = BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .bouncyClickable(pressedScale = 0.985f, role = Role.Button, onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
                .alpha(if (notif.isRead) 0.76f else 1f)
        ) {
            // Barre verticale d'accentuation pour les notifications non lues
            if (!notif.isRead) {
                Box(
                    modifier = Modifier
                        .padding(start = 5.dp, top = 12.dp, bottom = 12.dp)
                        .width(3.5.dp)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(999.dp))
                        .background(accentColor)
                )
            }

            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(
                        start = if (notif.isRead) 14.dp else 10.dp,
                        end = 14.dp,
                        top = 13.dp,
                        bottom = 13.dp
                    ),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Médaillon icône squircle avec bordure teintée
                Surface(
                    shape = RoundedCornerShape(13.dp),
                    color = badgeBg,
                    border = BorderStroke(1.dp, accentColor.copy(alpha = 0.16f)),
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            painter = painterResource(id = iconRes),
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Ligne supérieure : Catégorie + Pastille non lue + Heure
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = categoryLabel,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 0.6.sp,
                                color = accentColor
                            )
                            if (!notif.isRead) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(accentColor)
                                )
                            }
                        }

                        if (!notif.timestampIso.isNullOrBlank()) {
                            Text(
                                text = KlinUpRepository.formatOrderDate(notif.timestampIso),
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Medium,
                                color = colors.inkMuted
                            )
                        }
                    }

                    // Titre principal
                    Text(
                        text = notif.title,
                        fontSize = 14.sp,
                        fontWeight = if (notif.isRead) FontWeight.SemiBold else FontWeight.Bold,
                        color = colors.inkPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 18.sp
                    )

                    // Corps du message
                    Text(
                        text = notif.message,
                        fontSize = 12.5.sp,
                        lineHeight = 17.sp,
                        color = if (notif.isRead) colors.inkMuted else colors.inkSecondary,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )

                    // Pied de carte discret : statut lu / accès commande
                    if (notif.isRead || !notif.orderId.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (notif.isRead) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(
                                        imageVector = TablerIcons.Checks,
                                        contentDescription = "Lue",
                                        tint = colors.inkMuted,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Text(
                                        text = "Lue",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = colors.inkMuted
                                    )
                                }
                            } else {
                                Spacer(modifier = Modifier.width(1.dp))
                            }

                            if (!notif.orderId.isNullOrBlank()) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                                ) {
                                    Text(
                                        text = "Voir la commande",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (notif.isRead) colors.inkMuted else accentColor
                                    )
                                    Icon(
                                        imageVector = TablerIcons.ChevronRight,
                                        contentDescription = null,
                                        tint = if (notif.isRead) colors.inkMuted else accentColor,
                                        modifier = Modifier.size(14.dp)
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

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
