package com.klinup.app.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import io.ktor.client.HttpClient
import io.ktor.client.engine.android.Android
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import com.klinup.app.data.local.AppNotification
import com.klinup.app.data.local.KlinUpNotificationManager
import com.klinup.app.data.local.NotificationCategory
import com.klinup.app.data.local.PinVerificationResult
import com.klinup.app.data.local.SecurityManager
import com.klinup.app.data.models.ActiveSubscription
import com.klinup.app.data.models.CatalogItem
import com.klinup.app.data.models.Customer
import com.klinup.app.data.models.Expense
import com.klinup.app.data.models.Order
import com.klinup.app.data.models.OrderItem
import com.klinup.app.data.models.RewardPointAdjustment
import com.klinup.app.data.models.Store
import com.klinup.app.data.models.User
import com.klinup.app.data.remote.SupabaseClientProvider
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order as PostgrestOrder
import io.github.jan.supabase.postgrest.query.filter.FilterOperator
import io.github.jan.supabase.postgrest.rpc
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import java.text.NumberFormat
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.floor

@Serializable
private data class StaffSessionState(
    val id: String = "",
    @SerialName("active_device_id") val activeDeviceId: String? = null,
    @SerialName("active_session_token") val activeSessionToken: String? = null,
    @SerialName("active_device_name") val activeDeviceName: String? = null
)

@Serializable
private data class StaffSessionPatch(
    @SerialName("active_device_id") val activeDeviceId: String? = null,
    @SerialName("active_session_token") val activeSessionToken: String? = null,
    @SerialName("active_device_name") val activeDeviceName: String? = null
)

@Serializable
private data class ExpenseReceiptPatch(
    @SerialName("receipt_url") val receiptUrl: String? = null,
    @SerialName("receipt_name") val receiptName: String? = null,
    @SerialName("receipt_mime_type") val receiptMimeType: String? = null
)

@Serializable
private data class OrderPaymentPatch(
    val statut: String,
    @SerialName("mode_reglement") val modeReglement: String,
    @SerialName("avance_payee") val avancePayee: Double,
    @SerialName("solde_paid_at") val soldePaidAt: String
)

