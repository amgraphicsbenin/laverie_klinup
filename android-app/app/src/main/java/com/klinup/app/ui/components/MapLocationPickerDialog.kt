package com.klinup.app.ui.components

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Fullscreen
import androidx.compose.material.icons.rounded.FullscreenExit
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.klinup.app.data.repository.DeliveryZone
import com.klinup.app.data.repository.KlinUpRepository
import com.klinup.app.ui.theme.klinUpColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

private val BrandBlue: Color     get() = Color(0xFF0D2FE8)
private val CardWhite: Color     @Composable get() = MaterialTheme.klinUpColors.cardBg
private val CardBorder: Color    @Composable get() = MaterialTheme.klinUpColors.border
private val InnerBorder: Color   @Composable get() = MaterialTheme.klinUpColors.innerBorder
private val InkPrimary: Color    @Composable get() = MaterialTheme.klinUpColors.inkPrimary
private val InkSecondary: Color  @Composable get() = MaterialTheme.klinUpColors.inkSecondary
private val InkMuted: Color      @Composable get() = MaterialTheme.klinUpColors.inkMuted

data class MapPickedLocation(
    val latitude: Double,
    val longitude: Double,
    val address: String = "",
    val quartier: String = "",
    val ville: String = ""
)

private data class AddressSuggestion(
    val title: String,
    val subtitle: String,
    val lat: Double,
    val lng: Double,
    val quartier: String = "",
    val ville: String = ""
)

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MapLocationPickerDialog(
    initialLat: Double = 6.3703,
    initialLng: Double = 2.3912,
    storeLat: Double = 6.3703,
    storeLng: Double = 2.3912,
    storeName: String = "Point de Laverie",
    onDismiss: () -> Unit,
    onLocationConfirmed: (MapPickedLocation) -> Unit
) {
    val deliveryZones by KlinUpRepository.deliveryZones.collectAsState()
    val scope = rememberCoroutineScope()
    val keyboardController = LocalSoftwareKeyboardController.current

    var selectedLat by remember { mutableDoubleStateOf(initialLat) }
    var selectedLng by remember { mutableDoubleStateOf(initialLng) }
    var pickedAddress by remember { mutableStateOf("") }
    var pickedQuartier by remember { mutableStateOf("") }
    var pickedVille by remember { mutableStateOf("") }
    var searchQuery by remember { mutableStateOf("") }
    var isMapReady by remember { mutableStateOf(false) }
    var mapError by remember { mutableStateOf<String?>(null) }
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var isFullScreen by remember { mutableStateOf(false) }

    BackHandler(enabled = isFullScreen) {
        isFullScreen = false
    }

    LaunchedEffect(isFullScreen, isMapReady) {
        if (isMapReady) {
            delay(100L)
            webViewRef?.evaluateJavascript(
                "if (window.invalidateMapSize) window.invalidateMapSize();",
                null
            )
        }
    }

    var suggestions by remember { mutableStateOf<List<AddressSuggestion>>(emptyList()) }
    var isSearchingSuggestions by remember { mutableStateOf(false) }
    var showSuggestions by remember { mutableStateOf(false) }
    var hasCompletedSearch by remember { mutableStateOf(false) }
    var skipNextAutocomplete by remember { mutableStateOf(false) }

    val selectSuggestion: (AddressSuggestion) -> Unit = { item ->
        skipNextAutocomplete = true
        searchQuery = item.title
        showSuggestions = false
        suggestions = emptyList()
        keyboardController?.hide()
        selectedLat = item.lat
        selectedLng = item.lng
        pickedAddress = item.title
        pickedQuartier = item.quartier
        pickedVille = item.ville
        webViewRef?.evaluateJavascript(
            "if (window.moveToLocation) window.moveToLocation(${item.lat}, ${item.lng}, 16);",
            null
        )
    }

    LaunchedEffect(searchQuery) {
        if (skipNextAutocomplete) {
            skipNextAutocomplete = false
            return@LaunchedEffect
        }
        val q = searchQuery.trim()
        if (q.length < 2) {
            suggestions = emptyList()
            showSuggestions = false
            isSearchingSuggestions = false
            hasCompletedSearch = false
            return@LaunchedEffect
        }
        delay(280L)
        isSearchingSuggestions = true
        showSuggestions = true
        hasCompletedSearch = false
        val results = fetchAddressSuggestions(q, storeLat, storeLng)
        suggestions = results
        isSearchingSuggestions = false
        hasCompletedSearch = true
    }

    val triggerSearch = {
        val q = searchQuery.trim()
        if (q.isNotEmpty()) {
            keyboardController?.hide()
            val first = suggestions.firstOrNull()
            if (first != null) {
                selectSuggestion(first)
            } else {
                scope.launch {
                    isSearchingSuggestions = true
                    showSuggestions = true
                    hasCompletedSearch = false
                    val results = fetchAddressSuggestions(q, storeLat, storeLng)
                    suggestions = results
                    isSearchingSuggestions = false
                    hasCompletedSearch = true
                    results.firstOrNull()?.let { selectSuggestion(it) }
                }
            }
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = if (isFullScreen) {
                Modifier.fillMaxSize()
            } else {
                Modifier
                    .fillMaxWidth(0.95f)
                    .height(620.dp)
            },
            shape = if (isFullScreen) RoundedCornerShape(0.dp) else RoundedCornerShape(26.dp),
            color = CardWhite,
            border = if (isFullScreen) null else BorderStroke(1.dp, CardBorder)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = TablerIcons.MapPin,
                            contentDescription = null,
                            tint = BrandBlue,
                            modifier = Modifier.size(22.dp)
                        )
                        Text(
                            text = "Sélectionner sur la carte",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = TablerIcons.X,
                            contentDescription = "Fermer",
                            tint = InkSecondary
                        )
                    }
                }

                // Search Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp)
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Rechercher un quartier, rue (ex: Tokpa, Akpakpa)...", fontSize = 13.sp, color = InkMuted) },
                        singleLine = true,
                        trailingIcon = if (searchQuery.isNotEmpty()) {
                            {
                                IconButton(onClick = {
                                    searchQuery = ""
                                    suggestions = emptyList()
                                    showSuggestions = false
                                    hasCompletedSearch = false
                                }) {
                                    Icon(
                                        imageVector = TablerIcons.X,
                                        contentDescription = "Effacer",
                                        tint = InkMuted,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        } else null,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { triggerSearch() }),
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = InnerBorder,
                            focusedBorderColor = BrandBlue
                        ),
                        modifier = Modifier.weight(1f)
                    )
                    Surface(
                        onClick = triggerSearch,
                        shape = RoundedCornerShape(14.dp),
                        color = BrandBlue,
                        modifier = Modifier.size(52.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = TablerIcons.Search,
                                contentDescription = "Rechercher",
                                tint = Color.White
                            )
                        }
                    }
                }

                // Leaflet + CARTO WebView Map (same map system as Admin SettingsTab)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = if (isFullScreen) 0.dp else 14.dp)
                        .clip(RoundedCornerShape(if (isFullScreen) 0.dp else 18.dp))
                        .background(MaterialTheme.klinUpColors.altPageBg)
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
                                settings.cacheMode = WebSettings.LOAD_DEFAULT
                                settings.userAgentString = "KlinUpAndroidApp/1.0 (Leaflet Map)"
                                webChromeClient = WebChromeClient()
                                webViewClient = WebViewClient()

                                addJavascriptInterface(
                                    object {
                                        @JavascriptInterface
                                        fun onMapReady() {
                                            post {
                                                isMapReady = true
                                                mapError = null
                                            }
                                        }

                                        @JavascriptInterface
                                        fun onMapError(err: String) {
                                            post {
                                                mapError = err
                                            }
                                        }

                                        @JavascriptInterface
                                        fun onLocationChanged(lat: Double, lng: Double, address: String, quartier: String, ville: String) {
                                            post {
                                                selectedLat = (Math.round(lat * 1_000_000.0) / 1_000_000.0)
                                                selectedLng = (Math.round(lng * 1_000_000.0) / 1_000_000.0)
                                                if (address.isNotBlank()) pickedAddress = address
                                                if (quartier.isNotBlank()) pickedQuartier = quartier
                                                if (ville.isNotBlank()) pickedVille = ville
                                            }
                                        }
                                    },
                                    "AndroidMapBridge"
                                )

                                val html = buildAdminLeafletPickerHtml(
                                    initLat = initialLat,
                                    initLng = initialLng,
                                    storeLat = storeLat,
                                    storeLng = storeLng,
                                    storeName = storeName,
                                    zones = deliveryZones
                                )
                                loadDataWithBaseURL("https://basemaps.cartocdn.com/", html, "text/html", "UTF-8", null)
                                webViewRef = this
                            }
                        }
                    )

                    if (!isMapReady) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(MaterialTheme.klinUpColors.altPageBg.copy(alpha = 0.85f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.padding(16.dp)
                            ) {
                                CircularProgressIndicator(color = BrandBlue, modifier = Modifier.size(30.dp))
                                Text(
                                    text = mapError ?: "Chargement de la carte CARTO / Leaflet…",
                                    fontSize = 12.sp,
                                    color = InkSecondary
                                )
                            }
                        }
                    }

                    // Bouton de bascule plein écran en haut à droite de la carte
                    Surface(
                        onClick = { isFullScreen = !isFullScreen },
                        shape = RoundedCornerShape(10.dp),
                        color = CardWhite.copy(alpha = 0.94f),
                        border = BorderStroke(1.dp, CardBorder),
                        shadowElevation = 4.dp,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(10.dp)
                            .size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (isFullScreen) Icons.Rounded.FullscreenExit else Icons.Rounded.Fullscreen,
                                contentDescription = if (isFullScreen) "Quitter le plein écran" else "Vue plein écran",
                                tint = InkPrimary,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }

                    // Liste dynamique de suggestions d'adresses style Google Maps
                    if (showSuggestions && (isSearchingSuggestions || suggestions.isNotEmpty() || hasCompletedSearch)) {
                        Surface(
                            modifier = Modifier
                                .align(Alignment.TopCenter)
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(16.dp),
                            color = CardWhite,
                            border = BorderStroke(1.dp, CardBorder),
                            shadowElevation = 10.dp
                        ) {
                            Column(modifier = Modifier.fillMaxWidth()) {
                                if (isSearchingSuggestions) {
                                    LinearProgressIndicator(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(2.dp),
                                        color = BrandBlue,
                                        trackColor = MaterialTheme.klinUpColors.softBlueBg
                                    )
                                }
                                if (suggestions.isEmpty() && hasCompletedSearch && !isSearchingSuggestions) {
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
                                            tint = InkMuted,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Text(
                                            text = "Aucune adresse cohérente trouvée pour « ${searchQuery.trim()} »",
                                            fontSize = 12.sp,
                                            color = InkSecondary
                                        )
                                    }
                                } else {
                                    LazyColumn(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .heightIn(max = 225.dp)
                                    ) {
                                        items(suggestions) { item ->
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable { selectSuggestion(item) }
                                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(34.dp)
                                                        .clip(CircleShape)
                                                        .background(MaterialTheme.klinUpColors.softBlueBg),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        imageVector = TablerIcons.MapPin,
                                                        contentDescription = null,
                                                        tint = BrandBlue,
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                }
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = item.title,
                                                        fontSize = 13.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = InkPrimary,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                    if (item.subtitle.isNotBlank()) {
                                                        Text(
                                                            text = item.subtitle,
                                                            fontSize = 11.sp,
                                                            color = InkMuted,
                                                            maxLines = 1,
                                                            overflow = TextOverflow.Ellipsis
                                                        )
                                                    }
                                                }
                                            }
                                            HorizontalDivider(
                                                color = CardBorder.copy(alpha = 0.6f),
                                                thickness = 0.5.dp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Footer Coordinates + Confirm Button
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.klinUpColors.softBlueBg,
                        border = BorderStroke(1.dp, MaterialTheme.klinUpColors.softBlueBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Text(
                                text = "GPS : ${"%.5f".format(selectedLat)}, ${"%.5f".format(selectedLng)}",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.klinUpColors.brandText
                            )
                            val addrPreview = listOfNotNull(
                                pickedAddress.takeIf { it.isNotBlank() },
                                pickedQuartier.takeIf { it.isNotBlank() },
                                pickedVille.takeIf { it.isNotBlank() }
                            ).joinToString(", ")
                            Text(
                                text = if (addrPreview.isNotBlank()) addrPreview else "Touchez la carte ou déplacez le marqueur pour positionner le client.",
                                fontSize = 12.sp,
                                color = InkSecondary,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }

                    Button(
                        onClick = {
                            onLocationConfirmed(
                                MapPickedLocation(
                                    latitude = selectedLat,
                                    longitude = selectedLng,
                                    address = pickedAddress,
                                    quartier = pickedQuartier,
                                    ville = pickedVille
                                )
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandBlue)
                    ) {
                        Icon(
                            imageVector = TablerIcons.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Valider cette position",
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

private fun buildAdminLeafletPickerHtml(
    initLat: Double,
    initLng: Double,
    storeLat: Double,
    storeLng: Double,
    storeName: String,
    zones: List<DeliveryZone>
): String {
    val zonesJson = JSONArray().apply {
        zones.filter { it.isActive }.forEach { z ->
            put(JSONObject().apply {
                put("label_zone", z.labelZone)
                put("max_km", z.maxKm)
                put("frais_livraison", z.fraisLivraison)
            })
        }
    }.toString()
    val escapedStoreName = JSONObject.quote(storeName)

    return """
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #eef2f6; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initLeafletMap() {
              try {
                if (!window.L) {
                  if (window.AndroidMapBridge) window.AndroidMapBridge.onMapError('Impossible de charger Leaflet.');
                  return;
                }
                var L = window.L;
                var map = L.map('map', {
                  center: [$initLat, $initLng],
                  zoom: 13,
                  zoomControl: true
                });

                // Même système CARTO Voyager que l'admin + bascule OpenStreetMap en fallback
                var cartoKey = 'cb1_47to_1_39023a3cae806da7dd06d660';
                var cartoTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=' + cartoKey;
                var tileLayer = L.tileLayer(cartoTileUrl, {
                  maxZoom: 19,
                  subdomains: 'abcd',
                  attribution: '&copy; OpenStreetMap &copy; CARTO'
                });
                tileLayer.on('tileerror', function() {
                  if (!this._hasFallback) {
                    this._hasFallback = true;
                    this.setUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
                  }
                });
                tileLayer.addTo(map);

                // Forcer le recalcul des dimensions après montage
                setTimeout(function() { map.invalidateSize(); }, 250);
                setTimeout(function() { map.invalidateSize(); }, 700);

                // Cercles des zones de livraison autour de la laverie (comme sur l'admin)
                var colors = ['#002cf7', '#f97316', '#a855f7', '#10b981', '#ec4899', '#0284c7'];
                var zones = $zonesJson;
                zones.sort(function(a, b) { return Number(b.max_km) - Number(a.max_km); });
                zones.forEach(function(z, idx) {
                  var color = colors[idx % colors.length];
                  L.circle([$storeLat, $storeLng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.08,
                    weight: 1.5,
                    radius: Number(z.max_km) * 1000
                  }).addTo(map);
                });

                // Marqueur du point de laverie
                L.circleMarker([$storeLat, $storeLng], {
                  radius: 7,
                  color: '#ffffff',
                  weight: 2,
                  fillColor: '#002cf7',
                  fillOpacity: 1
                }).bindTooltip($escapedStoreName).addTo(map);

                // Marqueur client sélectionnable / déplaçable
                var marker = L.marker([$initLat, $initLng], { draggable: true }).addTo(map);

                function reverseGeocode(latVal, lngVal) {
                  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + latVal + '&lon=' + lngVal + '&zoom=18&addressdetails=1')
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                      var addr = data.address || {};
                      var road = [addr.road, addr.house_number].filter(Boolean).join(' ') || (data.name || '');
                      var quartier = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
                      var ville = addr.city || addr.town || addr.village || addr.state || '';
                      if (window.AndroidMapBridge) {
                        window.AndroidMapBridge.onLocationChanged(latVal, lngVal, road, quartier, ville);
                      }
                    })
                    .catch(function() {});
                }

                function setPosition(latVal, lngVal) {
                  marker.setLatLng([latVal, lngVal]);
                  if (window.AndroidMapBridge) {
                    window.AndroidMapBridge.onLocationChanged(latVal, lngVal, '', '', '');
                  }
                  reverseGeocode(latVal, lngVal);
                }

                map.on('click', function(e) {
                  setPosition(e.latlng.lat, e.latlng.lng);
                });

                marker.on('dragend', function() {
                  var pos = marker.getLatLng();
                  setPosition(pos.lat, pos.lng);
                });

                window.invalidateMapSize = function() {
                  map.invalidateSize({ animate: true });
                };

                window.moveToLocation = function(latVal, lngVal, zoomLevel) {
                  map.setView([latVal, lngVal], zoomLevel || 16, { animate: true });
                  marker.setLatLng([latVal, lngVal]);
                };

                window.searchAddress = function(query) {
                  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query))
                    .then(function(res) { return res.json(); })
                    .then(function(items) {
                      if (items && items.length > 0) {
                        var latVal = parseFloat(items[0].lat);
                        var lngVal = parseFloat(items[0].lon);
                        map.setView([latVal, lngVal], 16);
                        setPosition(latVal, lngVal);
                      }
                    });
                };

                if (window.AndroidMapBridge) window.AndroidMapBridge.onMapReady();
              } catch (e) {
                if (window.AndroidMapBridge) window.AndroidMapBridge.onMapError(e.message || 'Erreur carte');
              }
            }

            var s1 = document.createElement('script');
            s1.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s1.onload = initLeafletMap;
            s1.onerror = function() {
              var l2 = document.createElement('link');
              l2.rel = 'stylesheet';
              l2.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
              document.head.appendChild(l2);
              var s2 = document.createElement('script');
              s2.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
              s2.onload = initLeafletMap;
              s2.onerror = function() {
                if (window.AndroidMapBridge) window.AndroidMapBridge.onMapError('Connexion requise pour charger la carte.');
              };
              document.body.appendChild(s2);
            };
            document.body.appendChild(s1);
          </script>
        </body>
        </html>
    """.trimIndent()
}

private suspend fun fetchAddressSuggestions(
    query: String,
    biasLat: Double,
    biasLng: Double
): List<AddressSuggestion> = withContext(Dispatchers.IO) {
    val encoded = URLEncoder.encode(query, "UTF-8")

    // 1. Photon (Komoot OpenStreetMap autocomplete avec biais géographique local)
    val photonResults = runCatching {
        val url = "https://photon.komoot.io/api/?q=$encoded&lat=$biasLat&lon=$biasLng&limit=6&lang=fr"
        val raw = httpGetString(url)
        val root = JSONObject(raw)
        val features = root.optJSONArray("features") ?: JSONArray()
        val list = mutableListOf<AddressSuggestion>()
        for (i in 0 until features.length()) {
            val feat = features.optJSONObject(i) ?: continue
            val geom = feat.optJSONObject("geometry") ?: continue
            val coords = geom.optJSONArray("coordinates") ?: continue
            if (coords.length() < 2) continue
            val lng = coords.optDouble(0, Double.NaN)
            val lat = coords.optDouble(1, Double.NaN)
            if (lat.isNaN() || lng.isNaN()) continue

            val props = feat.optJSONObject("properties") ?: JSONObject()
            val name = props.optString("name").trim()
            val street = props.optString("street").trim()
            val district = props.optString("district").trim()
            val locality = props.optString("locality").trim()
            val city = props.optString("city").trim()
            val state = props.optString("state").trim()
            val country = props.optString("country").trim()

            val title = when {
                name.isNotBlank() -> name
                street.isNotBlank() -> street
                district.isNotBlank() -> district
                city.isNotBlank() -> city
                else -> query
            }
            val subtitleParts = listOf(street, district, locality, city, state, country)
                .filter { it.isNotBlank() && !it.equals(title, ignoreCase = true) }
                .distinct()
            val quartier = district.ifBlank { locality }
            val ville = city.ifBlank { state }

            list.add(
                AddressSuggestion(
                    title = title,
                    subtitle = subtitleParts.joinToString(", "),
                    lat = lat,
                    lng = lng,
                    quartier = quartier,
                    ville = ville
                )
            )
        }
        list.distinctBy { "${it.title.lowercase()}|${it.subtitle.lowercase()}" }
    }.getOrNull().orEmpty()

    if (photonResults.isNotEmpty()) return@withContext photonResults

    // 2. Fallback Nominatim (priorité Bénin puis global)
    val nominatimUrls = listOf(
        "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=bj&accept-language=fr&q=$encoded",
        "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&accept-language=fr&q=$encoded"
    )
    for (url in nominatimUrls) {
        val nomResults = runCatching {
            val raw = httpGetString(url)
            val arr = JSONArray(raw)
            val list = mutableListOf<AddressSuggestion>()
            for (i in 0 until arr.length()) {
                val item = arr.optJSONObject(i) ?: continue
                val lat = item.optString("lat").toDoubleOrNull() ?: continue
                val lng = item.optString("lon").toDoubleOrNull() ?: continue
                val displayName = item.optString("display_name").trim()
                val addr = item.optJSONObject("address") ?: JSONObject()

                val road = addr.optString("road").trim()
                val suburb = addr.optString("suburb")
                    .ifBlank { addr.optString("neighbourhood") }
                    .ifBlank { addr.optString("quarter") }
                    .trim()
                val city = addr.optString("city")
                    .ifBlank { addr.optString("town") }
                    .ifBlank { addr.optString("village") }
                    .ifBlank { addr.optString("state") }
                    .trim()

                val firstSegment = displayName.substringBefore(",").trim()
                val title = firstSegment.ifBlank { road.ifBlank { suburb.ifBlank { city.ifBlank { query } } } }
                val subtitle = displayName.substringAfter(",", "").trim()

                list.add(
                    AddressSuggestion(
                        title = title,
                        subtitle = subtitle,
                        lat = lat,
                        lng = lng,
                        quartier = suburb,
                        ville = city
                    )
                )
            }
            list.distinctBy { "${it.title.lowercase()}|${it.subtitle.lowercase()}" }
        }.getOrNull().orEmpty()

        if (nomResults.isNotEmpty()) return@withContext nomResults
    }

    emptyList()
}

private fun httpGetString(urlString: String): String {
    val conn = (URL(urlString).openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"
        connectTimeout = 5000
        readTimeout = 5000
        setRequestProperty("User-Agent", "KlinUpAndroidApp/1.0")
        setRequestProperty("Accept", "application/json")
    }
    return try {
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        stream?.bufferedReader()?.use { it.readText() } ?: ""
    } finally {
        conn.disconnect()
    }
}
