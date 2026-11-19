package com.klinup.app.data.remote

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.klinup.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val releaseNotes: String = "",
    val mandatory: Boolean = false
)

sealed class UpdateCheckResult {
    data class UpdateAvailable(val info: AppUpdateInfo) : UpdateCheckResult()
    data object UpToDate : UpdateCheckResult()
    data class Error(val message: String) : UpdateCheckResult()
}

/**
 * Gestionnaire de mises à jour 100% in-app (aucune redirection navigateur, aucune mention technique externe).
 */
object AppUpdateManager {

    private val normalizedEnv: String
        get() = when (BuildConfig.APP_ENV.lowercase()) {
            "production", "prod" -> "production"
            "staging", "beta" -> "staging"
            else -> "test"
        }

    private val manifestUrl: String
        get() = "https://github.com/amgraphicsbenin/laverie_klinup/releases/download/ota-$normalizedEnv/latest.json"

    suspend fun checkForUpdate(): UpdateCheckResult = withContext(Dispatchers.IO) {
        try {
            val (code, json) = fetchJsonWithCode(manifestUrl)
            if (code == 404) {
                return@withContext UpdateCheckResult.UpToDate
            }
            if (json == null) {
                return@withContext UpdateCheckResult.Error("Impossible de vérifier les mises à jour (code $code).")
            }
            val versionCode = json.optInt("versionCode", json.optInt("version_code", -1))
            val versionName = json.optString("versionName", json.optString("version_name", "")).trim()
            val apkUrl = json.optString("apkUrl", json.optString("apk_url", "")).trim()
            val notes = json.optString("releaseNotes", json.optString("release_notes", "")).trim()
            val mandatory = json.optBoolean("mandatory", false)

            if (versionCode <= 0 || apkUrl.isBlank()) {
                return@withContext UpdateCheckResult.UpToDate
            }

            val info = AppUpdateInfo(
                versionCode = versionCode,
                versionName = versionName.ifBlank { versionCode.toString() },
                apkUrl = apkUrl,
                releaseNotes = notes,
                mandatory = mandatory
            )
            if (isUpdateNewer(info)) {
                UpdateCheckResult.UpdateAvailable(info)
            } else {
                UpdateCheckResult.UpToDate
            }
        } catch (e: Exception) {
            UpdateCheckResult.Error("Impossible de vérifier les mises à jour. Vérifiez votre connexion internet.")
        }
    }

    suspend fun downloadApk(
        context: Context,
        apkUrl: String,
        onProgress: (Int) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        runCatching {
            val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }
            val outFile = File(updatesDir, "klinup-update.apk")
            if (outFile.exists()) outFile.delete()

            val conn = openFollowingRedirects(apkUrl, connectTimeoutMs = 15_000, readTimeoutMs = 45_000)
            try {
                val code = conn.responseCode
                if (code !in 200..299) {
                    throw IllegalStateException("Téléchargement impossible (code $code).")
                }
                val totalBytes = conn.contentLengthLong
                var downloaded = 0L
                val buffer = ByteArray(8192)

                conn.inputStream.use { input ->
                    outFile.outputStream().use { output ->
                        while (true) {
                            val read = input.read(buffer)
                            if (read <= 0) break
                            output.write(buffer, 0, read)
                            downloaded += read
                            if (totalBytes > 0L) {
                                val pct = ((downloaded * 100L) / totalBytes).toInt().coerceIn(0, 100)
                                onProgress(pct)
                            }
                        }
                    }
                }
                onProgress(100)
                outFile
            } finally {
                conn.disconnect()
            }
        }
    }

    fun installApk(context: Context, apkFile: File): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
            val settingsIntent = Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            runCatching { context.startActivity(settingsIntent) }
            return false
        }

        val apkUri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            apkFile
        )
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(installIntent)
        return true
    }

    private fun isUpdateNewer(info: AppUpdateInfo): Boolean {
        if (info.versionCode > BuildConfig.VERSION_CODE) return true
        if (info.versionCode == BuildConfig.VERSION_CODE) {
            return isNewerSemver(info.versionName, BuildConfig.VERSION_NAME)
        }
        return false
    }

    private fun isNewerSemver(remote: String, current: String): Boolean {
        val rParts = remote.trim().removePrefix("v").split(".").map { it.toIntOrNull() ?: 0 }
        val cParts = current.trim().removePrefix("v").split(".").map { it.toIntOrNull() ?: 0 }
        val maxLen = maxOf(rParts.size, cParts.size)
        for (i in 0 until maxLen) {
            val r = rParts.getOrElse(i) { 0 }
            val c = cParts.getOrElse(i) { 0 }
            if (r != c) return r > c
        }
        return false
    }

    private fun fetchJsonWithCode(urlString: String): Pair<Int, JSONObject?> {
        val conn = openFollowingRedirects(urlString, connectTimeoutMs = 8_000, readTimeoutMs = 8_000)
        return try {
            val code = conn.responseCode
            if (code !in 200..299) return code to null
            val body = conn.inputStream?.bufferedReader()?.use { it.readText() } ?: return code to null
            code to JSONObject(body)
        } finally {
            conn.disconnect()
        }
    }

    private fun openFollowingRedirects(
        urlString: String,
        connectTimeoutMs: Int,
        readTimeoutMs: Int
    ): HttpURLConnection {
        var currentUrl = urlString
        repeat(5) {
            val conn = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = connectTimeoutMs
                readTimeout = readTimeoutMs
                instanceFollowRedirects = false
                setRequestProperty("User-Agent", "KlinUpAndroidApp/${BuildConfig.VERSION_NAME}")
                setRequestProperty("Cache-Control", "no-cache")
            }
            val code = conn.responseCode
            if (code in setOf(301, 302, 303, 307, 308)) {
                val location = conn.getHeaderField("Location")
                conn.disconnect()
                if (location.isNullOrBlank()) return conn
                currentUrl = URL(URL(currentUrl), location).toString()
            } else {
                return conn
            }
        }
        return (URL(currentUrl).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
        }
    }
}