@Serializable
private data class NewCustomerPayload(
    val id: String,
    val nom: String,
    val prenom: String,
    val telephone: String,
    val indicatif: String = "229",
    val adresse: String? = null,
    @SerialName("preferences_pliage") val preferencesPliage: String = "Plié",
    @SerialName("points_fidelite") val pointsFidelite: Int = 0,
    @SerialName("solde_dette") val soldeDette: Double = 0.0,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("created_by_id") val createdById: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
private data class CustomerUpdatePayload(
    val nom: String,
    val prenom: String,
    val telephone: String,
    val indicatif: String = "229",
    val adresse: String? = null,
    @SerialName("preferences_pliage") val preferencesPliage: String = "Plié",
    @SerialName("store_id") val storeId: String? = null
)

@Serializable
private data class CustomerPointsPatch(
    @SerialName("points_fidelite") val pointsFidelite: Int
)

@Serializable
private data class RewardAdjustmentDecisionPatch(
    val status: String,
    @SerialName("validated_by_id") val validatedById: String,
    @SerialName("validated_by_name") val validatedByName: String,
    @SerialName("validated_by_role") val validatedByRole: String,
    @SerialName("validated_at") val validatedAt: String,
    @SerialName("rejection_reason") val rejectionReason: String? = null
)

@Serializable
private data class RewardAdjustmentDecisionLog(
    val id: String,
    val status: String,
    @SerialName("validated_by_id") val validatedById: String? = null,
    @SerialName("validated_by_name") val validatedByName: String? = null,
    @SerialName("validated_by_role") val validatedByRole: String? = null,
    @SerialName("validated_at") val validatedAt: String? = null,
    @SerialName("rejection_reason") val rejectionReason: String? = null
)

@Serializable
private data class ActivityLogRecord(
    val id: String = "",
    @SerialName("user_id") val userId: String? = null,
    @SerialName("user_name") val userName: String? = null,
    val action: String = "",
    val details: String? = null,
    val timestamp: String? = null
)

@Serializable
private data class RemoteOrderNotification(
    val id: String,
    @SerialName("order_id") val orderId: String = "",
    @SerialName("store_id") val storeId: String = "store_central",
    @SerialName("type_action") val typeAction: String = "",
    val titre: String = "",
    val message: String = "",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
private data class CustomerSubscriptionPatch(
    @SerialName("active_subscription") val activeSubscription: ActiveSubscription?
)

@Serializable
private data class CustomerFidelityPatch(
    @SerialName("points_fidelite") val pointsFidelite: Int,
    @SerialName("solde_dette") val soldeDette: Double
)

@Serializable
private data class NewOrderPayload(
    val id: String,
    @SerialName("customer_id") val customerId: String,
    val statut: String = "en_attente",
    @SerialName("type_article") val typeArticle: String,
    @SerialName("type_service") val typeService: String,
    @SerialName("niveau_urgence") val niveauUrgence: String = "Normal",
    @SerialName("mode_reglement") val modeReglement: String = "especes",
    @SerialName("avance_payee") val avancePayee: Double = 0.0,
    @SerialName("prix_total") val prixTotal: Double = 0.0,
    @SerialName("identifiant_unique_marquage") val identifiantUniqueMarquage: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("due_date") val dueDate: String,
    val items: List<OrderItem>,
    @SerialName("is_subscription_order") val isSubscriptionOrder: Boolean = false,
    @SerialName("created_by_id") val createdById: String? = null,
    @SerialName("created_by_name") val createdByName: String? = null,
    @SerialName("store_id") val storeId: String? = null
)

@Serializable
private data class OrderStatusPatch(
    val statut: String
)

@Serializable
private data class SettingCatalogUpsert(
    val id: String,
    val article: String,
    val service: String = "system",
    val prix: Double,
    val categorie: String = "system"
)

@Serializable
private data class SecurityAuditLogPayload(
    val id: String = "log_${System.currentTimeMillis()}_${(100..999).random()}",
    @SerialName("user_id") val userId: String? = null,
    @SerialName("user_name") val userName: String? = null,
    val action: String,
    val details: String,
    val timestamp: String = Instant.now().toString()
)

data class AdminSettings(
    val normalHours: Int = 48,
    val expressHours: Int = 6,
    val expressMarkup: Int = 50,
    val fidelityActive: Boolean = true,
    val fidelitySpendPerPoint: Int = 1000,
    val bronzeMaxPts: Int = 49,
    val silverPts: Int = 50,
    val goldPts: Int = 150,
    val platinumPts: Int = 300
)

data class FidelityInfo(
    val tierName: String,
    val progress: Float,
    val nextTierName: String? = null,
    val pointsRemaining: Int = 0,
    val progressPercent: Int = 0,
    val benefits: List<String> = emptyList()
)

data class RewardCatalogItem(
    val id: String,
    val title: String,
    val cost: Int,
    val discountAmount: Int,
    val iconName: String,
    val description: String
)

@Serializable
data class DeliveryZone(
    val id: String,
    @SerialName("store_id") val storeId: String? = null,
    @SerialName("label_zone") val labelZone: String = "",
    @SerialName("min_km") val minKm: Double = 0.0,
    @SerialName("max_km") val maxKm: Double = 3.0,
    @SerialName("frais_livraison") val fraisLivraison: Double = 1000.0,
    @SerialName("is_active") val isActive: Boolean = true
)

data class ZoneFeeResult(
    val fee: Double,
    val distanceKm: Double,
    val zoneLabel: String
)

object KlinUpRepository {
    private val client get() = SupabaseClientProvider.client

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _staffList = MutableStateFlow<List<User>>(emptyList())
    val staffList: StateFlow<List<User>> = _staffList.asStateFlow()

    private val _stores = MutableStateFlow<List<Store>>(emptyList())
    val stores: StateFlow<List<Store>> = _stores.asStateFlow()

    private val _selectedStoreId = MutableStateFlow("all")
    val selectedStoreId: StateFlow<String> = _selectedStoreId.asStateFlow()

    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders: StateFlow<List<Order>> = _orders.asStateFlow()

    private val _customers = MutableStateFlow<List<Customer>>(emptyList())
    val customers: StateFlow<List<Customer>> = _customers.asStateFlow()

    private val _catalog = MutableStateFlow<List<CatalogItem>>(emptyList())
    val catalog: StateFlow<List<CatalogItem>> = _catalog.asStateFlow()

    private val _deliveryZones = MutableStateFlow<List<DeliveryZone>>(emptyList())
    val deliveryZones: StateFlow<List<DeliveryZone>> = _deliveryZones.asStateFlow()

    private val _pickupZones = MutableStateFlow<List<DeliveryZone>>(emptyList())
    val pickupZones: StateFlow<List<DeliveryZone>> = _pickupZones.asStateFlow()

    private val _rewardAdjustments = MutableStateFlow<List<RewardPointAdjustment>>(emptyList())
    val rewardAdjustments: StateFlow<List<RewardPointAdjustment>> = _rewardAdjustments.asStateFlow()

    private val _expenses = MutableStateFlow<List<Expense>>(emptyList())
    val expenses: StateFlow<List<Expense>> = _expenses.asStateFlow()

    private val _deliveryOrderIds = MutableStateFlow<Set<String>>(emptySet())
    fun hasDeliveryOption(order: Order): Boolean {
        return order.livraisonDomicile ||
            order.fraisLivraison > 0.0 ||
            _deliveryOrderIds.value.contains(order.id)
    }

    private val defaultZones = listOf(
        DeliveryZone(id = "zone_proche", labelZone = "Zone Proche (0 - 3 km)", minKm = 0.0, maxKm = 3.0, fraisLivraison = 500.0),
        DeliveryZone(id = "zone_moyenne", labelZone = "Zone Intermédiaire (3 - 7 km)", minKm = 3.0, maxKm = 7.0, fraisLivraison = 1000.0),
        DeliveryZone(id = "zone_elargie", labelZone = "Zone Élargie (7 - 15 km)", minKm = 7.0, maxKm = 15.0, fraisLivraison = 2000.0),
        DeliveryZone(id = "zone_lointaine", labelZone = "Zone Éloignée (15 - 30 km)", minKm = 15.0, maxKm = 30.0, fraisLivraison = 3500.0)
    )

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _multiDeviceLogoutNotice = MutableStateFlow<String?>(null)
    val multiDeviceLogoutNotice: StateFlow<String?> = _multiDeviceLogoutNotice.asStateFlow()

    fun clearMultiDeviceLogoutNotice() {
        _multiDeviceLogoutNotice.value = null
    }

    private var sessionWatcherJob: Job? = null
    @Volatile private var activeLocalSessionToken: String? = null

    private val backgroundScope = kotlinx.coroutines.CoroutineScope(
        kotlinx.coroutines.SupervisorJob() + kotlinx.coroutines.Dispatchers.IO
    )

    private fun startMultiDeviceSessionWatcher(user: User, token: String, registerOnServer: Boolean) {
        sessionWatcherJob?.cancel()
        activeLocalSessionToken = token
        val deviceId = SecurityManager.getOrCreateDeviceId()
        val deviceName = SecurityManager.getDeviceName()
        val deviceModel = SecurityManager.getDeviceModel()
        val androidVersion = SecurityManager.getAndroidVersion()
        val appVersion = SecurityManager.getAppVersion()

        sessionWatcherJob = backgroundScope.launch {
            if (registerOnServer) {
                val extendedRpcOk = runCatching {
                    client.postgrest.rpc(
                        function = "register_active_device_session",
                        parameters = buildJsonObject {
                            put("p_staff_id", user.id)
                            put("p_device_id", deviceId)
                            put("p_session_token", token)
                            put("p_device_name", deviceName)
                            put("p_device_model", deviceModel)
                            put("p_android_version", androidVersion)
                            put("p_app_version", appVersion)
                        }
                    )
                }.isSuccess

                val rpcOk = extendedRpcOk || runCatching {
                    client.postgrest.rpc(
                        function = "register_active_device_session",
                        parameters = buildJsonObject {
                            put("p_staff_id", user.id)
                            put("p_device_id", deviceId)
                            put("p_session_token", token)
                            put("p_device_name", deviceName)
                        }
                    )
                }.isSuccess

                if (!rpcOk) {
                    runCatching {
                        client.from("staff").update(
                            StaffSessionPatch(
                                activeDeviceId = deviceId,
                                activeSessionToken = token,
                                activeDeviceName = deviceName
                            )
                        ) {
                            filter { eq("id", user.id) }
                        }
                    }
                }

                logSecurityEvent(
                    user,
                    "DEVICE_SESSION",
                    "Appareil: $deviceName | Modèle: $deviceModel | Android: $androidVersion | App: $appVersion | ID: $deviceId"
                )
            }

            // Couche 1 : écoute temps réel WebSocket sur la ligne `staff` de l'utilisateur
            launch {
                runCatching {
                    val channel = client.realtime.channel("staff_session_${user.id}_${System.currentTimeMillis()}")
                    val changes = channel.postgresChangeFlow<PostgresAction.Update>(schema = "public") {
                        table = "staff"
                        filter("id", FilterOperator.EQ, user.id)
                    }
                    channel.subscribe()
                    changes.collect { action ->
                        val remoteToken = action.record["active_session_token"]?.jsonPrimitive?.content
                        val remoteDeviceId = action.record["active_device_id"]?.jsonPrimitive?.content
                        val remoteDeviceName = action.record["active_device_name"]?.jsonPrimitive?.content
                        val isTakenOver = !remoteToken.isNullOrBlank() &&
                            remoteToken != activeLocalSessionToken &&
                            (remoteDeviceId.isNullOrBlank() || remoteDeviceId != deviceId)
                        if (isTakenOver) {
                            forceLogoutFromRemoteDevice(user, remoteDeviceName)
                        }
                    }
                }
            }

            // Couche 2 : vérification périodique de secours (8s) si la socket Realtime est coupée
            while (activeLocalSessionToken == token && _currentUser.value?.id == user.id) {
                kotlinx.coroutines.delay(8_000L)
                if (activeLocalSessionToken != token || _currentUser.value?.id != user.id) break
                val state = runCatching {
                    client.from("staff")
                        .select(Columns.list("id", "active_device_id", "active_session_token", "active_device_name")) {
                            filter { eq("id", user.id) }
                            limit(1)
                        }
                        .decodeSingleOrNull<StaffSessionState>()
                }.getOrNull()

                if (state != null) {
                    val remoteToken = state.activeSessionToken
                    val isTakenOver = !remoteToken.isNullOrBlank() &&
                        remoteToken != activeLocalSessionToken &&
                        (state.activeDeviceId.isNullOrBlank() || state.activeDeviceId != deviceId)
                    if (isTakenOver) {
                        forceLogoutFromRemoteDevice(user, state.activeDeviceName)
                        break
                    }
                }
            }
        }
    }

    private fun forceLogoutFromRemoteDevice(user: User, remoteDeviceName: String?) {
        if (activeLocalSessionToken == null) return
        activeLocalSessionToken = null
        sessionWatcherJob?.cancel()
        sessionWatcherJob = null
        val deviceSuffix = remoteDeviceName?.takeIf { it.isNotBlank() }?.let { " ($it)" }.orEmpty()
        _multiDeviceLogoutNotice.value =
            "Votre compte vient d'être connecté sur un autre appareil$deviceSuffix. Vous avez été déconnecté de cet appareil."
        logSecurityEvent(
            user,
            "MULTI_DEVICE_LOGOUT",
            "Session fermée automatiquement : nouvelle connexion détectée sur un autre appareil$deviceSuffix"
        )
        SecurityManager.clearSession()
        _currentUser.value = null
        _orders.value = emptyList()
        _customers.value = emptyList()
        _catalog.value = emptyList()
        _expenses.value = emptyList()
        _rewardAdjustments.value = emptyList()
        _selectedStoreId.value = "all"
        _errorMessage.value = null
    }

    private fun requireAuthenticatedUser(): User {
        val u = _currentUser.value
        if (u == null || SecurityManager.isSessionLocked.value) {
            throw SecurityException("Session expirée ou verrouillée. Veuillez vous reconnecter.")
        }
        return u
    }

    private fun logSecurityEvent(user: User?, action: String, details: String) {
        backgroundScope.launch {
            runCatching {
                client.from("activity_logs").insert(
                    SecurityAuditLogPayload(
                        userId = user?.id,
                        userName = user?.fullName,
                        action = action,
                        details = details
                    )
                )
            }
        }
    }

    /**
     * Restaure une session chiffrée valide au lancement de l'application si elle n'a pas expiré
     * et n'est pas verrouillée par inactivité.
     */
    fun restoreSessionIfAvailable(): Boolean {
        val (savedUser, isLocked) = SecurityManager.restoreSessionOnLaunch()
        if (savedUser != null && !isLocked) {
            val cleanUser = savedUser.copy(codePin = null)
            _currentUser.value = cleanUser
            _selectedStoreId.value = cleanUser.storeId?.takeIf { it.isNotBlank() && it != "GLOBAL" } ?: "all"
            val savedToken = SecurityManager.getSessionToken()
            if (!savedToken.isNullOrBlank()) {
                startMultiDeviceSessionWatcher(cleanUser, savedToken, registerOnServer = false)
            }
            backgroundScope.launch { refreshAll() }
            return true
        }
        if (isLocked) {
            _currentUser.value = null
        }
        return false
    }

    /**
     * Verrouille immédiatement la session active et exige la saisie du code PIN à 6 chiffres.
     */
    fun lockCurrentSession() {
        val active = _currentUser.value
        SecurityManager.lockSession(active)
        if (active != null) {
            logSecurityEvent(active, "SESSION_LOCKED", "Session mobile verrouillée (${active.fullName})")
        }
        _currentUser.value = null
    }

    suspend fun unlockWithBiometric(): Result<User> {
        val unlocked = SecurityManager.unlockSessionWithBiometric()
            ?: return Result.failure(IllegalStateException("Impossible de déverrouiller la session par biométrie."))
        _currentUser.value = unlocked
        _multiDeviceLogoutNotice.value = null
        val newToken = java.util.UUID.randomUUID().toString()
        SecurityManager.saveSessionToken(newToken)
        startMultiDeviceSessionWatcher(unlocked, newToken, registerOnServer = true)
        val methodLabel = when {
            SecurityManager.biometricEnabled.value && SecurityManager.faceUnlockEnabled.value ->
                "empreinte / reconnaissance faciale"
            SecurityManager.faceUnlockEnabled.value -> "reconnaissance faciale"
            else -> "empreinte digitale"
        }
        logSecurityEvent(unlocked, "BIOMETRIC_UNLOCK", "Déverrouillage par $methodLabel (${unlocked.fullName})")
        if (_orders.value.isEmpty() || _customers.value.isEmpty() || _catalog.value.isEmpty()) {
            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                refreshAll()
            }
        }
        return Result.success(unlocked)
    }

    /**
     * Recherche ciblée d'un compte employé par email (Zéro téléchargement massif de la table `staff`
     * et purge immédiate de `codePin` dans l'objet retourné à l'UI).
     */
    suspend fun lookupStaffByEmail(email: String): Result<User> {
        val cleanEmail = email.trim().lowercase()
        if (cleanEmail.isEmpty() || !cleanEmail.contains("@") || cleanEmail.length > 120) {
            return Result.failure(IllegalArgumentException("Veuillez saisir une adresse email valide."))
        }
        return runCatching {
            // 1. Priorité à la RPC SECURITY DEFINER (ne retourne jamais code_pin)
            val viaRpc = runCatching {
                client.postgrest.rpc(
                    function = "lookup_staff_login",
                    parameters = buildJsonObject { put("p_email", cleanEmail) }
                ).decodeList<User>().firstOrNull()
            }.getOrNull()

            val matched = viaRpc ?: client.from("staff")
                .select {
                    filter {
                        ilike("email", cleanEmail)
                    }
                }
                .decodeList<User>()
                .firstOrNull {
                    it.email?.trim()?.equals(cleanEmail, ignoreCase = true) == true &&
                        it.statut.equals("actif", ignoreCase = true)
                }

            if (matched == null) {
                throw IllegalArgumentException("Aucun compte actif trouvé pour cet email.")
            }
            // Ne jamais exposer le code PIN à la couche UI
            matched.copy(codePin = null)
        }
    }

    suspend fun fetchStaffForLogin(): Result<List<User>> {
        return runCatching {
            val allStaff = client.from("staff")
                .select()
                .decodeList<User>()
                .filter { it.statut.equals("actif", ignoreCase = true) }
                .map { it.copy(codePin = null) }
            _staffList.value = allStaff
            allStaff
        }
    }

    suspend fun loginWithPin(user: User, pin: String): Result<User> {
        val accountKey = user.id.ifBlank { user.email.orEmpty() }
        val cleanPin = pin.trim()

        if (!user.canAccessMobile) {
            return Result.failure(
                SecurityException("Accès à l'application mobile non autorisé pour ce compte.")
            )
        }

        if (cleanPin.length != 6 || !cleanPin.all { it.isDigit() }) {
            return Result.failure(IllegalArgumentException("Le code PIN doit comporter exactement 6 chiffres."))
        }

        // 1. Vérification du verrouillage anti-bruteforce local (chiffré via Android Keystore)
        val lockRemaining = SecurityManager.getLockoutRemainingSeconds(accountKey)
        if (lockRemaining > 0L) {
            return Result.failure(
                IllegalStateException("Compte verrouillé par sécurité. Réessayez dans ${formatDuration(lockRemaining)}.")
            )
        }

        // 2. Tentative via RPC serveur `authenticate_staff_pin` (si déployée sur Supabase)
        val rpcAttempt = runCatching {
            val response = client.postgrest.rpc(
                function = "authenticate_staff_pin",
                parameters = buildJsonObject {
                    put("p_staff_id", user.id)
                    put("p_pin", cleanPin)
                }
            ).decodeAs<JsonObject>()

            val authenticated = response["authenticated"]?.jsonPrimitive?.booleanOrNull == true
            if (authenticated) {
                SecurityManager.clearFailedAttempts(accountKey)
                val userObj = response["user"]?.jsonObject
                val verifiedUser = if (userObj != null) {
                    SupabaseClientProvider.json.decodeFromJsonElement(User.serializer(), userObj).copy(codePin = null)
                } else {
                    user.copy(codePin = null)
                }
                completeAuthenticatedLogin(verifiedUser)
                return Result.success(verifiedUser)
            } else {
                val errorCode = response["error_code"]?.jsonPrimitive?.content.orEmpty()
                when (errorCode) {
                    "ACCOUNT_LOCKED" -> {
                        val rem = response["remaining_seconds"]?.jsonPrimitive?.longOrNull ?: 900L
                        SecurityManager.recordFailedPinAttempt(accountKey)
                        logSecurityEvent(user, "ACCOUNT_LOCKED_BRUTEFORCE", "Verrouillage serveur après échecs PIN (${user.fullName})")
                        return Result.failure(
                            IllegalStateException("Compte verrouillé par sécurité pendant ${formatDuration(rem)}.")
                        )
                    }
                    "PIN_NOT_CONFIGURED" -> {
                        return Result.failure(
                            IllegalStateException("Aucun code PIN n'est configuré pour ce compte. Contactez l'administrateur.")
                        )
                    }
                    "INVALID_PIN" -> {
                        val localRes = SecurityManager.recordFailedPinAttempt(accountKey)
                        val serverRem = response["remaining_attempts"]?.jsonPrimitive?.intOrNull
                        logSecurityEvent(user, "LOGIN_FAILED_PIN", "Tentative PIN échouée (${user.fullName})")
                        return Result.failure(IllegalArgumentException(pinFailureMessage(localRes, serverRem)))
                    }
                    else -> null
                }
            }
        }.getOrNull()

        if (rpcAttempt != null) return rpcAttempt

        // 3. Vérification ciblée en temps constant (sans PIN par défaut "000000")
        val freshStaff = runCatching {
            client.from("staff")
                .select {
                    filter {
                        eq("id", user.id)
                    }
                }
                .decodeList<User>()
                .firstOrNull { it.statut.equals("actif", ignoreCase = true) }
        }.getOrElse { err ->
            return Result.failure(
                IllegalStateException("Impossible de vérifier l'identité : ${err.localizedMessage ?: "erreur réseau"}")
            )
        } ?: return Result.failure(IllegalStateException("Ce compte n'est plus actif."))

        return when (
            val verification = SecurityManager.verifyPinConstantTime(
                accountKey = accountKey,
                inputPin = cleanPin,
                storedPinOrHash = freshStaff.codePin
            )
        ) {
            is PinVerificationResult.Success -> {
                val sanitized = freshStaff.copy(codePin = null)
                completeAuthenticatedLogin(sanitized)
                Result.success(sanitized)
            }
            is PinVerificationResult.NotConfigured -> {
                logSecurityEvent(freshStaff, "LOGIN_REJECTED_UNCONFIGURED_PIN", "Connexion refusée : PIN non configuré")
                Result.failure(
                    IllegalStateException("Aucun code PIN sécurisé n'est défini pour ce compte. Contactez l'administrateur.")
                )
            }
            is PinVerificationResult.LockedOut -> {
                logSecurityEvent(freshStaff, "ACCOUNT_LOCKED_BRUTEFORCE", "Compte verrouillé 15 min après 5 échecs PIN")
                Result.failure(
                    IllegalStateException("Trop de tentatives. Compte verrouillé pendant ${formatDuration(verification.remainingSeconds)}.")
                )
            }
            is PinVerificationResult.InvalidPin -> {
                logSecurityEvent(
                    freshStaff,
                    "LOGIN_FAILED_PIN",
                    "Code PIN erroné (${verification.remainingAttempts} essai(s) restant(s))"
                )
                Result.failure(IllegalArgumentException(pinFailureMessage(verification, null)))
            }
        }
    }

    private fun completeAuthenticatedLogin(sanitizedUser: User) {
        val clean = sanitizedUser.copy(codePin = null)
        _currentUser.value = clean
        _selectedStoreId.value = clean.storeId?.takeIf { it.isNotBlank() && it != "GLOBAL" } ?: "all"
        _multiDeviceLogoutNotice.value = null
        SecurityManager.saveAuthenticatedSession(clean)
        val newToken = java.util.UUID.randomUUID().toString()
        SecurityManager.saveSessionToken(newToken)
        startMultiDeviceSessionWatcher(clean, newToken, registerOnServer = true)
        logSecurityEvent(clean, "LOGIN_SUCCESS", "Connexion mobile validée (${clean.role})")
        backgroundScope.launch { refreshAll() }
    }

    private fun pinFailureMessage(result: PinVerificationResult, serverRemaining: Int?): String {
        return when (result) {
            is PinVerificationResult.LockedOut ->
                "Trop de tentatives. Compte verrouillé pendant ${formatDuration(result.remainingSeconds)}."
            is PinVerificationResult.InvalidPin -> {
                val rem = serverRemaining ?: result.remainingAttempts
                if (result.cooldownSeconds > 0L) {
                    "Code PIN incorrect. Attendez ${result.cooldownSeconds}s avant le dernier essai."
                } else {
                    "Code PIN incorrect • $rem tentative(s) restante(s)"
                }
            }
            else -> "Code PIN incorrect."
        }
    }

    private fun formatDuration(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return if (mins > 0) "${mins}m ${secs}s" else "${secs}s"
    }

    private fun resolveAssignedStoreScope(user: User?, stores: List<Store>): Set<String>? {
        val raw = user?.storeId?.trim().orEmpty()
        if (raw.isEmpty() || raw.equals("all", ignoreCase = true) || raw.equals("GLOBAL", ignoreCase = true)) {
            return null
        }
        val matchedStore = stores.firstOrNull {
            it.id.equals(raw, ignoreCase = true) ||
                (it.code.isNotBlank() && it.code.equals(raw, ignoreCase = true))
        }
        return buildSet {
            add(raw.lowercase())
            matchedStore?.id?.takeIf { it.isNotBlank() }?.let { add(it.lowercase()) }
            matchedStore?.code?.takeIf { it.isNotBlank() }?.let { add(it.lowercase()) }
        }
    }

    private fun matchesStoreScope(itemStoreId: String?, scope: Set<String>?): Boolean {
        if (scope == null) return true
        val cleaned = itemStoreId?.trim()?.lowercase().orEmpty()
        if (cleaned.isEmpty()) return false
        return cleaned in scope
    }

    suspend fun refreshAll() = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        _isLoading.value = true
        _errorMessage.value = null
        try {
            coroutineScope {
                val storesDeferred = async {
                    client.from("stores").select().decodeList<Store>()
                }
                val ordersDeferred = async {
                    client.from("orders")
                        .select {
                            order("created_at", order = PostgrestOrder.DESCENDING)
                        }
                        .decodeList<Order>()
                        .filter { it.deletedAt == null }
                }
                val customersDeferred = async {
                    client.from("customers")
                        .select()
                        .decodeList<Customer>()
                        .filter { it.deletedAt == null }
                }
                val catalogDeferred = async {
                    client.from("catalog").select().decodeList<CatalogItem>()
                }
                val deliveryZonesDeferred = async {
                    runCatching { client.from("delivery_zones").select().decodeList<DeliveryZone>() }
                        .getOrDefault(emptyList())
                }
                val pickupZonesDeferred = async {
                    runCatching { client.from("pickup_zones").select().decodeList<DeliveryZone>() }
                        .getOrDefault(emptyList())
                }
                val rewardAdjustmentsDeferred = async {
                    val tableRows = runCatching {
                        client.from("reward_point_adjustments")
                            .select {
                                order("created_at", order = PostgrestOrder.DESCENDING)
                            }
                            .decodeList<RewardPointAdjustment>()
                    }.getOrDefault(emptyList())
                    val logRows = runCatching {
                        client.from("activity_logs")
                            .select {
                                filter { isIn("action", listOf("REWARD_ADJ_REQ", "REWARD_ADJ_DECISION")) }
                                order("timestamp", order = PostgrestOrder.DESCENDING)
                            }
                            .decodeList<ActivityLogRecord>()
                    }.getOrDefault(emptyList())
                    mergeRewardAdjustments(tableRows, logRows)
                }
                val remoteNotifsDeferred = async {
                    runCatching {
                        client.from("order_notifications")
                            .select {
                                filter { eq("type_action", "REWARD_ADJUSTMENT_APPROVED") }
                                order("created_at", order = PostgrestOrder.DESCENDING)
                                limit(25)
                            }
                            .decodeList<RemoteOrderNotification>()
                    }.getOrDefault(emptyList())
                }
                val expensesDeferred = async {
                    runCatching {
                        client.from("expenses")
                            .select {
                                order("expense_date", order = PostgrestOrder.DESCENDING)
                                order("created_at", order = PostgrestOrder.DESCENDING)
                            }
                            .decodeList<Expense>()
                    }.getOrDefault(emptyList())
                }

                val user = _currentUser.value
                val loadedStores = storesDeferred.await()
                val storeScope = resolveAssignedStoreScope(user, loadedStores)

                val scopedOrders = ordersDeferred.await()
                    .filter { matchesStoreScope(it.storeId, storeScope) }
                val scopedOrderCustomerIds = scopedOrders.mapNotNull { it.customerId }.toSet()
                val scopedCustomers = customersDeferred.await()
                    .filter { matchesStoreScope(it.storeId, storeScope) || it.id in scopedOrderCustomerIds }
                val scopedRewardAdjustments = rewardAdjustmentsDeferred.await()
                    .filter { matchesStoreScope(it.storeId, storeScope) }
                val scopedExpenses = expensesDeferred.await()
                    .filter { matchesStoreScope(it.storeId, storeScope) }

                _stores.value = loadedStores
                _orders.value = scopedOrders
                _customers.value = scopedCustomers
                _catalog.value = catalogDeferred.await()
                _deliveryZones.value = deliveryZonesDeferred.await()
                _pickupZones.value = pickupZonesDeferred.await()
                _rewardAdjustments.value = scopedRewardAdjustments
                _expenses.value = scopedExpenses
                KlinUpNotificationManager.syncFromOrders(
                    orders = _orders.value,
                    customers = _customers.value,
                    emitSystemNotifications = true
                )
                val storeAlerts = remoteNotifsDeferred.await()
                    .filter { notif -> matchesStoreScope(notif.storeId, storeScope) }
                    .map { notif ->
                        AppNotification(
                            id = "remote_${notif.id}",
                            orderId = null,
                            title = notif.titre.ifBlank { "Ajustement de points validé" },
                            message = notif.message,
                            category = NotificationCategory.INFO,
                            timestampIso = notif.createdAt,
                            isRead = false
                        )
                    }
                KlinUpNotificationManager.mergeRemoteNotifications(
                    remoteAlerts = storeAlerts,
                    emitSystemNotifications = true
                )
            }
        } catch (e: Exception) {
            _errorMessage.value = e.message ?: "Erreur de synchronisation avec Supabase"
        } finally {
            _isLoading.value = false
        }
    }

    fun setStoreFilter(storeId: String) {
        val assignedScope = resolveAssignedStoreScope(_currentUser.value, _stores.value)
        if (assignedScope != null) return
        _selectedStoreId.value = storeId
    }

    fun logout() {
        val active = _currentUser.value
        activeLocalSessionToken = null
        sessionWatcherJob?.cancel()
        sessionWatcherJob = null
        if (active != null) {
            logSecurityEvent(active, "LOGOUT", "Déconnexion volontaire (${active.fullName})")
        }
        SecurityManager.clearSession()
        _currentUser.value = null
        _orders.value = emptyList()
        _customers.value = emptyList()
        _catalog.value = emptyList()
        _expenses.value = emptyList()
        _rewardAdjustments.value = emptyList()
        _selectedStoreId.value = "all"
        _errorMessage.value = null
    }

    suspend fun updateOrderStatus(orderId: String, newStatus: String, reason: String? = null): Result<Unit> {
        return runCatching {
            val user = requireAuthenticatedUser()
            val currentStatus = _orders.value.firstOrNull { it.id == orderId }?.statut.orEmpty()
            if (!user.canPerformOrderTransition(currentStatus, newStatus)) {
                throw SecurityException("Action non autorisée pour votre rôle (${user.role}).")
            }
            if (newStatus == "annule" && reason.isNullOrBlank()) {
                throw IllegalArgumentException("Un motif d'annulation est obligatoire.")
            }
            client.from("orders").update(OrderStatusPatch(statut = newStatus)) {
                filter { eq("id", orderId) }
            }
            _orders.value = _orders.value.map {
                if (it.id == orderId) it.copy(statut = newStatus) else it
            }
            if (!reason.isNullOrBlank()) {
                val action = if (newStatus == "annule") "ANNULATION_COMMANDE" else "STATUT_COMMANDE"
                logSecurityEvent(user, action, "Commande $orderId ($newStatus) — Motif : ${reason.trim()}")
            }
            refreshAll()
        }
    }

    fun requiresRemainingPayment(order: Order, targetStatus: String): Boolean {
        if (targetStatus !in setOf("a_recuperer", "a_livrer", "en_cours_livraison", "restitue")) return false
        if (order.isSubscriptionOrder || order.modeReglement.equals("abonnement", ignoreCase = true)) return false
        val remaining = (order.prixTotal - order.avancePayee).coerceAtLeast(0.0)
        return remaining > 0.0
    }

    suspend fun deliverOrderWithPayment(
        order: Order,
        amountPaid: Double,
        paymentMethod: String,
        targetStatus: String,
        momoReference: String? = null,
        momoOperator: String? = null
    ): Result<Unit> {
        return runCatching {
            val user = requireAuthenticatedUser()
            if (!user.canPerformOrderTransition(order.statut, targetStatus)) {
                throw SecurityException("Action non autorisée pour votre rôle (${user.role}).")
            }
            val cleanAmountPaid = amountPaid.coerceAtLeast(0.0)
            val newAvance = order.avancePayee + cleanAmountPaid
            val paidAtIso = Instant.now().toString()
            val resolvedMethod = if (paymentMethod == "mobile_money") "mobile_money" else "especes"

            client.from("orders").update(
                OrderPaymentPatch(
                    statut = targetStatus,
                    modeReglement = resolvedMethod,
                    avancePayee = newAvance,
                    soldePaidAt = paidAtIso
                )
            ) {
                filter { eq("id", order.id) }
            }

            _orders.value = _orders.value.map {
                if (it.id == order.id) {
                    it.copy(
                        statut = targetStatus,
                        modeReglement = resolvedMethod,
                        avancePayee = newAvance,
                        soldePaidAt = paidAtIso
                    )
                } else it
            }

            val customer = order.customerId?.let { cid -> _customers.value.firstOrNull { it.id == cid } }
            if (customer != null && cleanAmountPaid > 0.0) {
                val newDebt = (customer.soldeDette - cleanAmountPaid).coerceAtLeast(0.0)
                val earnedPts = floor(cleanAmountPaid / 1000.0).toInt().coerceAtLeast(0)
                runCatching {
                    client.from("customers").update(
                        CustomerFidelityPatch(
                            pointsFidelite = customer.pointsFidelite + earnedPts,
                            soldeDette = newDebt
                        )
                    ) {
                        filter { eq("id", customer.id) }
                    }
                }
            }

            val refInfo = if (resolvedMethod == "mobile_money" && !momoReference.isNullOrBlank()) {
                val opLabel = momoOperator?.takeIf { it.isNotBlank() } ?: "Mobile Money"
                " via $opLabel (Réf: ${momoReference.trim()})"
            } else {
                " en Espèce"
            }
            logSecurityEvent(
                user,
                "PAIEMENT_FINAL",
                "Commande ${order.ticketLabel} ($targetStatus) — Solde encaissé: ${formatFcfa(cleanAmountPaid)}$refInfo"
            )
            refreshAll()
        }
    }

    suspend fun createOrder(
        existingCustomer: Customer?,
        newClientName: String,
        newClientPhone: String,
        selectedItems: List<OrderItem>,
        avancePayee: Double,
        modeReglement: String = "especes",
        niveauUrgence: String = "Normal",
        reduction: Double = 0.0,
        deliveryFee: Double = 0.0,
        pickupFee: Double = 0.0,
        expressFee: Double = 0.0,
        homeDelivery: Boolean = false
    ): Result<Pair<Order, Customer>> {
        return runCatching {
            val user = requireAuthenticatedUser()
            if (!user.canCreateOrders) {
                throw SecurityException("Vous n'avez pas l'autorisation de créer des commandes.")
            }
            val storeId = _selectedStoreId.value
                .takeIf { it.isNotBlank() && it != "all" && it != "GLOBAL" }
                ?: _stores.value.firstOrNull()?.id
                ?: "store_akpakpa"

            // Resolve or create customer
            val resolvedCustomer: Customer = if (existingCustomer != null) {
                existingCustomer
            } else {
                val cleanPhone = newClientPhone.trim()
                val existingByPhone = _customers.value.firstOrNull {
                    it.telephone.replace(" ", "") == cleanPhone.replace(" ", "") && cleanPhone.isNotEmpty()
                }
                if (existingByPhone != null) {
                    existingByPhone
                } else {
                    val parts = newClientName.trim().split(" ", limit = 2)
                    val prenom = parts.getOrNull(0)?.ifBlank { "Client" } ?: "Client"
                    val nom = parts.getOrNull(1)?.ifBlank { "Passage" } ?: "Passage"
                    val generatedCustId = "cust_${System.currentTimeMillis()}"
                    val payload = NewCustomerPayload(
                        id = generatedCustId,
                        nom = nom,
                        prenom = prenom,
                        telephone = cleanPhone.ifBlank { "00000000" },
                        storeId = storeId,
                        createdById = user?.id,
                        createdByName = user?.fullName
                    )
                    client.from("customers").insert(payload)
                    Customer(
                        id = generatedCustId,
                        nom = nom,
                        prenom = prenom,
                        telephone = payload.telephone,
                        storeId = storeId
                    )
                }
            }

            val itemsTotal = selectedItems.sumOf { it.prix * it.quantite }
            val grossTotal = itemsTotal + expressFee.coerceAtLeast(0.0) + deliveryFee.coerceAtLeast(0.0) + pickupFee.coerceAtLeast(0.0)
            val total = (grossTotal - reduction).coerceAtLeast(0.0)
            val dueHours = if (niveauUrgence.equals("Express", ignoreCase = true)) 24L else 48L
            val nowInstant = Instant.now()
            val createdIso = nowInstant.toString()
            val dueIso = nowInstant.plusSeconds(dueHours * 3600L).toString()

            // Générer un ID séquentiel fiable (en interrogeant aussi les IDs existants pour éviter toute collision)
            val remoteMaxId = runCatching {
                client.from("orders")
                    .select()
                    .decodeList<Order>()
                    .mapNotNull { it.id.toIntOrNull() }
                    .maxOrNull()
            }.getOrNull()
            val localMaxId = _orders.value.mapNotNull { it.id.toIntOrNull() }.maxOrNull() ?: 0
            val nextSeqId = (maxOf(remoteMaxId ?: 0, localMaxId) + 1).toString()

            val orderPayload = NewOrderPayload(
                id = nextSeqId,
                customerId = resolvedCustomer.id,
                statut = "en_attente",
                typeArticle = selectedItems.firstOrNull()?.article ?: "Divers",
                typeService = selectedItems.firstOrNull()?.service ?: "lavage_simple",
                niveauUrgence = niveauUrgence,
                modeReglement = modeReglement,
                avancePayee = avancePayee,
                prixTotal = total,
                identifiantUniqueMarquage = nextSeqId,
                createdAt = createdIso,
                dueDate = dueIso,
                items = selectedItems,
                isSubscriptionOrder = false,
                createdById = user.id,
                createdByName = user.fullName,
                storeId = storeId
            )

            var insertedOrderId = nextSeqId
            runCatching {
                client.from("orders").insert(orderPayload)
            }.getOrElse { firstErr ->
                // Si collision sur l'ID séquentiel, réessayer avec un ID unique horodaté
                val fallbackId = "ord_${System.currentTimeMillis()}"
                insertedOrderId = fallbackId
                try {
                    client.from("orders").insert(
                        orderPayload.copy(id = fallbackId, identifiantUniqueMarquage = nextSeqId)
                    )
                } catch (e: Exception) {
                    throw IllegalStateException(sanitizeApiError(e, firstErr))
                }
            }
            if (homeDelivery || deliveryFee > 0.0) {
                _deliveryOrderIds.value = _deliveryOrderIds.value + insertedOrderId
            }

            // Update customer fidelity points & unpaid balance (aligned with admin-cms)
            val unpaid = (total - avancePayee).coerceAtLeast(0.0)
            val earnedPts = floor(avancePayee / 1000.0).toInt().coerceAtLeast(0)
            if (unpaid > 0.0 || earnedPts > 0) {
                runCatching {
                    client.from("customers").update(
                        CustomerFidelityPatch(
                            pointsFidelite = resolvedCustomer.pointsFidelite + earnedPts,
                            soldeDette = resolvedCustomer.soldeDette + unpaid
                        )
                    ) {
                        filter { eq("id", resolvedCustomer.id) }
                    }
                }
            }

            refreshAll()

            val createdOrder = Order(
                id = insertedOrderId,
                customerId = resolvedCustomer.id,
                statut = orderPayload.statut,
                typeArticle = orderPayload.typeArticle,
                typeService = orderPayload.typeService,
                niveauUrgence = orderPayload.niveauUrgence,
                modeReglement = orderPayload.modeReglement,
                avancePayee = orderPayload.avancePayee,
                prixTotal = orderPayload.prixTotal,
                identifiantUniqueMarquage = orderPayload.identifiantUniqueMarquage,
                createdAt = orderPayload.createdAt,
                dueDate = orderPayload.dueDate,
                items = orderPayload.items,
                isSubscriptionOrder = orderPayload.isSubscriptionOrder,
                createdById = orderPayload.createdById,
                createdByName = orderPayload.createdByName,
                storeId = orderPayload.storeId,
                fraisLivraison = deliveryFee,
                livraisonDomicile = homeDelivery
            )
            createdOrder to resolvedCustomer
        }
    }

    fun formatPhoneForWhatsApp(phoneStr: String, indicatif: String = "229"): String {
        val cleanIndicatif = indicatif.filter { it.isDigit() }.ifBlank { "229" }
        var cleaned = phoneStr.filter { it.isDigit() }
        if (cleaned.isBlank()) return ""
        if (cleaned.startsWith("0") && cleanIndicatif != "229") {
            cleaned = cleaned.drop(1)
        }
        return if (cleaned.startsWith(cleanIndicatif) && cleaned.length > cleanIndicatif.length + 5) {
            cleaned
        } else {
            cleanIndicatif + cleaned
        }
    }

    fun buildOrderCreatedWhatsAppMessage(
        order: Order,
        customer: Customer,
        storeName: String? = null
    ): String {
        val remaining = (order.prixTotal - order.avancePayee).coerceAtLeast(0.0)
        val articlesSummary = order.items.orEmpty()
            .takeIf { it.isNotEmpty() }
            ?.joinToString(", ") { "${it.quantite}x ${it.article}" }
            ?: order.typeArticle
        val paymentLabel = when (order.modeReglement.lowercase()) {
            "especes", "espece" -> "Espèces"
            "mtn_momo", "mtn" -> "Mobile Money (MTN)"
            "moov_money", "moov" -> "Mobile Money (Moov)"
            "celtis_cash", "celtis", "celtiis" -> "Mobile Money (Celtis)"
            "mobile_money" -> "Mobile Money"
            else -> order.modeReglement
        }
        val storeText = storeName?.takeIf { it.isNotBlank() }?.let { " ($it)" } ?: ""
        val dueText = formatOrderDateOnly(order.dueDate)
        return buildString {
            appendLine("Bonjour ${customer.fullName},")
            appendLine()
            appendLine("Votre commande *${order.ticketLabel}* a bien été enregistrée chez *Pressing Pro*$storeText pour le traitement de vos vêtements.")
            appendLine()
            appendLine("📋 *Détails de la commande :*")
            appendLine("• Articles : $articlesSummary")
            appendLine("• Urgence : ${order.niveauUrgence}")
            appendLine("• Mode de règlement : $paymentLabel")
            appendLine("• Total : ${formatFcfa(order.prixTotal)}")
            appendLine("• Avance payée : ${formatFcfa(order.avancePayee)}")
            appendLine("• Reste à payer : ${formatFcfa(remaining)}")
            appendLine("• Date de livraison / retrait prévue : $dueText")
            appendLine()
            append("Nous vous informerons dès que votre linge sera prêt. Merci pour votre confiance !")
        }
    }

    fun buildOrderReadyWhatsAppMessage(
        order: Order,
        customer: Customer,
        targetStatus: String,
        storeName: String? = null
    ): String {
        val remaining = (order.prixTotal - order.avancePayee).coerceAtLeast(0.0)
        val articlesSummary = order.items.orEmpty()
            .takeIf { it.isNotEmpty() }
            ?.joinToString(", ") { "${it.quantite}x ${it.article}" }
            ?: order.typeArticle
        val storeText = storeName?.takeIf { it.isNotBlank() }?.let { " ($it)" } ?: ""
        val isDelivery = targetStatus == "a_livrer"
        val readyHeadline = if (isDelivery) {
            "Bonne nouvelle ! Votre commande *${order.ticketLabel}* ($articlesSummary) est désormais *prête pour la livraison* chez *Pressing Pro*$storeText."
        } else {
            "Bonne nouvelle ! Votre commande *${order.ticketLabel}* ($articlesSummary) est désormais *prête et disponible pour retrait sur place* chez *Pressing Pro*$storeText."
        }
        val closingLine = if (isDelivery) {
            "Notre livreur vous contactera très bientôt pour effectuer la livraison. Merci pour votre confiance !"
        } else {
            "Vous pouvez passer la récupérer à votre convenance. Merci pour votre confiance !"
        }
        return buildString {
            appendLine("Bonjour ${customer.fullName},")
            appendLine()
            appendLine(readyHeadline)
            appendLine()
            appendLine("• Total : ${formatFcfa(order.prixTotal)}")
            appendLine("• Avance payée : ${formatFcfa(order.avancePayee)}")
            appendLine("• Reste à payer : ${formatFcfa(remaining)}")
            appendLine()
            append(closingLine)
        }
    }

    fun openWhatsAppMessage(
        context: Context,
        phone: String,
        indicatif: String?,
        message: String
    ) {
        val formattedPhone = formatPhoneForWhatsApp(phone, indicatif ?: "229")
        if (formattedPhone.isBlank()) return
        val intent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://wa.me/$formattedPhone?text=${Uri.encode(message)}")
        )
        runCatching { context.startActivity(intent) }
    }

    fun notifyOrderReadyIfApplicable(
        context: Context,
        order: Order,
        targetStatus: String
    ) {
        if (targetStatus != "a_livrer" && targetStatus != "a_recuperer") return
        val customer = order.customerId?.let { cid -> _customers.value.firstOrNull { it.id == cid } } ?: return
        if (customer.telephone.isBlank()) return
        val storeName = order.storeId?.let { sid -> _stores.value.firstOrNull { it.id == sid }?.nom }
        val message = buildOrderReadyWhatsAppMessage(order, customer, targetStatus, storeName)
        openWhatsAppMessage(context, customer.telephone, customer.indicatif, message)
    }

    // ─── Formatting & Business Helpers (aligned with admin-cms) ──────────────

    fun formatFcfa(amount: Double): String {
        val fmt = NumberFormat.getNumberInstance(Locale.FRANCE).apply {
            maximumFractionDigits = 0
        }
        return "${fmt.format(amount.toLong())} FCFA"
    }

    fun orderStatusLabel(statut: String): String = when (statut) {
        "en_attente_validation" -> "À valider"
        "en_attente", "attente" -> "En attente"
        "traitement" -> "Traitement"
        "en_cours_lavage", "lavage_cours" -> "Lavage"
        "en_cours_repassage", "repassage_cours" -> "Repassage"
        "pret" -> "Prêt"
        "a_livrer" -> "À livrer"
        "a_recuperer" -> "À récupérer"
        "en_cours_livraison" -> "En livraison"
        "restitue", "livre" -> "Restituée"
        "annule" -> "Annulée"
        else -> statut
    }

    fun nextOrderStatus(current: String): String? = when (current) {
        "en_attente_validation" -> "en_attente"
        "en_attente", "attente" -> "en_cours_lavage"
        "traitement" -> "en_cours_lavage"
        "en_cours_lavage", "lavage_cours" -> "en_cours_repassage"
        "en_cours_repassage", "repassage_cours" -> "pret"
        "pret", "a_recuperer" -> "restitue"
        "a_livrer" -> "en_cours_livraison"
        "en_cours_livraison" -> "restitue"
        else -> null
    }

    suspend fun createCustomer(
        nom: String,
        prenom: String,
        telephone: String,
        adresse: String?,
        preferencesPliage: String,
        indicatif: String = "229",
        quartier: String? = null,
        ville: String? = "Cotonou",
        latitude: Double? = null,
        longitude: Double? = null,
        explicitStoreId: String? = null,
        subscriptionPlan: CatalogItem? = null
    ): Result<Customer> = runCatching {
        val current = requireAuthenticatedUser()
        val storeId = explicitStoreId?.takeIf { it.isNotBlank() && it != "all" && it != "GLOBAL" }
            ?: _selectedStoreId.value.takeIf { it != "all" && it != "GLOBAL" }
            ?: current?.storeId?.takeIf { it != "all" && it != "GLOBAL" }
            ?: _stores.value.firstOrNull()?.id
        val newId = "c_" + java.util.UUID.randomUUID().toString().replace("-", "").take(9)
        val createdAtIso = Instant.now().toString()
        val cleanPhone = telephone.trim().ifBlank {
            "00${System.currentTimeMillis().toString().takeLast(6)}"
        }
        val combinedAddress = listOfNotNull(
            adresse?.trim()?.takeIf { it.isNotBlank() },
            quartier?.trim()?.takeIf { it.isNotBlank() },
            ville?.trim()?.takeIf { it.isNotBlank() && !it.equals("Cotonou", ignoreCase = true) }
        ).joinToString(", ").takeIf { it.isNotBlank() }

        val payload = NewCustomerPayload(
            id = newId,
            nom = nom.trim(),
            prenom = prenom.trim(),
            telephone = cleanPhone,
            indicatif = indicatif.trim().removePrefix("+").ifBlank { "229" },
            adresse = combinedAddress,
            preferencesPliage = preferencesPliage.ifBlank { "Plié" },
            storeId = storeId,
            createdById = current.id,
            createdByName = current.fullName,
            createdAt = createdAtIso
        )
        try {
            client.from("customers").insert(payload)
        } catch (e: Exception) {
            throw IllegalStateException(sanitizeApiError(e))
        }
        val created = Customer(
            id = newId,
            nom = payload.nom,
            prenom = payload.prenom,
            telephone = payload.telephone,
            adresse = payload.adresse,
            quartier = quartier?.trim()?.takeIf { it.isNotBlank() },
            ville = ville?.trim()?.ifBlank { "Cotonou" } ?: "Cotonou",
            preferencesPliage = payload.preferencesPliage,
            storeId = storeId,
            createdAt = createdAtIso
        )
        _customers.value = listOf(created) + _customers.value
        if (subscriptionPlan != null) {
            subscribeCustomer(newId, subscriptionPlan)
        }
        _customers.value.firstOrNull { it.id == newId } ?: created
    }

    suspend fun updateCustomer(
        customerId: String,
        nom: String,
        prenom: String,
        telephone: String,
        indicatif: String = "229",
        adresse: String?,
        quartier: String? = null,
        ville: String? = null,
        storeId: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        preferencesPliage: String
    ): Result<Unit> = runCatching {
        requireAuthenticatedUser()
        val cleanNom = nom.trim()
        val cleanPrenom = prenom.trim()
        val cleanPhone = telephone.trim()
        val cleanIndicatif = indicatif.trim().replace("+", "").ifBlank { "229" }
        val cleanQuartier = quartier?.trim()?.takeIf { it.isNotBlank() }
        val cleanVille = ville?.trim()?.takeIf { it.isNotBlank() }
        val combinedAddress = listOfNotNull(
            adresse?.trim()?.takeIf { it.isNotBlank() },
            cleanQuartier,
            cleanVille?.takeIf { !it.equals("Cotonou", ignoreCase = true) || adresse.isNullOrBlank() }
        ).joinToString(", ").takeIf { it.isNotBlank() }
        val cleanPref = preferencesPliage.ifBlank { "Plié" }
        val resolvedStore = storeId?.takeIf { it.isNotBlank() && it != "all" && it != "GLOBAL" }

        try {
            client.from("customers").update(
                CustomerUpdatePayload(
                    nom = cleanNom,
                    prenom = cleanPrenom,
                    telephone = cleanPhone,
                    indicatif = cleanIndicatif,
                    adresse = combinedAddress,
                    preferencesPliage = cleanPref,
                    storeId = resolvedStore
                )
            ) {
                filter { eq("id", customerId) }
            }
        } catch (e: Exception) {
            throw IllegalStateException(sanitizeApiError(e))
        }

        _customers.value = _customers.value.map { c ->
            if (c.id == customerId) {
                c.copy(
                    nom = cleanNom,
                    prenom = cleanPrenom,
                    telephone = cleanPhone,
                    adresse = combinedAddress,
                    quartier = cleanQuartier,
                    ville = cleanVille,
                    storeId = resolvedStore ?: c.storeId,
                    latitude = latitude ?: c.latitude,
                    longitude = longitude ?: c.longitude,
                    coordonneesLivraison = if (latitude != null && longitude != null) "$latitude,$longitude" else c.coordonneesLivraison,
                    preferencesPliage = cleanPref
                )
            } else c
        }
        if (latitude != null && longitude != null) {
            updateCustomerLocation(customerId, latitude, longitude)
        }
    }

    suspend fun deleteCustomer(customerId: String, reason: String): Result<Unit> = runCatching {
        val user = requireAuthenticatedUser()
        val cleanReason = reason.trim()
        if (cleanReason.isBlank()) {
            throw IllegalArgumentException("Un motif de suppression est obligatoire.")
        }
        val targetName = _customers.value.firstOrNull { it.id == customerId }?.fullName ?: customerId
        client.from("customers").delete {
            filter { eq("id", customerId) }
        }
        _customers.value = _customers.value.filterNot { it.id == customerId }
        logSecurityEvent(user, "SUPPRESSION_CLIENT", "Client $targetName ($customerId) supprimé — Motif : $cleanReason")
    }

    private fun isMissingRewardAdjustmentsTable(error: Throwable): Boolean {
        val msg = error.message.orEmpty().lowercase()
        return msg.contains("reward_point_adjustments") ||
            msg.contains("pgrst205") ||
            msg.contains("schema cache") ||
            msg.contains("does not exist")
    }

    private fun friendlyDbMessage(error: Throwable, fallback: String): String {
        val raw = error.message.orEmpty()
        if (raw.contains("URL:") || raw.contains("Headers:") || raw.contains("apikey")) {
            val firstLine = raw.lineSequence().firstOrNull()?.trim().orEmpty()
            return firstLine.takeIf { it.isNotBlank() && !it.startsWith("URL:") } ?: fallback
        }
        return raw.ifBlank { fallback }
    }

    private fun mergeRewardAdjustments(
        tableRows: List<RewardPointAdjustment>,
        logRows: List<ActivityLogRecord>
    ): List<RewardPointAdjustment> {
        val json = SupabaseClientProvider.json
        val map = linkedMapOf<String, RewardPointAdjustment>()

        for (log in logRows.sortedBy { it.timestamp ?: "" }) {
            val raw = log.details?.takeIf { it.isNotBlank() } ?: continue
            if (log.action == "REWARD_ADJ_REQ") {
                runCatching { json.decodeFromString(RewardPointAdjustment.serializer(), raw) }
                    .getOrNull()
                    ?.let { adj -> map[adj.id] = adj }
            }
        }
        for (log in logRows.sortedBy { it.timestamp ?: "" }) {
            val raw = log.details?.takeIf { it.isNotBlank() } ?: continue
            if (log.action == "REWARD_ADJ_DECISION") {
                runCatching { json.decodeFromString(RewardAdjustmentDecisionLog.serializer(), raw) }
                    .getOrNull()
                    ?.let { dec ->
                        map[dec.id]?.let { existing ->
                            map[dec.id] = existing.copy(
                                status = dec.status,
                                validatedById = dec.validatedById ?: existing.validatedById,
                                validatedByName = dec.validatedByName ?: existing.validatedByName,
                                validatedByRole = dec.validatedByRole ?: existing.validatedByRole,
                                validatedAt = dec.validatedAt ?: existing.validatedAt,
                                rejectionReason = dec.rejectionReason ?: existing.rejectionReason
                            )
                        }
                    }
            }
        }
        for (row in tableRows) {
            val prev = map[row.id]
            map[row.id] = if (prev != null && row.status == "pending" && prev.status != "pending") prev else row
        }
        return map.values.sortedByDescending { it.createdAt ?: "" }
    }

    fun canValidateRewardAdjustments(user: User? = _currentUser.value): Boolean {
        val role = user?.role?.trim()?.lowercase() ?: return false
        return role in setOf("super_admin", "manager", "gestionnaire", "gestionnaire_laverie")
    }

    suspend fun adjustCustomerPoints(
        customerId: String,
        pointsDelta: Int,
        reason: String? = null
    ): Result<RewardPointAdjustment> = runCatching {
        val user = requireAuthenticatedUser()
        val cleanReason = reason?.trim().orEmpty()
        if (cleanReason.isEmpty()) {
            throw IllegalArgumentException("Le motif de l'ajustement est obligatoire.")
        }
        if (pointsDelta == 0) {
            throw IllegalArgumentException("La variation de points doit être différente de zéro.")
        }
        val customer = _customers.value.firstOrNull { it.id == customerId }
            ?: throw IllegalStateException("Client introuvable")
        val targetStoreId = customer.storeId?.takeIf { it.isNotBlank() }
            ?: _selectedStoreId.value?.takeIf { it.isNotBlank() && it != "all" }
            ?: user.storeId?.takeIf { it.isNotBlank() && it != "all" }
            ?: "store_central"

        val adjId = "rwd_adj_${System.currentTimeMillis()}_${(100..999).random()}"
        val nowIso = Instant.now().toString()
        val newAdjustment = RewardPointAdjustment(
            id = adjId,
            customerId = customer.id,
            customerName = customer.fullName,
            storeId = targetStoreId,
            pointsDelta = pointsDelta,
            reason = cleanReason,
            status = "pending",
            requestedById = user.id,
            requestedByName = user.fullName,
            requestedByRole = user.role,
            createdAt = nowIso
        )

        val tableResult = runCatching {
            client.from("reward_point_adjustments").insert(newAdjustment)
        }
        tableResult.onFailure { err ->
            if (!isMissingRewardAdjustmentsTable(err)) {
                throw IllegalStateException(friendlyDbMessage(err, "Erreur lors de l'enregistrement de la demande."))
            }
            val encoded = SupabaseClientProvider.json.encodeToString(RewardPointAdjustment.serializer(), newAdjustment)
            val fallbackRes = runCatching {
                client.from("activity_logs").insert(
                    ActivityLogRecord(
                        id = adjId,
                        userId = user.id,
                        userName = user.fullName,
                        action = "REWARD_ADJ_REQ",
                        details = encoded,
                        timestamp = nowIso
                    )
                )
            }
            fallbackRes.onFailure { fbErr ->
                throw IllegalStateException(friendlyDbMessage(fbErr, "Impossible d'enregistrer la demande d'ajustement."))
            }
        }
        _rewardAdjustments.value = listOf(newAdjustment) + _rewardAdjustments.value

        val sign = if (pointsDelta > 0) "+$pointsDelta" else "$pointsDelta"
        logSecurityEvent(
            user,
            "DEMANDE_AJUSTEMENT_POINTS",
            "${customer.fullName} ($sign pts) en attente de validation — Motif : $cleanReason"
        )
        newAdjustment
    }

    suspend fun validateRewardAdjustment(
        adjustmentId: String,
        approve: Boolean,
        rejectionReason: String? = null
    ): Result<RewardPointAdjustment> = runCatching {
        val user = requireAuthenticatedUser()
        if (!canValidateRewardAdjustments(user)) {
            throw SecurityException("Seuls le Super Administrateur et le Gestionnaire de laverie peuvent valider cet ajustement.")
        }
        val adj = _rewardAdjustments.value.firstOrNull { it.id == adjustmentId }
            ?: throw IllegalStateException("Demande d'ajustement introuvable.")
        if (adj.status != "pending") {
            throw IllegalStateException("Cette demande a déjà été traitée.")
        }
        val isSuperAdmin = user.role.equals("super_admin", ignoreCase = true)
        if (!isSuperAdmin && !user.storeId.isNullOrBlank() && user.storeId != "all" && !adj.storeId.isNullOrBlank() && user.storeId != adj.storeId) {
            throw SecurityException("Vous ne pouvez valider que les demandes de votre point de laverie.")
        }

        val nowIso = Instant.now().toString()
        val nextStatus = if (approve) "approved" else "rejected"
        val cleanReject = rejectionReason?.trim()?.takeIf { it.isNotEmpty() }
        val patch = RewardAdjustmentDecisionPatch(
            status = nextStatus,
            validatedById = user.id,
            validatedByName = user.fullName,
            validatedByRole = user.role,
            validatedAt = nowIso,
            rejectionReason = if (!approve) cleanReject else null
        )

        val tableUpdate = runCatching {
            client.from("reward_point_adjustments").update(patch) {
                filter { eq("id", adjustmentId) }
            }
        }
        tableUpdate.onFailure { err ->
            if (!isMissingRewardAdjustmentsTable(err)) {
                throw IllegalStateException(friendlyDbMessage(err, "Erreur lors de la validation de la demande."))
            }
            val decPayload = RewardAdjustmentDecisionLog(
                id = adjustmentId,
                status = nextStatus,
                validatedById = user.id,
                validatedByName = user.fullName,
                validatedByRole = user.role,
                validatedAt = nowIso,
                rejectionReason = if (!approve) cleanReject else null
            )
            val encoded = SupabaseClientProvider.json.encodeToString(RewardAdjustmentDecisionLog.serializer(), decPayload)
            runCatching {
                client.from("activity_logs").insert(
                    ActivityLogRecord(
                        id = "dec_${adjustmentId}_${System.currentTimeMillis()}",
                        userId = user.id,
                        userName = user.fullName,
                        action = "REWARD_ADJ_DECISION",
                        details = encoded,
                        timestamp = nowIso
                    )
                )
            }.onFailure { fbErr ->
                throw IllegalStateException(friendlyDbMessage(fbErr, "Impossible d'enregistrer la validation."))
            }
        }
        val updatedAdj = adj.copy(
            status = nextStatus,
            validatedById = user.id,
            validatedByName = user.fullName,
            validatedByRole = user.role,
            validatedAt = nowIso,
            rejectionReason = if (!approve) cleanReject else null
        )
        _rewardAdjustments.value = _rewardAdjustments.value.map { if (it.id == adjustmentId) updatedAdj else it }

        val sign = if (adj.pointsDelta > 0) "+${adj.pointsDelta}" else "${adj.pointsDelta}"
        val customer = _customers.value.firstOrNull { it.id == adj.customerId }
        val targetStoreId = adj.storeId?.takeIf { it.isNotBlank() }
            ?: customer?.storeId?.takeIf { it.isNotBlank() }
            ?: "store_central"

        if (approve) {
            val currentPts = customer?.pointsFidelite ?: 0
            val newPts = (currentPts + adj.pointsDelta).coerceAtLeast(0)
            if (customer != null) {
                client.from("customers").update(CustomerPointsPatch(pointsFidelite = newPts)) {
                    filter { eq("id", customer.id) }
                }
                _customers.value = _customers.value.map { c ->
                    if (c.id == customer.id) c.copy(pointsFidelite = newPts) else c
                }
            }
            val notifPayload = RemoteOrderNotification(
                id = "notif_rwd_${System.currentTimeMillis()}_${(100..999).random()}",
                orderId = adj.id,
                storeId = targetStoreId,
                typeAction = "REWARD_ADJUSTMENT_APPROVED",
                titre = "🎁 Ajustement de points validé",
                message = "${adj.customerName ?: customer?.fullName ?: "Client"} ($sign pts → $newPts pts). Validé par ${user.fullName}. Motif : ${adj.reason}",
                createdAt = nowIso
            )
            runCatching { client.from("order_notifications").insert(notifPayload) }
            KlinUpNotificationManager.mergeRemoteNotifications(
                remoteAlerts = listOf(
                    AppNotification(
                        id = "remote_${notifPayload.id}",
                        orderId = null,
                        title = notifPayload.titre,
                        message = notifPayload.message,
                        category = NotificationCategory.INFO,
                        timestampIso = notifPayload.createdAt,
                        isRead = false
                    )
                ),
                emitSystemNotifications = true
            )
            logSecurityEvent(
                user,
                "VALIDATION_AJUSTEMENT_POINTS",
                "${adj.customerName ?: adj.customerId} ($sign pts → $newPts pts) validé par ${user.fullName} — Motif : ${adj.reason}"
            )
        } else {
            logSecurityEvent(
                user,
                "REJET_AJUSTEMENT_POINTS",
                "${adj.customerName ?: adj.customerId} ($sign pts) refusé par ${user.fullName}${cleanReject?.let { " — Raison : $it" }.orEmpty()}"
            )
        }

        updatedAdj
    }

    suspend fun redeemCustomerReward(
        customerId: String,
        reward: RewardCatalogItem
    ): Result<Int> = runCatching {
        val user = requireAuthenticatedUser()
        val customer = _customers.value.firstOrNull { it.id == customerId }
            ?: throw IllegalStateException("Client introuvable")
        if (customer.pointsFidelite < reward.cost) {
            throw IllegalStateException("Points insuffisants (${customer.pointsFidelite}/${reward.cost} pts).")
        }
        val newPoints = (customer.pointsFidelite - reward.cost).coerceAtLeast(0)
        client.from("customers").update(CustomerPointsPatch(pointsFidelite = newPoints)) {
            filter { eq("id", customerId) }
        }
        _customers.value = _customers.value.map { c ->
            if (c.id == customerId) c.copy(pointsFidelite = newPoints) else c
        }
        logSecurityEvent(
            user,
            "ECHANGE_REWARD",
            "${customer.fullName} : ${reward.title} (-${reward.cost} pts → $newPoints pts)"
        )
        newPoints
    }

    suspend fun subscribeCustomer(customerId: String, plan: CatalogItem): Result<ActiveSubscription> = runCatching {
        val clothesCount = plan.nombreVetements ?: when {
            plan.article.contains("Premium", ignoreCase = true) -> 50
            plan.article.contains("Prestige", ignoreCase = true) -> 100
            plan.article.contains("VIP", ignoreCase = true) -> 200
            else -> 25
        }
        val dureeJours = plan.dureeJours ?: 30
        val now = Instant.now()
        val expires = now.plusSeconds(dureeJours.toLong() * 86400L)
        val activeSub = ActiveSubscription(
            catalogItemId = plan.id,
            name = plan.article,
            totalClothes = clothesCount,
            remainingClothes = clothesCount,
            dureeJours = dureeJours,
            subscribedAt = now.toString(),
            expiresAt = expires.toString(),
            endDate = expires.toString()
        )
        client.from("customers").update(CustomerSubscriptionPatch(activeSubscription = activeSub)) {
            filter { eq("id", customerId) }
        }
        _customers.value = _customers.value.map { c ->
            if (c.id == customerId) c.copy(activeSubscription = activeSub) else c
        }
        activeSub
    }

    suspend fun unsubscribeCustomer(customerId: String): Result<Unit> = runCatching {
        client.from("customers").update(CustomerSubscriptionPatch(activeSubscription = null)) {
            filter { eq("id", customerId) }
        }
        _customers.value = _customers.value.map { c ->
            if (c.id == customerId) c.copy(activeSubscription = null) else c
        }
    }

    fun fidelityTier(points: Int): FidelityInfo = when {
        points >= 300 -> FidelityInfo(
            tierName = "Platine VIP",
            progress = 1f,
            nextTierName = null,
            pointsRemaining = 0,
            progressPercent = 100,
            benefits = listOf(
                "Remise 15% sur tous les abonnements",
                "1 pt / 1 000 FCFA",
                "Priorité traitement & livraison VIP"
            )
        )
        points >= 150 -> {
            val pct = (((points - 150f) / 150f) * 100f).toInt().coerceIn(0, 100)
            FidelityInfo(
                tierName = "Or",
                progress = ((points - 150f) / 150f).coerceIn(0f, 1f),
                nextTierName = "Platine VIP",
                pointsRemaining = (300 - points).coerceAtLeast(0),
                progressPercent = pct,
                benefits = listOf(
                    "Remise 10% sur tous les abonnements",
                    "1 pt / 1 000 FCFA",
                    "Priorité traitement"
                )
            )
        }
        points >= 50 -> {
            val pct = (((points - 50f) / 100f) * 100f).toInt().coerceIn(0, 100)
            FidelityInfo(
                tierName = "Argent",
                progress = ((points - 50f) / 100f).coerceIn(0f, 1f),
                nextTierName = "Or",
                pointsRemaining = (150 - points).coerceAtLeast(0),
                progressPercent = pct,
                benefits = listOf(
                    "Remise 5% sur tous les abonnements",
                    "1 pt / 1 000 FCFA"
                )
            )
        }
        else -> {
            val pct = ((points / 50f) * 100f).toInt().coerceIn(0, 100)
            FidelityInfo(
                tierName = "Bronze",
                progress = (points / 50f).coerceIn(0f, 1f),
                nextTierName = "Argent",
                pointsRemaining = (50 - points).coerceAtLeast(0),
                progressPercent = pct,
                benefits = listOf(
                    "1 pt / 1 000 FCFA",
                    "Accès aux récompenses fidélité"
                )
            )
        }
    }

    fun formatShortDate(iso: String?): String {
        if (iso.isNullOrBlank()) return "—"
        return runCatching {
            val instant = Instant.parse(iso)
            val zdt = instant.atZone(ZoneId.systemDefault())
            DateTimeFormatter.ofPattern("dd/MM/yyyy").format(zdt)
        }.getOrElse { iso.take(10) }
    }

    fun haversineKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = kotlin.math.sin(dLat / 2) * kotlin.math.sin(dLat / 2) +
            kotlin.math.cos(Math.toRadians(lat1)) * kotlin.math.cos(Math.toRadians(lat2)) *
            kotlin.math.sin(dLon / 2) * kotlin.math.sin(dLon / 2)
        val c = 2 * kotlin.math.atan2(kotlin.math.sqrt(a), kotlin.math.sqrt(1 - a))
        return r * c
    }

    private fun resolveZoneFee(
        zonesSource: List<DeliveryZone>,
        fallbackZonesSource: List<DeliveryZone>,
        storeId: String?,
        clientLat: Double?,
        clientLng: Double?,
        defaultLabelPrefix: String
    ): ZoneFeeResult {
        val activeStoreId = storeId?.takeIf { it.isNotBlank() && it != "all" && it != "GLOBAL" }
        var zones = zonesSource.filter { it.isActive && (it.storeId == null || activeStoreId == null || it.storeId == activeStoreId) }
        if (zones.isEmpty()) {
            zones = fallbackZonesSource.filter { it.isActive && (it.storeId == null || activeStoreId == null || it.storeId == activeStoreId) }
        }
        if (zones.isEmpty()) {
            zones = (zonesSource + fallbackZonesSource).filter { it.isActive }
        }
        if (zones.isEmpty()) {
            zones = defaultZones
        }
        val sortedZones = zones.sortedBy { it.minKm }
        val defaultFee = sortedZones.firstOrNull()?.fraisLivraison ?: 1000.0
        val defaultLabel = sortedZones.firstOrNull()?.labelZone?.ifBlank { defaultLabelPrefix } ?: defaultLabelPrefix

        if (clientLat == null || clientLng == null || clientLat.isNaN() || clientLng.isNaN()) {
            return ZoneFeeResult(fee = defaultFee, distanceKm = 0.0, zoneLabel = defaultLabel)
        }

        val store = _stores.value.firstOrNull { it.id == activeStoreId || it.code == activeStoreId }
            ?: _stores.value.firstOrNull()
        val sLat = store?.latitude ?: 6.3703
        val sLng = store?.longitude ?: 2.3912

        val distanceKm = haversineKm(sLat, sLng, clientLat, clientLng)
        val roundedKm = kotlin.math.round(distanceKm * 10.0) / 10.0
        val matched = sortedZones.firstOrNull { distanceKm >= it.minKm && distanceKm < it.maxKm }
            ?: sortedZones.lastOrNull()

        return ZoneFeeResult(
            fee = matched?.fraisLivraison ?: defaultFee,
            distanceKm = roundedKm,
            zoneLabel = matched?.labelZone?.ifBlank { defaultLabel } ?: defaultLabel
        )
    }

    fun calculateDeliveryFee(storeId: String?, clientLat: Double?, clientLng: Double?): ZoneFeeResult {
        return resolveZoneFee(
            zonesSource = _deliveryZones.value,
            fallbackZonesSource = defaultZones,
            storeId = storeId,
            clientLat = clientLat,
            clientLng = clientLng,
            defaultLabelPrefix = "Forfait livraison"
        )
    }

    fun calculatePickupFee(storeId: String?, clientLat: Double?, clientLng: Double?): ZoneFeeResult {
        return resolveZoneFee(
            zonesSource = _pickupZones.value,
            fallbackZonesSource = _deliveryZones.value.ifEmpty { defaultZones },
            storeId = storeId,
            clientLat = clientLat,
            clientLng = clientLng,
            defaultLabelPrefix = "Forfait récupération"
        )
    }

    suspend fun updateCustomerLocation(customerId: String, lat: Double, lng: Double) {
        val coordStr = "$lat,$lng"
        _customers.value = _customers.value.map { c ->
            if (c.id == customerId) c.copy(latitude = lat, longitude = lng, coordonneesLivraison = coordStr) else c
        }
        runCatching {
            client.from("customers").update(
                mapOf(
                    "latitude" to lat.toString(),
                    "longitude" to lng.toString(),
                    "coordonnees_livraison" to coordStr
                )
            ) {
                filter { eq("id", customerId) }
            }
        }
    }

    val defaultRewardCatalog: List<RewardCatalogItem> = listOf(
        RewardCatalogItem(
            id = "remise_1000",
            title = "Remise de 1 000 FCFA",
            cost = 30,
            discountAmount = 1000,
            iconName = "Tag",
            description = "Réduction de 1 000 FCFA sur la prochaine commande."
        ),
        RewardCatalogItem(
            id = "lavage_offert",
            title = "Lavage 1 Vêtement Offert",
            cost = 50,
            discountAmount = 2000,
            iconName = "Shirt",
            description = "Un lavage gratuit pour une pièce au choix."
        ),
        RewardCatalogItem(
            id = "livraison_offerte",
            title = "Livraison Offerte",
            cost = 60,
            discountAmount = 1500,
            iconName = "Truck",
            description = "Frais de livraison 100% offerts."
        ),
        RewardCatalogItem(
            id = "repassage_offert",
            title = "Repassage Offert",
            cost = 100,
            discountAmount = 4000,
            iconName = "Sparkles",
            description = "Repassage complet offert sur vos vêtements."
        ),
        RewardCatalogItem(
            id = "remise_5000",
            title = "Remise 5 000 FCFA Abonnement",
            cost = 150,
            discountAmount = 5000,
            iconName = "Gift",
            description = "Réduction de 5 000 FCFA lors du renouvellement d'abonnement."
        )
    )

    fun getRewardCatalog(catalogItems: List<CatalogItem> = _catalog.value): List<RewardCatalogItem> {
        val remote = catalogItems.filter {
            it.service.equals("reward_catalog", ignoreCase = true) && (it.isActive ?: true)
        }
        if (remote.isEmpty()) return defaultRewardCatalog
        return remote.map { item ->
            val fallback = defaultRewardCatalog.firstOrNull { it.id == item.id }
            RewardCatalogItem(
                id = item.id,
                title = item.article.ifBlank { fallback?.title ?: "Récompense" },
                cost = item.prix.toInt().coerceAtLeast(1),
                discountAmount = item.nombreVetements ?: fallback?.discountAmount ?: 0,
                iconName = fallback?.iconName ?: "Gift",
                description = item.categorie.takeIf { it.isNotBlank() && it != "reward_catalog" }
                    ?: fallback?.description
                    ?: "Récompense fidélité client."
            )
        }
    }

    fun getAdminSettings(catalogItems: List<CatalogItem> = _catalog.value): AdminSettings {
        fun num(id: String, fallback: Int): Int =
            catalogItems.firstOrNull { it.id == id }?.prix?.toInt() ?: fallback

        return AdminSettings(
            normalHours = num("setting_normal_hours", 48),
            expressHours = num("setting_express_hours", 6),
            expressMarkup = num("setting_express_markup", 50),
            fidelityActive = num("setting_fidelity_active", 1) != 0,
            fidelitySpendPerPoint = num("setting_fidelity_spend_per_point", 1000).coerceAtLeast(100),
            bronzeMaxPts = num("setting_fidelity_tier_bronze_max_pts", 49),
            silverPts = num("setting_fidelity_tier_silver_pts", 50),
            goldPts = num("setting_fidelity_tier_gold_pts", 150),
            platinumPts = num("setting_fidelity_tier_platinum_pts", 300)
        )
    }

    suspend fun updateAdminSettings(settings: AdminSettings): Result<Unit> = runCatching {
        val rows = listOf(
            SettingCatalogUpsert("setting_normal_hours", "Délai Normal (heures)", prix = settings.normalHours.toDouble()),
            SettingCatalogUpsert("setting_express_hours", "Délai Express (heures)", prix = settings.expressHours.toDouble()),
            SettingCatalogUpsert("setting_express_markup", "Majoration Express (%)", prix = settings.expressMarkup.toDouble()),
            SettingCatalogUpsert("setting_fidelity_active", "Fidélité Active", prix = if (settings.fidelityActive) 1.0 else 0.0),
            SettingCatalogUpsert("setting_fidelity_spend_per_point", "Montant par point (FCFA)", prix = settings.fidelitySpendPerPoint.toDouble())
        )
        client.from("catalog").upsert(rows)
        refreshAll()
    }

    fun formatOrderDate(iso: String?): String {
        if (iso.isNullOrBlank()) return "—"
        return runCatching {
            val instant = Instant.parse(iso)
            val zdt = instant.atZone(ZoneId.systemDefault())
            DateTimeFormatter.ofPattern("dd/MM/yyyy  -  HH : mm").format(zdt)
        }.getOrElse { iso.take(16).replace("T", " - ") }
    }

    fun formatOrderDateOnly(iso: String?): String {
        if (iso.isNullOrBlank()) return "—"
        return runCatching {
            val instant = Instant.parse(iso)
            val zdt = instant.atZone(ZoneId.systemDefault())
            DateTimeFormatter.ofPattern("dd/MM/yyyy").format(zdt)
        }.getOrElse { iso.take(10) }
    }

    private fun sanitizeApiError(err: Throwable, fallback: Throwable? = null): String {
        val raw = err.message ?: fallback?.message ?: return "Erreur lors de l'enregistrement."
        val firstLine = raw.lineSequence().firstOrNull()?.trim().orEmpty()
        return when {
            raw.contains("customers_telephone_key", ignoreCase = true) ||
                raw.contains("duplicate key", ignoreCase = true) ->
                "Un client avec ce numéro de téléphone existe déjà."
            firstLine.isNotBlank() && !firstLine.startsWith("URL:", ignoreCase = true) ->
                firstLine.take(180)
            else -> "Erreur serveur lors de l'enregistrement. Veuillez réessayer."
        }
    }

    suspend fun createExpense(
        category: String,
        label: String,
        amount: Double,
        paymentMethod: String = "especes",
        expenseDate: String = java.time.LocalDate.now().toString(),
        reference: String? = null,
        description: String? = null,
        storeId: String? = null
    ): Result<Expense> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        val cleanLabel = label.trim()
        if (cleanLabel.isEmpty()) {
            return@withContext Result.failure(IllegalArgumentException("Le libellé de la dépense est obligatoire."))
        }
        if (amount <= 0.0) {
            return@withContext Result.failure(IllegalArgumentException("Le montant doit être supérieur à 0 FCFA."))
        }
        val user = requireAuthenticatedUser()
        val effectiveStoreId = when {
            !storeId.isNullOrBlank() && storeId != "all" && storeId != "GLOBAL" -> storeId
            _selectedStoreId.value != "all" && _selectedStoreId.value != "GLOBAL" -> _selectedStoreId.value
            !user.storeId.isNullOrBlank() && user.storeId != "all" -> user.storeId
            else -> "store_central"
        }
        val cleanDate = expenseDate.trim().ifBlank { java.time.LocalDate.now().toString() }
        val newId = "exp_${System.currentTimeMillis()}_${(100..999).random()}"
        val nowIso = Instant.now().toString()
        val payload = Expense(
            id = newId,
            storeId = effectiveStoreId,
            category = category.trim().ifBlank { "autres" },
            label = cleanLabel,
            description = description?.trim()?.takeIf { it.isNotEmpty() },
            amount = amount,
            paymentMethod = paymentMethod.trim().ifBlank { "especes" },
            expenseDate = cleanDate,
            status = "validee",
            reference = reference?.trim()?.takeIf { it.isNotEmpty() },
            createdById = user.id,
            createdByName = user.fullName,
            createdByRole = user.role,
            source = "app",
            createdAt = nowIso,
            updatedAt = nowIso
        )

        val inserted = runCatching {
            val rpcResult = client.postgrest.rpc(
                "create_expense",
                buildJsonObject {
                    put("p_store_id", payload.storeId)
                    put("p_category", payload.category)
                    put("p_label", payload.label)
                    if (payload.description != null) put("p_description", payload.description)
                    put("p_amount", payload.amount)
                    put("p_payment_method", payload.paymentMethod)
                    put("p_expense_date", payload.expenseDate)
                    if (payload.reference != null) put("p_reference", payload.reference)
                    if (payload.createdById != null) put("p_created_by_id", payload.createdById)
                    if (payload.createdByName != null) put("p_created_by_name", payload.createdByName)
                    if (payload.createdByRole != null) put("p_created_by_role", payload.createdByRole)
                    put("p_source", "app")
                    put("p_status", "validee")
                }
            ).decodeAs<Expense>()
            rpcResult
        }.getOrElse { rpcErr ->
            runCatching {
                client.from("expenses").insert(payload)
                payload
            }.getOrElse { insertErr ->
                return@withContext Result.failure(Exception(sanitizeApiError(insertErr, rpcErr)))
            }
        }

        _expenses.value = listOf(inserted) + _expenses.value.filterNot { it.id == inserted.id }
        logSecurityEvent(
            user,
            "CREATION_DEPENSE",
            "Dépense \"${inserted.label}\" (${inserted.category}) : ${inserted.amount.toInt()} FCFA [${inserted.paymentMethod}]"
        )
        Result.success(inserted)
    }

    suspend fun deleteExpense(expenseId: String, reason: String): Result<Unit> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        val user = requireAuthenticatedUser()
        val cleanReason = reason.trim()
        if (cleanReason.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("Un motif de suppression est obligatoire."))
        }
        val targetLabel = _expenses.value.firstOrNull { it.id == expenseId }?.label ?: expenseId
        runCatching {
            client.from("expenses").delete {
                filter { eq("id", expenseId) }
            }
        }.onFailure { err ->
            return@withContext Result.failure(Exception(sanitizeApiError(err)))
        }
        _expenses.value = _expenses.value.filterNot { it.id == expenseId }
        logSecurityEvent(user, "SUPPRESSION_DEPENSE", "Dépense \"$targetLabel\" ($expenseId) supprimée — Motif : $cleanReason")
        Result.success(Unit)
    }

    suspend fun uploadExpenseReceipt(
        context: Context,
        expenseId: String,
        uri: Uri
    ): Result<Expense> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        val user = requireAuthenticatedUser()
        val resolver = context.contentResolver

        val displayName = resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (idx >= 0) cursor.getString(idx) else null
            } else null
        }?.trim()?.takeIf { it.isNotBlank() } ?: "facture_${System.currentTimeMillis()}"

        val detectedMime = resolver.getType(uri)?.lowercase()?.trim().orEmpty()
        val extFromName = displayName.substringAfterLast('.', "").lowercase()
        val resolvedMime = when {
            detectedMime.startsWith("image/") -> detectedMime
            detectedMime == "application/pdf" -> "application/pdf"
            extFromName == "pdf" -> "application/pdf"
            extFromName in setOf("jpg", "jpeg") -> "image/jpeg"
            extFromName == "png" -> "image/png"
            extFromName == "webp" -> "image/webp"
            extFromName == "heic" -> "image/heic"
            extFromName == "heif" -> "image/heif"
            else -> ""
        }
        if (resolvedMime.isBlank()) {
            return@withContext Result.failure(
                IllegalArgumentException("Format non supporté. Veuillez choisir une image (JPG, PNG, WEBP) ou un fichier PDF.")
            )
        }

        val bytes = runCatching {
            resolver.openInputStream(uri)?.use { it.readBytes() }
        }.getOrNull() ?: return@withContext Result.failure(
            IllegalStateException("Impossible de lire le fichier sélectionné.")
        )

        if (bytes.isEmpty()) {
            return@withContext Result.failure(IllegalArgumentException("Le fichier sélectionné est vide."))
        }
        if (bytes.size > 10 * 1024 * 1024) {
            return@withContext Result.failure(IllegalArgumentException("Le fichier dépasse la limite de 10 Mo."))
        }

        val fileExt = when (resolvedMime) {
            "application/pdf" -> "pdf"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/heic" -> "heic"
            "image/heif" -> "heif"
            else -> "jpg"
        }
        val safeBase = displayName.substringBeforeLast('.')
            .replace(Regex("[^A-Za-z0-9_-]"), "_")
            .take(40)
            .ifBlank { "facture" }
        val storagePath = "$expenseId/${System.currentTimeMillis()}_$safeBase.$fileExt"
        val baseUrl = SupabaseClientProvider.SUPABASE_URL.trimEnd('/')
        val uploadUrl = "$baseUrl/storage/v1/object/expense-receipts/$storagePath"

        val http = HttpClient(Android)
        val uploadResp = runCatching {
            http.post(uploadUrl) {
                header("apikey", SupabaseClientProvider.SUPABASE_KEY)
                header("Authorization", "Bearer ${SupabaseClientProvider.SUPABASE_KEY}")
                header("x-upsert", "true")
                contentType(ContentType.parse(resolvedMime))
                setBody(bytes)
            }
        }.also {
            runCatching { http.close() }
        }.getOrElse { err ->
            return@withContext Result.failure(Exception(sanitizeApiError(err)))
        }

        if (!uploadResp.status.isSuccess()) {
            val errBody = runCatching { uploadResp.bodyAsText() }.getOrDefault("")
            return@withContext Result.failure(
                Exception(
                    if (errBody.contains("Bucket not found", ignoreCase = true)) {
                        "Bucket de stockage 'expense-receipts' introuvable. Exécutez la migration SQL schema_expense_receipt.sql."
                    } else {
                        "Échec du téléversement (${uploadResp.status.value}) : ${errBody.ifBlank { "erreur serveur" }}"
                    }
                )
            )
        }

        val publicUrl = "$baseUrl/storage/v1/object/public/expense-receipts/$storagePath"
        val patch = ExpenseReceiptPatch(
            receiptUrl = publicUrl,
            receiptName = displayName,
            receiptMimeType = resolvedMime
        )
        runCatching {
            client.from("expenses").update(patch) {
                filter { eq("id", expenseId) }
            }
        }.onFailure { err ->
            return@withContext Result.failure(Exception(sanitizeApiError(err)))
        }

        val existing = _expenses.value.firstOrNull { it.id == expenseId }
        val updated = (existing ?: Expense(id = expenseId)).copy(
            receiptUrl = publicUrl,
            receiptName = displayName,
            receiptMimeType = resolvedMime
        )
        _expenses.value = _expenses.value.map { if (it.id == expenseId) updated else it }
        logSecurityEvent(
            user,
            "TELEVERSEMENT_FACTURE_DEPENSE",
            "Facture \"$displayName\" ($resolvedMime) jointe à la dépense \"${updated.label}\" ($expenseId)"
        )
        Result.success(updated)
    }

    suspend fun deleteExpenseReceipt(expenseId: String): Result<Expense> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        val user = requireAuthenticatedUser()
        val patch = ExpenseReceiptPatch(
            receiptUrl = null,
            receiptName = null,
            receiptMimeType = null
        )
        runCatching {
            client.from("expenses").update(patch) {
                filter { eq("id", expenseId) }
            }
        }.onFailure { err ->
            return@withContext Result.failure(Exception(sanitizeApiError(err)))
        }
        val existing = _expenses.value.firstOrNull { it.id == expenseId }
        val updated = (existing ?: Expense(id = expenseId)).copy(
            receiptUrl = null,
            receiptName = null,
            receiptMimeType = null
        )
        _expenses.value = _expenses.value.map { if (it.id == expenseId) updated else it }
        logSecurityEvent(user, "SUPPRESSION_FACTURE_DEPENSE", "Facture retirée de la dépense \"${updated.label}\" ($expenseId)")
        Result.success(updated)
    }

    fun resolveStaffName(staffId: String?): String? {
        val clean = staffId?.trim().orEmpty()
        if (clean.isBlank()) return null
        return _staffList.value.firstOrNull { it.id == clean }?.fullName?.takeIf { it.isNotBlank() }
    }

    suspend fun getOrderHandlers(order: Order): Pair<String?, String?> = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
        var createdBy = order.createdByName?.takeIf { it.isNotBlank() } ?: resolveStaffName(order.createdById)
        var processedBy: String? = null

        val logs = runCatching {
            client.from("activity_logs")
                .select {
                    filter { ilike("details", "%${order.id}%") }
                    order("timestamp", order = PostgrestOrder.DESCENDING)
                    limit(20)
                }
                .decodeList<ActivityLogRecord>()
        }.getOrDefault(emptyList())

        for (log in logs) {
            val actor = log.userName?.takeIf { it.isNotBlank() } ?: resolveStaffName(log.userId) ?: continue
            val act = log.action.uppercase()
            if (act.contains("CREATION")) {
                if (createdBy == null) createdBy = actor
            } else if (processedBy == null) {
                processedBy = actor
            }
        }

        createdBy to (processedBy ?: createdBy)
    }

    fun parseInstant(iso: String?): Instant? {
        if (iso.isNullOrBlank()) return null
        return runCatching { Instant.parse(iso) }.getOrNull()
    }
}
