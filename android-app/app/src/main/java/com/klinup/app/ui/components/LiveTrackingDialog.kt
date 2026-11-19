package com.klinup.app.ui.components

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.ChatBubbleOutline
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Directions
import androidx.compose.material.icons.rounded.Event
import androidx.compose.material.icons.rounded.Layers
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.MyLocation
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Remove
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material.icons.rounded.TwoWheeler
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.material3.HorizontalDivider
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt
import com.klinup.app.data.local.AppPreferences
import com.klinup.app.data.local.NetworkMonitor
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

private val GPS_TAG_REGEX = Regex("\\s*\\[GPS:[^\\]]+\\]")

data class LiveTrackingRequest(
    val initialOrderId: String?,
    val onDismiss: () -> Unit
)

object LiveTrackingHost {
    private val _activeRequest = MutableStateFlow<LiveTrackingRequest?>(null)
    val activeRequest: StateFlow<LiveTrackingRequest?> = _activeRequest.asStateFlow()

    fun open(initialOrderId: String?, onDismiss: () -> Unit) {
        _activeRequest.value = LiveTrackingRequest(initialOrderId, onDismiss)
    }

    fun close() {
        _activeRequest.value = null
    }
}

@Composable
fun LiveTrackingDialog(
    initialOrderId: String? = null,
    onDismiss: () -> Unit
) {
    DisposableEffect(initialOrderId) {
        LiveTrackingHost.open(initialOrderId, onDismiss)
        onDispose {
            LiveTrackingHost.close()
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LiveTrackingOverlay(
    initialOrderId: String? = null,
    onDismiss: () -> Unit
) {
    BackHandler(onBack = onDismiss)
    val colors = MaterialTheme.klinUpColors
    val sessions by KlinUpRepository.trackingSessions.collectAsState()
    val trackingTrails by KlinUpRepository.trackingTrails.collectAsState()
    val orders by KlinUpRepository.orders.collectAsState()
    val customers by KlinUpRepository.customers.collectAsState()
    val stores by KlinUpRepository.stores.collectAsState()
    val currentUser by KlinUpRepository.currentUser.collectAsState()
    val avatarVersion by AppPreferences.avatarVersion.collectAsState()
    val scope = rememberCoroutineScope()

    var selectedOrderId by remember(initialOrderId) { mutableStateOf(initialOrderId) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var mapReady by remember { mutableStateOf(false) }
    var mapLayer by remember { mutableStateOf("m") } // m = Plan, y = Satellite, p = Relief
    var showLayerMenu by remember { mutableStateOf(false) }
    var isRoutingLoading by remember { mutableStateOf(false) }
    var isCompletingDelivery by remember { mutableStateOf(false) }
    var showPaymentSettlement by remember { mutableStateOf(false) }
    var isSettlingPayment by remember { mutableStateOf(false) }
    val isLivreur = currentUser?.role?.trim()?.equals("livreur", ignoreCase = true) == true
    val context = androidx.compose.ui.platform.LocalContext.current
    val driverIconDataUri = remember {
        runCatching {
            val bytes = context.assets.open("livreur_pin.png").use { it.readBytes() }
            "data:image/png;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        }.getOrNull()
    }

    LaunchedEffect(sessions) {
        if (selectedOrderId == null || sessions.none { it.orderId == selectedOrderId }) {
            selectedOrderId = sessions.firstOrNull()?.orderId
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            KlinUpRepository.refreshTrackingSessionsOnly()
            kotlinx.coroutines.delay(2500L)
        }
    }

    fun pushDataToMap(focusOrderId: String?) {
        val wv = webViewRef ?: return
        if (!mapReady) return
        val arr = JSONArray()
        sessions.forEach { s ->
            val orderLabel = orders.firstOrNull { it.id == s.orderId }?.displayNumber ?: "#${s.orderId}"
            arr.put(
                JSONObject().apply {
                    put("orderId", s.orderId)
                    put("orderLabel", orderLabel)
                    put("driverName", s.driverName ?: "Livreur")
                    put("missionType", s.missionType)
                    put("lat", s.latitude ?: JSONObject.NULL)
                    put("lng", s.longitude ?: JSONObject.NULL)
                    put("heading", s.heading ?: 0.0)
                    put("speed", s.speed ?: 0.0)
                    put("destLat", s.destLatitude ?: JSONObject.NULL)
                    put("destLng", s.destLongitude ?: JSONObject.NULL)
                    put("destLabel", s.destLabel ?: "Destination")
                    val trailArr = JSONArray()
                    trackingTrails[s.orderId].orEmpty().forEach { (tLat, tLng) ->
                        trailArr.put(JSONArray().put(tLat).put(tLng))
                    }
                    put("trail", trailArr)
                }
            )
        }
        val focusJson = if (focusOrderId != null) JSONObject.quote(focusOrderId) else "null"
        val iconJson = if (driverIconDataUri != null) JSONObject.quote(driverIconDataUri) else "null"
        wv.evaluateJavascript("window.setDriverIcon(${iconJson}); window.updateTrackingData(${arr}, $focusJson);", null)
    }

    LaunchedEffect(sessions, trackingTrails, selectedOrderId, mapReady) {
        pushDataToMap(selectedOrderId)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.pageBg)
    ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.loadsImagesAutomatically = true
                        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        settings.userAgentString = "KlinUpAndroid/1.0 (https://klinup.app)"
                        webChromeClient = WebChromeClient()
                        webViewClient = object : WebViewClient() {
                            override fun onPageFinished(view: WebView?, url: String?) {
                                mapReady = true
                                pushDataToMap(selectedOrderId)
                            }
                        }
                        loadDataWithBaseURL(
                            "https://klinup.app/",
                            LEAFLET_HTML,
                            "text/html",
                            "UTF-8",
                            null
                        )
                        webViewRef = this
                    }
                }
            )

            val activeSession = sessions.firstOrNull { it.orderId == selectedOrderId } ?: sessions.firstOrNull()
            val activeOrder = (selectedOrderId ?: activeSession?.orderId)?.let { oid ->
                orders.firstOrNull { it.id == oid }
            }
            val activeCustomer = activeOrder?.customerId?.let { cid ->
                customers.firstOrNull { it.id == cid }
            }
            val activeStore = (activeSession?.storeId ?: activeOrder?.storeId)?.let { sid ->
                stores.firstOrNull { it.id == sid || it.code == sid }
            }
            val isDepot = activeSession?.missionType == "depot_laverie"
            val distKm = activeSession?.let { computeSessionDistanceKm(it) }
            val speedKmh = (activeSession?.speed ?: 0.0).roundToInt()

            Column(modifier = Modifier.fillMaxSize()) {
                // Zone supérieure : Carte + Pilule statut gauche + Pilule outils droite + Zoom +/-
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    // Barre supérieure : Pilule statut (gauche) + Pilule unifiée outils (droite)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .statusBarsPadding()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Pilule statut "En route | 6.8 km"
                        Surface(
                            shape = RoundedCornerShape(999.dp),
                            color = colors.cardBg.copy(alpha = 0.96f),
                            border = BorderStroke(1.dp, colors.border),
                            shadowElevation = 4.dp
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(if (activeSession?.latitude != null) Color(0xFF10B981) else Color(0xFFF59E0B))
                                )
                                Text(
                                    text = buildString {
                                        append(if (isDepot) "Vers laverie" else "En route")
                                        if (distKm != null) append("  |  $distKm km")
                                    },
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = colors.inkPrimary,
                                    maxLines = 1
                                )
                            }
                        }

                        // Pilule unifiée droite : Calques + Actualiser + Fermer
                        Column(
                            horizontalAlignment = Alignment.End,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = colors.cardBg.copy(alpha = 0.96f),
                                border = BorderStroke(1.dp, colors.border),
                                shadowElevation = 4.dp
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    IconButton(
                                        modifier = Modifier.size(38.dp),
                                        onClick = { showLayerMenu = !showLayerMenu }
                                    ) {
                                        Icon(Icons.Rounded.Layers, contentDescription = "Type de carte", tint = colors.inkPrimary, modifier = Modifier.size(19.dp))
                                    }
                                    IconButton(
                                        modifier = Modifier.size(38.dp),
                                        onClick = { scope.launch { KlinUpRepository.refreshTrackingSessionsOnly(force = true) } }
                                    ) {
                                        Icon(Icons.Rounded.Refresh, contentDescription = "Actualiser", tint = colors.inkPrimary, modifier = Modifier.size(19.dp))
                                    }
                                    IconButton(
                                        modifier = Modifier.size(38.dp),
                                        onClick = onDismiss
                                    ) {
                                        Icon(Icons.Rounded.Close, contentDescription = "Fermer", tint = colors.inkPrimary, modifier = Modifier.size(19.dp))
                                    }
                                }
                            }

                            if (showLayerMenu) {
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = colors.cardBg.copy(alpha = 0.98f),
                                    border = BorderStroke(1.dp, colors.border),
                                    shadowElevation = 6.dp
                                ) {
                                    Row(
                                        modifier = Modifier.padding(6.dp),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        listOf("m" to "Plan", "y" to "Satellite", "p" to "Relief").forEach { (code, label) ->
                                            val active = mapLayer == code
                                            Surface(
                                                modifier = Modifier.clickable {
                                                    mapLayer = code
                                                    showLayerMenu = false
                                                    webViewRef?.evaluateJavascript("window.setMapLayer('$code');", null)
                                                },
                                                shape = RoundedCornerShape(10.dp),
                                                color = if (active) Color(0xFF2563EB) else Color.Transparent
                                            ) {
                                                Text(
                                                    text = label,
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (active) Color.White else colors.inkPrimary,
                                                    modifier = Modifier.padding(horizontal = 11.dp, vertical = 6.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Outils en bas à droite : Zoom +/- et Recentrer
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(end = 16.dp, bottom = 14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = colors.cardBg.copy(alpha = 0.96f),
                            border = BorderStroke(1.dp, colors.border),
                            shadowElevation = 4.dp
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                IconButton(
                                    modifier = Modifier.size(42.dp),
                                    onClick = { webViewRef?.evaluateJavascript("window.zoomIn();", null) }
                                ) {
                                    Icon(Icons.Rounded.Add, contentDescription = "Zoom avant", tint = colors.inkPrimary, modifier = Modifier.size(19.dp))
                                }
                                Box(
                                    modifier = Modifier
                                        .width(24.dp)
                                        .height(1.dp)
                                        .background(colors.border)
                                )
                                IconButton(
                                    modifier = Modifier.size(42.dp),
                                    onClick = { webViewRef?.evaluateJavascript("window.zoomOut();", null) }
                                ) {
                                    Icon(Icons.Rounded.Remove, contentDescription = "Zoom arrière", tint = colors.inkPrimary, modifier = Modifier.size(19.dp))
                                }
                            }
                        }

                        Surface(
                            modifier = Modifier.size(42.dp),
                            shape = CircleShape,
                            color = colors.cardBg.copy(alpha = 0.96f),
                            border = BorderStroke(1.dp, colors.border),
                            shadowElevation = 4.dp
                        ) {
                            IconButton(onClick = { webViewRef?.evaluateJavascript("window.recenter();", null) }) {
                                Icon(Icons.Rounded.MyLocation, contentDescription = "Recentrer", tint = Color(0xFF2563EB), modifier = Modifier.size(19.dp))
                            }
                        }
                    }
                }

                // Design 1 : Bottom Sheet White (Épuré Clair & Modulaire)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 560.dp),
                    shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                    color = colors.cardBg,
                    border = BorderStroke(1.dp, colors.border),
                    shadowElevation = 16.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(start = 20.dp, end = 20.dp, top = 12.dp, bottom = 20.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Drag Handle (38 x 4, #CBD5E1)
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterHorizontally)
                                .width(38.dp)
                                .height(4.dp)
                                .clip(RoundedCornerShape(99.dp))
                                .background(Color(0xFFCBD5E1))
                        )

                        if (activeSession == null && activeOrder == null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 28.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Aucun livreur n'est actuellement en trajet de dépôt ou de livraison.",
                                    fontSize = 13.sp,
                                    color = colors.inkSecondary
                                )
                            }
                        } else {
                            val ticketLabel = activeOrder?.displayNumber ?: "#${activeSession?.orderId.orEmpty()}"
                            val avgSpeed = if (speedKmh >= 8) speedKmh.toDouble() else 24.0
                            val etaMinutes = distKm?.let { ((it / avgSpeed) * 60.0).roundToInt().coerceAtLeast(2) }
                            val etaClockText = remember(etaMinutes) {
                                if (etaMinutes == null) "En cours"
                                else {
                                    val target = java.time.LocalTime.now().plusMinutes(etaMinutes.toLong())
                                    val fmt = java.time.format.DateTimeFormatter.ofPattern("HH:mm")
                                    target.format(fmt)
                                }
                            }
                            val progressFraction = when {
                                distKm == null -> 0.35f
                                distKm <= 0.3 -> 0.95f
                                distKm >= 10.0 -> 0.2f
                                else -> (1f - (distKm.toFloat() / 10f)).coerceIn(0.22f, 0.92f)
                            }
                            val cleanDestAddress = (activeSession?.destLabel ?: activeCustomer?.adresse ?: activeStore?.nom ?: "Adresse non renseignée")
                                .replace(GPS_TAG_REGEX, "")
                                .trim()
                            val driverName = activeSession?.driverName?.takeIf { it.isNotBlank() } ?: "Livreur KLIN UP"
                            val driverInitials = driverName.split(" ").filter { it.isNotBlank() }.take(2)
                                .joinToString("") { it.first().uppercaseChar().toString() }.ifBlank { "KL" }
                            val itemsCount = activeOrder?.items?.sumOf { it.quantite } ?: 1
                            val phone = activeCustomer?.telephone?.takeIf { it.isNotBlank() }

                            // ETA Hero + Sous-titre
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                Text(
                                    text = if (etaMinutes != null) "$etaMinutes min env." else "En direct",
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Black,
                                    color = colors.inkPrimary
                                )
                                Text(
                                    text = if (isDepot) "Dépôt prévu à $etaClockText" else "Livraison prévue à $etaClockText",
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = colors.inkSecondary
                                )
                            }

                            // Barre de progression (#F1F2F6 / #2563EB)
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(99.dp))
                                    .background(if (colors.isDark) Color(0xFF1F2430) else Color(0xFFF1F2F6))
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(progressFraction)
                                        .height(6.dp)
                                        .clip(RoundedCornerShape(99.dp))
                                        .background(Color(0xFF2563EB))
                                )
                            }

                            // Order Card Light (#F8FAFC, border #E2E8F0, radius 16.dp)
                            Surface(
                                shape = RoundedCornerShape(16.dp),
                                color = if (colors.isDark) colors.pageBg else Color(0xFFF8FAFC),
                                border = BorderStroke(1.dp, colors.border),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "Commande $ticketLabel",
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.inkPrimary
                                    )
                                    Text(
                                        text = if (activeOrder != null) {
                                            "$itemsCount article(s) | ${KlinUpRepository.formatFcfa(activeOrder.prixTotal)}"
                                        } else {
                                            if (isDepot) "Dépôt vers la laverie" else "Livraison à domicile"
                                        },
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = colors.inkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = cleanDestAddress.ifBlank { "Adresse non renseignée" },
                                        fontSize = 12.5.sp,
                                        color = colors.inkSecondary,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Ligne Livreur : Photo de profil (fallback initiales) + Nom + Client
                            val driverUserId = activeSession?.driverId?.takeIf { it.isNotBlank() }
                                ?: currentUser?.id?.takeIf { it.isNotBlank() }
                            LaunchedEffect(driverUserId) {
                                KlinUpRepository.ensureStaffAvatarSynced(driverUserId)
                            }
                            val driverAvatar by produceState<ImageBitmap?>(null, driverUserId, avatarVersion) {
                                value = if (driverUserId.isNullOrBlank()) null else withContext(Dispatchers.IO) {
                                    val f = AppPreferences.avatarFile(driverUserId)
                                    if (f.exists()) {
                                        val opts = BitmapFactory.Options().apply { inSampleSize = 2 }
                                        BitmapFactory.decodeFile(f.absolutePath, opts)?.asImageBitmap()
                                    } else null
                                }
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF1E293B)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (driverAvatar != null) {
                                        Image(
                                            bitmap = driverAvatar!!,
                                            contentDescription = driverName,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Text(
                                            text = driverInitials,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }
                                }
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = driverName,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = colors.inkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "Client : ${activeCustomer?.fullName ?: "Client Passage"}",
                                        fontSize = 12.sp,
                                        color = colors.inkSecondary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Ligne 3 CTAs avec icônes Tabler : Itinéraire (#2563EB) + Appeler (#F1F5F9) + Chat (#ECFDF5)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 2.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    modifier = Modifier
                                        .weight(1.45f)
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable(enabled = !isRoutingLoading) {
                                            isRoutingLoading = true
                                            scope.launch {
                                                val res = KlinUpRepository.refreshTrackingRouteFromDatabase(selectedOrderId)
                                                isRoutingLoading = false
                                                res.onSuccess { session ->
                                                    if (session == null) {
                                                        NetworkMonitor.showToast("Aucune course active trouvée en base de données.")
                                                    } else if (session.latitude == null || session.longitude == null) {
                                                        NetworkMonitor.showToast("Position GPS du livreur en attente.")
                                                        pushDataToMap(session.orderId)
                                                    } else if (session.destLatitude == null || session.destLongitude == null) {
                                                        NetworkMonitor.showToast("Adresse GPS de destination non renseignée.")
                                                        pushDataToMap(session.orderId)
                                                    } else {
                                                        pushDataToMap(session.orderId)
                                                        webViewRef?.evaluateJavascript("window.forceRedrawRoute('${session.orderId}');", null)
                                                    }
                                                }.onFailure { err ->
                                                    NetworkMonitor.showToast(err.message ?: "Impossible de charger l'itinéraire.")
                                                }
                                            }
                                        },
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color(0xFF2563EB)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.Route,
                                            contentDescription = "Itinéraire",
                                            tint = Color.White,
                                            modifier = Modifier.size(17.dp)
                                        )
                                        Text(
                                            text = if (isRoutingLoading) "Calcul..." else "Itinéraire",
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            maxLines = 1
                                        )
                                    }
                                }

                                Surface(
                                    modifier = Modifier
                                        .weight(1.1f)
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable(enabled = phone != null) {
                                            phone?.let { p ->
                                                runCatching {
                                                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$p")))
                                                }
                                            }
                                        },
                                    shape = RoundedCornerShape(14.dp),
                                    color = if (colors.isDark) colors.pageBg else Color(0xFFF1F5F9),
                                    border = BorderStroke(1.dp, colors.border)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize().padding(horizontal = 6.dp),
                                        horizontalArrangement = Arrangement.spacedBy(5.dp, Alignment.CenterHorizontally),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.Phone,
                                            contentDescription = "Appeler",
                                            tint = colors.inkPrimary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "Appeler",
                                            fontSize = 12.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = colors.inkPrimary,
                                            maxLines = 1
                                        )
                                    }
                                }

                                Surface(
                                    modifier = Modifier
                                        .weight(0.95f)
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable(enabled = phone != null) {
                                            phone?.let { p ->
                                                val waPhone = KlinUpRepository.formatPhoneForWhatsApp(
                                                    p,
                                                    activeCustomer?.indicatif ?: "229"
                                                )
                                                runCatching {
                                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$waPhone")))
                                                }
                                            }
                                        },
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color(0xFFECFDF5),
                                    border = BorderStroke(1.dp, Color(0xFFA7F3D0))
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize().padding(horizontal = 6.dp),
                                        horizontalArrangement = Arrangement.spacedBy(5.dp, Alignment.CenterHorizontally),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.MessageCircle,
                                            contentDescription = "Chat",
                                            tint = Color(0xFF065F46),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "Chat",
                                            fontSize = 12.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF065F46),
                                            maxLines = 1
                                        )
                                    }
                                }
                            }

                            // Bouton noir "Terminer" réservé uniquement aux livreurs
                            if (isLivreur && (activeOrder != null || activeSession != null)) {
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable(enabled = !isCompletingDelivery) {
                                            if (isDepot) {
                                                val oid = activeOrder?.id ?: activeSession?.orderId
                                                if (!oid.isNullOrBlank()) {
                                                    isCompletingDelivery = true
                                                    scope.launch {
                                                        KlinUpRepository.stopTrackingMission(oid)
                                                        isCompletingDelivery = false
                                                        NetworkMonitor.showToast("Dépôt à la laverie terminé.")
                                                        onDismiss()
                                                    }
                                                }
                                            } else if (activeOrder != null) {
                                                if (KlinUpRepository.requiresRemainingPayment(activeOrder, "restitue")) {
                                                    showPaymentSettlement = true
                                                } else {
                                                    isCompletingDelivery = true
                                                    scope.launch {
                                                        val res = KlinUpRepository.updateOrderStatus(activeOrder.id, "restitue")
                                                        isCompletingDelivery = false
                                                        if (res.isSuccess) {
                                                            NetworkMonitor.showToast("Livraison terminée avec succès.")
                                                            onDismiss()
                                                        } else {
                                                            NetworkMonitor.showToast(
                                                                res.exceptionOrNull()?.message ?: "Impossible de terminer la livraison."
                                                            )
                                                        }
                                                    }
                                                }
                                            } else if (activeSession != null) {
                                                isCompletingDelivery = true
                                                scope.launch {
                                                    KlinUpRepository.stopTrackingMission(activeSession.orderId)
                                                    isCompletingDelivery = false
                                                    NetworkMonitor.showToast("Livraison terminée.")
                                                    onDismiss()
                                                }
                                            }
                                        },
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color(0xFF0F1115)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = TablerIcons.CircleCheck,
                                            contentDescription = "Terminer",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Text(
                                            text = when {
                                                isCompletingDelivery -> "Finalisation..."
                                                isDepot -> "Terminer le dépôt"
                                                else -> "Terminer la livraison"
                                            },
                                            fontSize = 13.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            maxLines = 1
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (showPaymentSettlement && activeOrder != null) {
                OrderPaymentSettlementDialog(
                    order = activeOrder,
                    targetStatus = "restitue",
                    isSubmitting = isSettlingPayment,
                    onDismiss = { if (!isSettlingPayment) showPaymentSettlement = false },
                    onConfirm = { amountPaid, paymentMethod, momoRef, momoOp ->
                        isSettlingPayment = true
                        scope.launch {
                            val res = KlinUpRepository.deliverOrderWithPayment(
                                order = activeOrder,
                                amountPaid = amountPaid,
                                paymentMethod = paymentMethod,
                                targetStatus = "restitue",
                                momoReference = momoRef,
                                momoOperator = momoOp
                            )
                            isSettlingPayment = false
                            if (res.isSuccess) {
                                showPaymentSettlement = false
                                NetworkMonitor.showToast("Livraison terminée avec succès.")
                                onDismiss()
                            } else {
                                NetworkMonitor.showToast(
                                    res.exceptionOrNull()?.message ?: "Impossible d'enregistrer le règlement."
                                )
                            }
                        }
                    }
                )
            }
    }
}

