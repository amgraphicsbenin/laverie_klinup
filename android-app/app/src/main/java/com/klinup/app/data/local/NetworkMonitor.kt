package com.klinup.app.data.local

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ConcurrentHashMap

/**
 * Moniteur temps réel de la connectivité internet de l'appareil
 * et utilitaire centralisé pour les messages d'erreur utilisateur et Toasts hors-ligne.
 */
object NetworkMonitor {
    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    @Volatile
    private var initialized = false

    @Volatile
    private var appContext: Context? = null

    @Volatile
    private var lastToastTimeMs = 0L

    private val validatedNetworks = ConcurrentHashMap<Network, Boolean>()
    private val mainHandler = Handler(Looper.getMainLooper())

    fun init(context: Context) {
        val ctx = context.applicationContext
        appContext = ctx
        if (initialized) {
            recheck()
            return
        }
        synchronized(this) {
            if (initialized) {
                recheck()
                return
            }
            val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return
            _isOnline.value = computeIsOnline(cm)

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            runCatching {
                cm.registerNetworkCallback(
                    request,
                    object : ConnectivityManager.NetworkCallback() {
                        override fun onAvailable(network: Network) {
                            val caps = cm.getNetworkCapabilities(network)
                            val valid = caps != null &&
                                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                            validatedNetworks[network] = valid
                            updateState(cm)
                        }

                        override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                            val valid = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                                networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                            validatedNetworks[network] = valid
                            updateState(cm)
                        }

                        override fun onLost(network: Network) {
                            validatedNetworks.remove(network)
                            updateState(cm, lostNetwork = network)
                        }

                        override fun onUnavailable() {
                            validatedNetworks.clear()
                            _isOnline.value = false
                        }
                    }
                )
            }

            runCatching {
                cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        updateState(cm)
                    }

                    override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                        val valid = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                            networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                        validatedNetworks[network] = valid
                        updateState(cm)
                    }

                    override fun onLost(network: Network) {
                        validatedNetworks.remove(network)
                        updateState(cm, lostNetwork = network)
                    }

                    override fun onUnavailable() {
                        validatedNetworks.clear()
                        _isOnline.value = false
                    }
                })
            }

            initialized = true
        }
    }

    fun recheck(): Boolean {
        val ctx = appContext ?: return _isOnline.value
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return _isOnline.value
        return computeIsOnline(cm).also { _isOnline.value = it }
    }

    fun checkNow(context: Context): Boolean {
        appContext = context.applicationContext
        return recheck()
    }

    fun markOffline() {
        _isOnline.value = false
    }

    fun showToast(message: String) {
        val ctx = appContext ?: return
        val now = System.currentTimeMillis()
        if (now - lastToastTimeMs < 1600L) return
        lastToastTimeMs = now
        mainHandler.post {
            Toast.makeText(ctx, message, Toast.LENGTH_LONG).show()
        }
    }

    private fun updateState(cm: ConnectivityManager, lostNetwork: Network? = null) {
        val active = cm.activeNetwork
        val activeValid = if (active != null && active != lostNetwork) {
            val caps = cm.getNetworkCapabilities(active)
            caps != null &&
                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        } else {
            false
        }
        val anyOtherValid = validatedNetworks.entries.any { (net, valid) ->
            net != lostNetwork && valid
        }
        _isOnline.value = activeValid || anyOtherValid
    }

    private fun computeIsOnline(cm: ConnectivityManager): Boolean {
        val active = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(active) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    fun isNetworkFailure(err: Throwable?): Boolean {
        if (!_isOnline.value) return true
        val causes = generateSequence(err) { it.cause }.take(8).toList()
        val hasNetException = causes.any { t ->
            val cls = t::class.java.name.lowercase()
            t is java.net.UnknownHostException ||
                t is java.net.ConnectException ||
                t is java.net.SocketTimeoutException ||
                t is java.net.SocketException ||
                t is java.net.NoRouteToHostException ||
                t is javax.net.ssl.SSLException ||
                t is java.io.EOFException ||
                t is java.nio.channels.UnresolvedAddressException ||
                cls.contains("timeout") ||
                cls.contains("connect") ||
                cls.contains("socket") ||
                cls.contains("unresolved") ||
                cls.contains("network")
        }
        if (hasNetException) return true
        val combinedRaw = causes.mapNotNull { it.message?.trim() }.joinToString(" | ").lowercase()
        val networkKeywords = listOf(
            "unable to resolve host", "unknownhost", "failed to connect",
            "connection refused", "network is unreachable", "no address associated",
            "software caused connection abort", "broken pipe", "connection reset",
            "timed out", "timeout", "unreachable", "offline"
        )
        return networkKeywords.any { combinedRaw.contains(it) }
    }

    /**
     * Transforme toute erreur technique, réseau ou serveur en message utilisateur clair en français,
     * sans jamais exposer d'URL, de clé API, d'identifiant technique ou de stack trace.
     */
    fun friendlyErrorMessage(
        err: Throwable?,
        actionHint: String? = null,
        fallback: String = "Une erreur est survenue. Veuillez réessayer."
    ): String {
        val offlineMsg = if (!actionHint.isNullOrBlank()) {
            "Connexion internet requise pour $actionHint. Vérifiez votre réseau et réessayez."
        } else {
            "Connexion internet indisponible. Vérifiez votre réseau Wi-Fi ou données mobiles puis réessayez."
        }

        if (isNetworkFailure(err)) {
            if (!recheck()) {
                _isOnline.value = false
            }
            return offlineMsg
        }

        val causes = generateSequence(err) { it.cause }.take(8).toList()
        val combinedRaw = causes.mapNotNull { it.message?.trim() }.filter { it.isNotBlank() }.joinToString(" | ")
        if (combinedRaw.isBlank()) {
            return fallback
        }

        val lower = combinedRaw.lowercase()
        when {
            lower.contains("customers_telephone_key") ||
                lower.contains("duplicate key") ||
                lower.contains("23505") ->
                return "Un client avec ce numéro de téléphone existe déjà."
            lower.contains("foreign key") ||
                lower.contains("23503") ||
                lower.contains("violates") ->
                return "Opération impossible : cet élément est lié à d'autres données."
            lower.contains("jwt") ||
                lower.contains("row-level security") ||
                lower.contains("permission denied") ||
                lower.contains("401") ||
                lower.contains("403") ->
                return "Votre session a expiré ou vous n'avez pas l'autorisation requise."
            lower.contains("500") ||
                lower.contains("502") ||
                lower.contains("503") ||
                lower.contains("504") ||
                lower.contains("internal server error") ->
                return "Le service est momentanément indisponible. Veuillez réessayer dans un instant."
        }

        val technicalMarkers = listOf(
            "http://", "https://", "supabase", "postgrest", "ktor", "github",
            "apikey", "bearer", "token", "secret", "pgrst", "postgres", "sql",
            "exception", "java.", "kotlin.", "io.", "android.", "url=", "headers=",
            "status=", "code=", "host", "socket", "{", "}", "[", "]"
        )
        val hasUuid = Regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", RegexOption.IGNORE_CASE)
            .containsMatchIn(combinedRaw)
        if (hasUuid || technicalMarkers.any { lower.contains(it) }) {
            return fallback
        }

        val firstLine = combinedRaw.lineSequence().firstOrNull()?.trim().orEmpty()
        return if (firstLine.isNotBlank()) firstLine.take(180) else fallback
    }
}
