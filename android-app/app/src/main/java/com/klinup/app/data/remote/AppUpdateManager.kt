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
 * Gestionnaire de mises à jour OTA de l'application mobile (sans mention technique externe).
 */
object AppUpdateManager {

    private const val STORAGE_BUCKET = "klinup-apps.firebasestorage.app"
    private const val PROJECT_ID = "klinup-apps"

    private val storageManifestUrls = listOf(
        "https://firebasestorage.googleapis.com/v0/b/$STORAGE_BUCKET/o/app-updates%2Flatest.json?alt=media",
        "https://firebasestorage.googleapis.com/v0/b/$STORAGE_BUCKET/o/updates%2Flatest.json?alt=media"
    )

    private const val FIRESTORE_DOC_URL =
        "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/app_updates/android"

    suspend fun checkForUpdate(): UpdateCheckResult = withContext(Dispatchers.IO) {
        var sawNetworkError = false

        // 1. Vérification via le manifeste JSON distant
        for (url in storageManifestUrls) {
            val res = runCatching { fetchJson(url) }.getOrElse {
                sawNetworkError = true
                null
            } ?: continue

            val info = parseStorageManifest(res) ?: continue
            return@withContext if (info.versionCode > BuildConfig.VERSION_CODE && info.apkUrl.isNotBlank()) {
                UpdateCheckResult.UpdateAvailable(info)
            } else {
                UpdateCheckResult.UpToDate
            }
        }

        // 2. Repli via le document de configuration distant
        val docJson = runCatching { fetchJson(FIRESTORE_DOC_URL) }.getOrElse {
            sawNetworkError = true
            null
        }
        if (docJson != null) {
            val info = parseFirestoreDocument(docJson)
            if (info != null) {
                return@withContext if (info.versionCode > BuildConfig.VERSION_CODE && info.apkUrl.isNotBlank()) {
                    UpdateCheckResult.UpdateAvailable(info)
                } else {
                    UpdateCheckResult.UpToDate
                }
            }
        }

        if (sawNetworkError) {
            UpdateCheckResult.Error("Impossible de vérifier les mises à jour. Vérifiez votre connexion internet.")
        } else {
            UpdateCheckResult.UpToDate
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

            val conn = (URL(apkUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 15_000
                readTimeout = 30_000
                instanceFollowRedirects = true
            }
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

    private fun fetchJson(urlString: String): JSONObject? {
        val conn = (URL(urlString).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 6000
            readTimeout = 6000
            setRequestProperty("Accept", "application/json")
        }
        return try {
            val code = conn.responseCode
            if (code !in 200..299) return null
            val body = conn.inputStream?.bufferedReader()?.use { it.readText() } ?: return null
            JSONObject(body)
        } finally {
            conn.disconnect()
        }
    }

    private fun parseStorageManifest(json: JSONObject): AppUpdateInfo? {
        val versionCode = json.optInt("versionCode", json.optInt("version_code", -1))
        val versionName = json.optString("versionName", json.optString("version_name", "")).trim()
        val apkUrl = json.optString("apkUrl", json.optString("apk_url", json.optString("downloadUrl", ""))).trim()
        if (versionCode <= 0 || apkUrl.isBlank()) return null
        return AppUpdateInfo(
            versionCode = versionCode,
            versionName = versionName.ifBlank { versionCode.toString() },
            apkUrl = apkUrl,
            releaseNotes = json.optString("releaseNotes", json.optString("release_notes", "")).trim(),
            mandatory = json.optBoolean("mandatory", false)
        )
    }

    private fun parseFirestoreDocument(json: JSONObject): AppUpdateInfo? {
        val fields = json.optJSONObject("fields") ?: return null
        fun strField(vararg names: String): String {
            for (n in names) {
                val v = fields.optJSONObject(n)?.optString("stringValue")?.trim()
                if (!v.isNullOrBlank()) return v
            }
            return ""
        }
        fun intField(vararg names: String): Int {
            for (n in names) {
                val obj = fields.optJSONObject(n) ?: continue
                obj.optString("integerValue").toIntOrNull()?.let { return it }
                obj.optString("stringValue").toIntOrNull()?.let { return it }
            }
            return -1
        }
        val versionCode = intField("versionCode", "version_code")
        val apkUrl = strField("apkUrl", "apk_url", "downloadUrl")
        if (versionCode <= 0 || apkUrl.isBlank()) return null
        val versionName = strField("versionName", "version_name").ifBlank { versionCode.toString() }
        val notes = strField("releaseNotes", "release_notes")
        val mandatory = fields.optJSONObject("mandatory")?.optBoolean("booleanValue", false) ?: false
        return AppUpdateInfo(
            versionCode = versionCode,
            versionName = versionName,
            apkUrl = apkUrl,
            releaseNotes = notes,
            mandatory = mandatory
        )
    }
}
