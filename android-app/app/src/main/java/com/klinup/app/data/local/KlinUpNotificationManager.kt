package com.klinup.app.data.local

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.klinup.app.MainActivity
import com.klinup.app.R
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.Order
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Instant
import java.time.ZoneId

enum class NotificationCategory {
    LATE,
    VALIDATION,
    READY,
    NEW_ORDER,
    INFO
}

data class AppNotification(
    val id: String,
    val orderId: String?,
    val title: String,
    val message: String,
    val category: NotificationCategory,
    val timestampIso: String?,
    val isRead: Boolean
)

/**
 * Gestionnaire complet des notifications KLIN UP :
 * - Canal Android haute priorité (`IMPORTANCE_HIGH`) pour affichage en superposition (heads-up).
 * - Génération des alertes à partir des commandes actives (retards, validations, prêtes, nouvelles).
 * - Suivi persistant des notifications lues / non lues.
 * - Bannière de superposition in-app pour les nouvelles alertes en direct.
 */
object KlinUpNotificationManager {
    const val CHANNEL_ID = "klinup_orders_alerts"
    const val EXTRA_ORDER_ID = "extra_order_id"

    private const val PREFS_NAME = "klinup_notifications_prefs"
    private const val KEY_READ_IDS = "read_notification_ids"
    private const val KEY_DISPATCHED_IDS = "dispatched_system_ids"

    private var appContext: Context? = null
    private var prefs: SharedPreferences? = null

    private val _notifications = MutableStateFlow<List<AppNotification>>(emptyList())
    val notifications: StateFlow<List<AppNotification>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    private val _latestOverlayAlert = MutableStateFlow<AppNotification?>(null)
    val latestOverlayAlert: StateFlow<AppNotification?> = _latestOverlayAlert.asStateFlow()

    private val _pendingNavigationOrderId = MutableStateFlow<String?>(null)
    val pendingNavigationOrderId: StateFlow<String?> = _pendingNavigationOrderId.asStateFlow()

    fun init(context: Context) {
        val ctx = context.applicationContext
        appContext = ctx
        prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        createNotificationChannel(ctx)
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Commandes & Alertes KLIN UP",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alertes en temps réel sur les commandes en retard, prêtes ou à valider."
                enableVibration(true)
                enableLights(true)
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }

    fun handleIncomingOrderIntent(orderId: String?) {
        if (!orderId.isNullOrBlank()) {
            _pendingNavigationOrderId.value = orderId
        }
    }

    fun consumePendingNavigationOrderId() {
        _pendingNavigationOrderId.value = null
    }

    fun dismissOverlayAlert() {
        _latestOverlayAlert.value = null
    }

