package com.klinup.app.data.local

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File

enum class ThemeMode(val label: String) { SYSTEM("Système"), LIGHT("Clair"), DARK("Sombre") }

/**
 * Préférences locales de l'appareil (aucune donnée envoyée en base).
 */
object AppPreferences {
    private const val PREFS = "klinup_prefs"
    private const val KEY_THEME = "theme_mode"
    private const val KEY_HIDE_AMOUNTS = "hide_amounts"
    private lateinit var prefs: SharedPreferences
    private lateinit var filesDir: File

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    private val _hideAmounts = MutableStateFlow(false)
    val hideAmounts: StateFlow<Boolean> = _hideAmounts.asStateFlow()

    /** Incrémenté à chaque changement de photo pour forcer le rechargement. */
    private val _avatarVersion = MutableStateFlow(0)
    val avatarVersion: StateFlow<Int> = _avatarVersion.asStateFlow()

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        filesDir = context.filesDir
        _themeMode.value = runCatching {
            ThemeMode.valueOf(prefs.getString(KEY_THEME, ThemeMode.SYSTEM.name)!!)
        }.getOrDefault(ThemeMode.SYSTEM)
        _hideAmounts.value = prefs.getBoolean(KEY_HIDE_AMOUNTS, false)
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
        prefs.edit().putString(KEY_THEME, mode.name).apply()
    }

    fun setHideAmounts(hide: Boolean) {
        _hideAmounts.value = hide
        if (::prefs.isInitialized) {
            prefs.edit().putBoolean(KEY_HIDE_AMOUNTS, hide).apply()
        }
    }

    fun toggleHideAmounts() {
        setHideAmounts(!_hideAmounts.value)
    }

    fun maskAmount(formattedAmount: String, hidden: Boolean = _hideAmounts.value): String {
        return if (hidden) "•••••• FCFA" else formattedAmount
    }

    fun avatarFile(userId: String): File = File(filesDir, "avatar_$userId.jpg")

    suspend fun saveAvatar(context: Context, userId: String, uri: Uri): Boolean = withContext(Dispatchers.IO) {
        runCatching {
            context.contentResolver.openInputStream(uri)?.use { input ->
                avatarFile(userId).outputStream().use { input.copyTo(it) }
            } ?: return@runCatching false
            true
        }.getOrDefault(false).also { if (it) _avatarVersion.value++ }
    }

    fun removeAvatar(userId: String) {
        avatarFile(userId).delete()
        _avatarVersion.value++
    }
}