private fun computeSessionDistanceKm(s: com.klinup.app.data.models.OrderTrackingSession): Double? {
    val lat1 = s.latitude ?: return null
    val lon1 = s.longitude ?: return null
    val lat2 = s.destLatitude ?: return null
    val lon2 = s.destLongitude ?: return null
    val r = 6371.0
    val dLat = Math.toRadians(lat2 - lat1)
    val dLon = Math.toRadians(lon2 - lon1)
    val a = sin(dLat / 2) * sin(dLat / 2) +
        cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return ((r * c) * 10.0).roundToInt() / 10.0
}

private val LEAFLET_HTML = """
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #eef2f6; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([6.3703, 2.3912], 15);
    var tileLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3']
    });
    tileLayer.on('tileerror', function() {
      if (!this._fallbackApplied) {
        this._fallbackApplied = true;
        this.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}');
      }
    });
    tileLayer.addTo(map);
    setTimeout(function() { map.invalidateSize(); }, 300);
    var destGroup = L.layerGroup().addTo(map);
    var routeGroup = L.layerGroup().addTo(map);
    var liveTrailGroup = L.layerGroup().addTo(map);
    var driverMarkers = {};
    var hasCenteredOnce = false;
    var lastFocusedOrderId = null;
    var lastBounds = [];
    var driverIconUrl = null;
    var lastSessions = [];
    var routeCache = {};

    window.setDriverIcon = function(url) {
      driverIconUrl = url;
    };

    window.setMapLayer = function(lyrs) {
      tileLayer._fallbackApplied = false;
      tileLayer.setUrl('https://mt{s}.google.com/vt/lyrs=' + lyrs + '&x={x}&y={y}&z={z}');
    };

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
    window.recenter = function() {
      if (lastBounds.length === 1) map.setView(lastBounds[0], 16, { animate: true });
      else if (lastBounds.length >= 2) map.fitBounds(lastBounds, { padding: [70, 120], maxZoom: 17 });
    };

    function drawRoadRoute(s, color, isFocus, forceFetch) {
      if (s.lat == null || s.lng == null || s.destLat == null || s.destLng == null) return;
      var key = s.orderId + ':' + s.lat.toFixed(4) + ',' + s.lng.toFixed(4) + '->' + s.destLat.toFixed(4) + ',' + s.destLng.toFixed(4);
      if (!forceFetch && routeCache[key]) {
        L.polyline(routeCache[key], {
          color: color,
          weight: isFocus ? 5 : 3,
          opacity: isFocus ? 0.92 : 0.6
        }).addTo(routeGroup);
        return;
      }
      var url = 'https://router.project-osrm.org/route/v1/driving/' + s.lng + ',' + s.lat + ';' + s.destLng + ',' + s.destLat + '?overview=full&geometries=geojson';
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
            var latLngs = data.routes[0].geometry.coordinates.map(function(c) { return [c[1], c[0]]; });
            routeCache[key] = latLngs;
            routeGroup.clearLayers();
            L.polyline(latLngs, {
              color: color,
              weight: isFocus ? 5 : 3,
              opacity: isFocus ? 0.92 : 0.6
            }).addTo(routeGroup);
            if (forceFetch) {
              map.fitBounds(latLngs, { padding: [70, 120], maxZoom: 17 });
            }
          } else {
            L.polyline([[s.lat, s.lng], [s.destLat, s.destLng]], { color: color, weight: 4, dashArray: '8, 8' }).addTo(routeGroup);
          }
        })
        .catch(function() {
          L.polyline([[s.lat, s.lng], [s.destLat, s.destLng]], { color: color, weight: 4, dashArray: '8, 8' }).addTo(routeGroup);
        });
    }

    window.forceRedrawRoute = function(orderId) {
      routeGroup.clearLayers();
      var target = lastSessions.find(function(x) { return x.orderId === orderId; }) || lastSessions[0];
      if (!target) return;
      drawRoadRoute(target, '#1a73e8', true, true);
    };

    window.updateTrackingData = function(sessions, focusOrderId) {
      lastSessions = sessions || [];
      map.invalidateSize();
      destGroup.clearLayers();
      routeGroup.clearLayers();
      liveTrailGroup.clearLayers();
      var activeIds = {};
      var bounds = [];
      lastSessions.forEach(function(s) {
        activeIds[s.orderId] = true;
        var isFocus = focusOrderId && s.orderId === focusOrderId;
        var isDepot = s.missionType === 'depot_laverie';
        var bestRouteColor = '#1a73e8';
        if (s.destLat != null && s.destLng != null) {
          var destIcon = L.divIcon({
            className: 'dest-pin',
            html: '<div style="width:28px;height:28px;border-radius:50%;background:#ea4335;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">' + (isDepot ? 'L' : 'C') + '</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          L.marker([s.destLat, s.destLng], { icon: destIcon })
            .bindPopup('<b>' + s.destLabel + '</b><br/>Commande ' + s.orderLabel)
            .addTo(destGroup);
          if (isFocus || !focusOrderId) bounds.push([s.destLat, s.destLng]);
        }
        if (s.lat != null && s.lng != null) {
          var rot = Number(s.heading || 0);
          var driverHtml = driverIconUrl
            ? '<img src="' + driverIconUrl + '" style="width:46px;height:46px;background:transparent;transform:rotate(' + rot + 'deg);transition:transform 0.5s linear;display:block;" />'
            : '<div style="width:18px;height:18px;border-radius:50%;background:' + bestRouteColor + ';border:3px solid #fff;"></div>';
          var driverIcon = L.divIcon({
            className: 'driver-pin',
            html: driverHtml,
            iconSize: [46, 46],
            iconAnchor: [23, 23]
          });
          if (driverMarkers[s.orderId]) {
            driverMarkers[s.orderId].setLatLng([s.lat, s.lng]);
            driverMarkers[s.orderId].setIcon(driverIcon);
          } else {
            driverMarkers[s.orderId] = L.marker([s.lat, s.lng], { icon: driverIcon, zIndexOffset: 1000 })
              .bindPopup('<b>' + s.driverName + '</b><br/>' + s.orderLabel + ' (' + Math.round(s.speed || 0) + ' km/h)')
              .addTo(map);
          }
          if (isFocus || !focusOrderId) bounds.push([s.lat, s.lng]);

          if (Array.isArray(s.trail) && s.trail.length >= 2 && (isFocus || !focusOrderId)) {
            L.polyline(s.trail, {
              color: '#16a34a',
              weight: 5,
              opacity: 0.95
            }).addTo(liveTrailGroup);
          }

          if (s.destLat != null && s.destLng != null && (isFocus || !focusOrderId)) {
            drawRoadRoute(s, bestRouteColor, isFocus, false);
          }
        }
      });
      Object.keys(driverMarkers).forEach(function(oid) {
        if (!activeIds[oid]) {
          map.removeLayer(driverMarkers[oid]);
          delete driverMarkers[oid];
        }
      });
      lastBounds = bounds;
      var focusChanged = focusOrderId !== lastFocusedOrderId;
      if (bounds.length === 1 && (!hasCenteredOnce || focusChanged)) {
        map.setView(bounds[0], 16);
        hasCenteredOnce = true;
        lastFocusedOrderId = focusOrderId;
      } else if (bounds.length >= 2 && (!hasCenteredOnce || focusChanged)) {
        map.fitBounds(bounds, { padding: [70, 120], maxZoom: 17 });
        hasCenteredOnce = true;
        lastFocusedOrderId = focusOrderId;
      }
    };
  </script>
</body>
</html>
""".trimIndent()