    fun syncFromOrders(orders: List<Order>, customers: List<Customer>, emitSystemNotifications: Boolean = true) {
        val ctx = appContext
        val customerNames = customers.associateBy({ it.id }, { it.fullName })
        val readIds = prefs?.getStringSet(KEY_READ_IDS, emptySet())?.toSet() ?: emptySet()
        val dispatchedIds = prefs?.getStringSet(KEY_DISPATCHED_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()
        val now = Instant.now()

        val generated = mutableListOf<AppNotification>()
        for (order in orders) {
            if (order.deletedAt != null || order.isCompletedOrCancelled) continue
            val clientName = order.customerId?.let { customerNames[it] } ?: "Client Passage"
            val ticket = order.displayNumber

            val isLate = order.dueDate?.let { due ->
                runCatching { Instant.parse(due).isBefore(now) }.getOrDefault(false)
            } ?: false

            when {
                isLate -> {
                    val id = "late_${order.id}"
                    generated.add(
                        AppNotification(
                            id = id,
                            orderId = order.id,
                            title = "Commande en retard • $ticket",
                            message = "$clientName — Échéance dépassée (${order.typeArticle})",
                            category = NotificationCategory.LATE,
                            timestampIso = order.dueDate ?: order.createdAt,
                            isRead = id in readIds
                        )
                    )
                }
                order.statut == "en_attente_validation" -> {
                    val id = "val_${order.id}"
                    generated.add(
                        AppNotification(
                            id = id,
                            orderId = order.id,
                            title = "Validation requise • $ticket",
                            message = "$clientName — En attente de validation atelier",
                            category = NotificationCategory.VALIDATION,
                            timestampIso = order.createdAt,
                            isRead = id in readIds
                        )
                    )
                }
                order.statut == "pret" -> {
                    val id = "ready_${order.id}"
                    generated.add(
                        AppNotification(
                            id = id,
                            orderId = order.id,
                            title = "Commande prête • $ticket",
                            message = "$clientName — Prête pour restitution ou livraison",
                            category = NotificationCategory.READY,
                            timestampIso = order.createdAt,
                            isRead = id in readIds
                        )
                    )
                }
                order.statut == "en_attente" || order.statut == "attente" -> {
                    val id = "new_${order.id}"
                    generated.add(
                        AppNotification(
                            id = id,
                            orderId = order.id,
                            title = "Nouvelle commande • $ticket",
                            message = "$clientName — ${order.typeArticle} à prendre en charge",
                            category = NotificationCategory.NEW_ORDER,
                            timestampIso = order.createdAt,
                            isRead = id in readIds
                        )
                    )
                }
            }
        }

        val existingRemote = _notifications.value.filter { it.id.startsWith("remote_") }.map { n ->
            n.copy(isRead = n.id in readIds)
        }
        val merged = (generated + existingRemote).distinctBy { it.id }

        val sorted = sortNotifications(merged)

        _notifications.value = sorted
        _unreadCount.value = sorted.count { !it.isRead }

        // Déclenchement des notifications système Android (superposition heads-up) pour les nouvelles alertes
        val newlyTriggered = sorted.filter { !it.isRead && it.id !in dispatchedIds }
        if (emitSystemNotifications && ctx != null && newlyTriggered.isNotEmpty()) {
            // Afficher la plus prioritaire en bannière de superposition in-app
            _latestOverlayAlert.value = newlyTriggered.first()

            if (hasNotificationPermission(ctx)) {
                newlyTriggered.take(3).forEach { notif ->
                    showAndroidSystemNotification(ctx, notif)
                }
            }
            dispatchedIds.addAll(newlyTriggered.map { it.id })
            prefs?.edit()?.putStringSet(KEY_DISPATCHED_IDS, dispatchedIds)?.apply()
        }
    }

    fun mergeRemoteNotifications(
        remoteAlerts: List<AppNotification>,
        emitSystemNotifications: Boolean = true
    ) {
        if (remoteAlerts.isEmpty()) return
        val ctx = appContext
        val readIds = prefs?.getStringSet(KEY_READ_IDS, emptySet()) ?: emptySet()
        val dispatchedIds = prefs?.getStringSet(KEY_DISPATCHED_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()

        val normalizedRemote = remoteAlerts.map { alert ->
            val remoteId = if (alert.id.startsWith("remote_")) alert.id else "remote_${alert.id}"
            alert.copy(id = remoteId, isRead = remoteId in readIds)
        }

        val currentNonRemote = _notifications.value.filterNot { it.id.startsWith("remote_") }
        val merged = (currentNonRemote + normalizedRemote).distinctBy { it.id }
        val sorted = sortNotifications(merged)

        _notifications.value = sorted
        _unreadCount.value = sorted.count { !it.isRead }

        val newlyTriggered = normalizedRemote.filter { !it.isRead && it.id !in dispatchedIds }
        if (emitSystemNotifications && ctx != null && newlyTriggered.isNotEmpty()) {
            _latestOverlayAlert.value = newlyTriggered.first()
            if (hasNotificationPermission(ctx)) {
                newlyTriggered.take(3).forEach { notif ->
                    showAndroidSystemNotification(ctx, notif)
                }
            }
            dispatchedIds.addAll(newlyTriggered.map { it.id })
            prefs?.edit()?.putStringSet(KEY_DISPATCHED_IDS, dispatchedIds)?.apply()
        }
    }

    fun showAndroidSystemNotification(context: Context, notif: AppNotification) {
        if (!hasNotificationPermission(context)) return

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            if (!notif.orderId.isNullOrBlank()) {
                putExtra(EXTRA_ORDER_ID, notif.orderId)
            }
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notif.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_klinup)
            .setColor(0xFF2600F5.toInt())
            .setContentTitle(notif.title)
            .setContentText(notif.message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(notif.message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        runCatching {
            NotificationManagerCompat.from(context).notify(notif.id.hashCode(), builder.build())
        }
    }

    fun markAsRead(notificationId: String) {
        val currentRead = prefs?.getStringSet(KEY_READ_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()
        currentRead.add(notificationId)
        prefs?.edit()?.putStringSet(KEY_READ_IDS, currentRead)?.apply()

        val updated = sortNotifications(
            _notifications.value.map {
                if (it.id == notificationId) it.copy(isRead = true) else it
            }
        )
        _notifications.value = updated
        _unreadCount.value = updated.count { !it.isRead }
        if (_latestOverlayAlert.value?.id == notificationId) {
            _latestOverlayAlert.value = null
        }
    }

    private fun parseTimestampMillis(iso: String?): Long {
        if (iso.isNullOrBlank()) return 0L
        return runCatching { Instant.parse(iso).toEpochMilli() }.getOrElse {
            runCatching {
                java.time.LocalDate.parse(iso.take(10))
                    .atStartOfDay(ZoneId.systemDefault())
                    .toInstant()
                    .toEpochMilli()
            }.getOrDefault(0L)
        }
    }

    private fun sortNotifications(list: List<AppNotification>): List<AppNotification> {
        return list.sortedWith(
            compareBy<AppNotification> { it.isRead }
                .thenByDescending { parseTimestampMillis(it.timestampIso) }
                .thenBy { it.category.ordinal }
        )
    }

    fun markAllAsRead() {
        val currentRead = prefs?.getStringSet(KEY_READ_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()
        currentRead.addAll(_notifications.value.map { it.id })
        prefs?.edit()?.putStringSet(KEY_READ_IDS, currentRead)?.apply()

        _notifications.value = _notifications.value.map { it.copy(isRead = true) }
        _unreadCount.value = 0
        _latestOverlayAlert.value = null
    }
}
