package com.klinup.app.data.location

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.klinup.app.MainActivity
import com.klinup.app.R
import com.klinup.app.data.repository.KlinUpRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

class DeliveryTrackingService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var fusedClient: FusedLocationProviderClient
    private var locationCallback: LocationCallback? = null

    override fun onCreate() {
        super.onCreate()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)
        ensureChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_ALL -> {
                activeOrderMissions.clear()
                stopLocationUpdates()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_REMOVE_MISSION -> {
                val orderId = intent.getStringExtra(EXTRA_ORDER_ID)
                if (!orderId.isNullOrBlank()) {
                    activeOrderMissions.remove(orderId)
                }
                if (activeOrderMissions.isEmpty()) {
                    stopLocationUpdates()
                    stopSelf()
                    return START_NOT_STICKY
                }
            }
            ACTION_ADD_MISSION -> {
                val orderId = intent.getStringExtra(EXTRA_ORDER_ID).orEmpty()
                val missionType = intent.getStringExtra(EXTRA_MISSION_TYPE).orEmpty()
                if (orderId.isNotBlank() && missionType.isNotBlank()) {
                    activeOrderMissions[orderId] = missionType
                }
            }
        }

        if (activeOrderMissions.isEmpty() || !hasLocationPermission(this)) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForegroundSafely()
        startLocationUpdates()
        return START_STICKY
    }

    private fun startForegroundSafely() {
        val notification = buildNotification(activeOrderMissions.size)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (!hasLocationPermission(this)) return
        if (locationCallback != null) {
            // Déjà actif : mettre à jour la notification et pousser la dernière position connue
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.notify(NOTIFICATION_ID, buildNotification(activeOrderMissions.size))
            fusedClient.lastLocation.addOnSuccessListener { loc ->
                if (loc != null) pushLocation(loc.latitude, loc.longitude, loc.bearing.toDouble(), loc.speed.toDouble())
            }
            return
        }

        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000L)
            .setMinUpdateIntervalMillis(1000L)
            .setMinUpdateDistanceMeters(1f)
            .build()

        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val loc = result.lastLocation ?: return
                pushLocation(
                    lat = loc.latitude,
                    lng = loc.longitude,
                    heading = loc.bearing.toDouble(),
                    speed = (loc.speed * 3.6) // m/s -> km/h
                )
            }
        }
        locationCallback = callback
        fusedClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        fusedClient.lastLocation.addOnSuccessListener { loc ->
            if (loc != null) {
                pushLocation(loc.latitude, loc.longitude, loc.bearing.toDouble(), (loc.speed * 3.6))
            }
        }
    }

    private fun pushLocation(lat: Double, lng: Double, heading: Double, speed: Double) {
        val missionsSnapshot = activeOrderMissions.toMap()
        if (missionsSnapshot.isEmpty()) return
        serviceScope.launch {
            missionsSnapshot.forEach { (orderId, _) ->
                KlinUpRepository.pushLiveLocation(orderId, lat, lng, heading, speed)
            }
        }
    }

    private fun stopLocationUpdates() {
        locationCallback?.let { fusedClient.removeLocationUpdates(it) }
        locationCallback = null
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            runCatching { nm.deleteNotificationChannel("klinup_live_tracking") }
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Suivi de course en direct",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description = "Partage GPS silencieux pendant les dépôts et livraisons KLIN UP"
                setShowBadge(false)
                setSound(null, null)
                enableVibration(false)
                lockscreenVisibility = Notification.VISIBILITY_SECRET
            }
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(missionCount: Int): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingOpen = PendingIntent.getActivity(
            this,
            101,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val text = if (missionCount <= 1) {
            "Position GPS partagée en direct avec la laverie"
        } else {
            "$missionCount courses suivies en direct"
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification_klinup)
            .setContentTitle("KLIN UP • Suivi GPS actif")
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_DEFERRED)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingOpen)
            .build()
    }

    override fun onDestroy() {
        stopLocationUpdates()
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val CHANNEL_ID = "klinup_live_tracking_silent_v2"
        private const val NOTIFICATION_ID = 4201
        private const val ACTION_ADD_MISSION = "com.klinup.app.tracking.ADD"
        private const val ACTION_REMOVE_MISSION = "com.klinup.app.tracking.REMOVE"
        private const val ACTION_STOP_ALL = "com.klinup.app.tracking.STOP_ALL"
        private const val EXTRA_ORDER_ID = "extra_order_id"
        private const val EXTRA_MISSION_TYPE = "extra_mission_type"

        val activeOrderMissions = ConcurrentHashMap<String, String>()

        fun hasLocationPermission(context: Context): Boolean {
            val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            return fine || coarse
        }

        fun isTracking(orderId: String): Boolean = activeOrderMissions.containsKey(orderId)

        fun startMission(context: Context, orderId: String, missionType: String) {
            if (!hasLocationPermission(context)) return
            activeOrderMissions[orderId] = missionType
            val intent = Intent(context, DeliveryTrackingService::class.java).apply {
                action = ACTION_ADD_MISSION
                putExtra(EXTRA_ORDER_ID, orderId)
                putExtra(EXTRA_MISSION_TYPE, missionType)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stopMission(context: Context, orderId: String) {
            activeOrderMissions.remove(orderId)
            val intent = Intent(context, DeliveryTrackingService::class.java).apply {
                action = ACTION_REMOVE_MISSION
                putExtra(EXTRA_ORDER_ID, orderId)
            }
            if (activeOrderMissions.isEmpty()) {
                context.stopService(Intent(context, DeliveryTrackingService::class.java))
            } else {
                ContextCompat.startForegroundService(context, intent)
            }
        }

        fun stopAll(context: Context) {
            activeOrderMissions.clear()
            context.stopService(Intent(context, DeliveryTrackingService::class.java))
        }
    }
}
