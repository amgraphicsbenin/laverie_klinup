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
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AlarmOff
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.DoneAll
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.ShoppingBasket
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
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

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = colors.cardBg,
        contentColor = colors.inkPrimary,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
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
                .padding(horizontal = 20.dp)
                .padding(bottom = 28.dp)
        ) {
            // ── En-tête du panneau ────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Notifications",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.inkPrimary
                    )
                    if (unreadCount > 0) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(999.dp))
                                .background(colors.brandBlue)
                                .padding(horizontal = 9.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "$unreadCount",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (unreadCount > 0) {
                        TextButton(onClick = onMarkAllRead) {
                            Icon(
                                imageVector = TablerIcons.Checks,
                                contentDescription = null,
                                tint = colors.brandText,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Tout lire",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = colors.brandText
                            )
                        }
                    }
                    IconButton(onClick = onRefresh) {
                        Icon(
                            imageVector = TablerIcons.Refresh,
                            contentDescription = "Actualiser",
                            tint = colors.inkSecondary
                        )
                    }
                }
            }

            if (unreadCount > 0) {
                Text(
                    text = "Glissez une alerte non lue vers la gauche ou la droite pour la marquer comme lue.",
                    fontSize = 11.5.sp,
                    color = colors.inkMuted,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            // ── Bannière d'autorisation Android (si non accordée) ─────────────
            if (!hasSystemPermission) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(26.dp),
                    color = colors.softBlueBg,
                    border = BorderStroke(1.dp, colors.softBlueBorder),
                    modifier = Modifier.fillMaxWidth()
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
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(colors.brandBlue.copy(alpha = 0.14f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = TablerIcons.Bell,
                                contentDescription = null,
                                tint = colors.brandText,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Activer les notifications",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.inkPrimary
                            )
                            Text(
                                text = "Recevez les alertes en superposition Android même hors de l'app.",
                                fontSize = 11.sp,
                                color = colors.inkMuted,
                                lineHeight = 15.sp
                            )
                        }
                        Button(
                            onClick = {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    onRequestPermission()
                                } else {
                                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                                    }
                                    runCatching { context.startActivity(intent) }
                                }
                            },
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(containerColor = colors.brandBlue),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "Autoriser",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ── Liste des notifications ───────────────────────────────────────
            if (notifications.isEmpty()) {
                Surface(
                    shape = RoundedCornerShape(26.dp),
                    color = colors.cardSubtleBg,
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 36.dp, horizontal = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = TablerIcons.BellOff,
                            contentDescription = null,
                            tint = colors.inkMuted,
                            modifier = Modifier.size(34.dp)
                        )
                        Text(
                            text = "Aucune notification",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.inkPrimary
                        )
                        Text(
                            text = "Toutes les commandes et alertes sont à jour.",
                            fontSize = 12.sp,
                            color = colors.inkMuted
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 440.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(notifications, key = { it.id }) { notif ->
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
            // Toujours retourner false pour conserver la notification visible dans la liste
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
                    .clip(RoundedCornerShape(26.dp))
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
            "Retard",
            colors.redText,
            colors.softRedBg,
            R.drawable.ic_tabler_clock_exclamation
        )
        NotificationCategory.VALIDATION -> Quadruple(
            "Validation",
            colors.amberText,
            colors.softAmberBg,
            R.drawable.ic_tabler_clipboard_check
        )
        NotificationCategory.READY -> Quadruple(
            "Prête",
            colors.greenText,
            colors.softGreenBg,
            R.drawable.ic_tabler_circle_check
        )
        NotificationCategory.NEW_ORDER -> Quadruple(
            "Commande",
            colors.brandText,
            colors.softBlueBg,
            R.drawable.ic_tabler_shopping_bag_plus
        )
        NotificationCategory.INFO -> Quadruple(
            "Info",
            colors.skyText,
            colors.softSkyBg,
            R.drawable.ic_tabler_gift
        )
    }

    val cardBg = if (notif.isRead) colors.cardSubtleBg else colors.cardBg
    val borderColor = if (notif.isRead) colors.border else accentColor.copy(alpha = 0.35f)

    Surface(
        shape = RoundedCornerShape(26.dp),
        color = cardBg,
        border = BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(26.dp))
            .bouncyClickable(pressedScale = 0.985f, role = Role.Button, onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .alpha(if (notif.isRead) 0.78f else 1f)
                .padding(14.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(badgeBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painter = painterResource(id = iconRes),
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(22.dp)
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = badgeBg
                        ) {
                            Text(
                                text = categoryLabel,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = accentColor,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                        if (!notif.isRead) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(accentColor)
                            )
                        } else {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp)
                            ) {
                                Icon(
                                    imageVector = TablerIcons.Checks,
                                    contentDescription = "Lue",
                                    tint = colors.inkMuted,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "Lue",
                                    fontSize = 10.sp,
                                    color = colors.inkMuted,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    if (!notif.timestampIso.isNullOrBlank()) {
                        Text(
                            text = KlinUpRepository.formatOrderDate(notif.timestampIso),
                            fontSize = 10.5.sp,
                            color = colors.inkMuted
                        )
                    }
                }

                Text(
                    text = notif.title,
                    fontSize = 13.5.sp,
                    fontWeight = if (notif.isRead) FontWeight.SemiBold else FontWeight.Bold,
                    color = colors.inkPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = notif.message,
                    fontSize = 12.sp,
                    lineHeight = 16.sp,
                    color = if (notif.isRead) colors.inkMuted else colors.inkSecondary,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
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
