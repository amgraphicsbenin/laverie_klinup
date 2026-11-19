package com.klinup.app.data.remote

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.klinup.app.BuildConfig
import com.klinup.app.data.local.NetworkMonitor
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedOutputStream
import java.io.File
import java.io.RandomAccessFile
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

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
            if (!NetworkMonitor.isOnline.value) {
                return@withContext UpdateCheckResult.Error(
                    "Connexion internet requise pour vérifier les mises à jour."
                )
            }
            val (code, json) = fetchJsonWithCode(manifestUrl)
            if (code == 404) {
                return@withContext UpdateCheckResult.UpToDate
            }
            if (json == null) {
                return@withContext UpdateCheckResult.Error("Impossible de vérifier les mises à jour pour le moment.")
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
            UpdateCheckResult.Error(
                NetworkMonitor.friendlyErrorMessage(
                    e,
                    actionHint = "vérifier les mises à jour",
                    fallback = "Impossible de vérifier les mises à jour. Vérifiez votre connexion internet."
                )
            )
        }
    }

    private const val IO_BUFFER_SIZE = 128 * 1024 // 128 Ko pour limiter les appels système
    private const val MIN_PARALLEL_BYTES = 1L * 1024L * 1024L // 1 Mo
    private const val LARGE_FILE_BYTES = 4L * 1024L * 1024L // 4 Mo
    private const val CHUNKS_MEDIUM = 4
    private const val CHUNKS_LARGE = 6
    private const val MAX_CHUNK_RETRIES = 2

    private data class DownloadProbe(
        val finalUrl: String,
        val totalBytes: Long,
        val supportsRanges: Boolean
    )

    suspend fun downloadApk(
        context: Context,
        apkUrl: String,
        onProgress: (Int) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        val updatesDir = File(context.cacheDir, "updates").apply { mkdirs() }
        val outFile = File(updatesDir, "klinup-update.apk")
        val tempFile = File(updatesDir, "klinup-update.apk.part")
        try {
            if (tempFile.exists()) tempFile.delete()
            if (outFile.exists()) outFile.delete()

            val probe = try {
                probeDownload(apkUrl)
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                null
            }
            currentCoroutineContext().ensureActive()

            val downloadedInParallel = if (
                probe != null &&
                probe.supportsRanges &&
                probe.totalBytes >= MIN_PARALLEL_BYTES
            ) {
                try {
                    downloadParallelChunks(
                        finalUrl = probe.finalUrl,
                        totalBytes = probe.totalBytes,
                        tempFile = tempFile,
                        onProgress = onProgress
                    )
                    true
                } catch (e: CancellationException) {
                    throw e
                } catch (_: Exception) {
                    if (tempFile.exists()) tempFile.delete()
                    false
                }
            } else {
                false
            }

            if (!downloadedInParallel) {
                downloadSingleStream(
                    url = probe?.finalUrl ?: apkUrl,
                    tempFile = tempFile,
                    onProgress = onProgress
                )
            }

            currentCoroutineContext().ensureActive()
            if (!tempFile.renameTo(outFile)) {
                tempFile.copyTo(outFile, overwrite = true)
                tempFile.delete()
            }
            onProgress(100)
            Result.success(outFile)
        } catch (e: CancellationException) {
            if (tempFile.exists()) tempFile.delete()
            throw e
        } catch (e: Exception) {
            if (tempFile.exists()) tempFile.delete()
            Result.failure(e)
        }
    }

    private fun probeDownload(apkUrl: String): DownloadProbe {
        val (finalUrl, conn) = openFollowingRedirects(
            urlString = apkUrl,
            connectTimeoutMs = 10_000,
            readTimeoutMs = 15_000,
            extraHeaders = mapOf(
                "Range" to "bytes=0-0",
                "Accept-Encoding" to "identity"
            )
        )
        return try {
            val code = conn.responseCode
            if (code == HttpURLConnection.HTTP_PARTIAL) {
                val contentRange = conn.getHeaderField("Content-Range").orEmpty()
                val total = Regex("""bytes\s+\d+-\d+/(\d+)""")
                    .find(contentRange)
                    ?.groupValues
                    ?.getOrNull(1)
                    ?.toLongOrNull()
                    ?: -1L
                runCatching { conn.inputStream?.close() }
                DownloadProbe(finalUrl = finalUrl, totalBytes = total, supportsRanges = total > 0L)
            } else {
                val total = conn.contentLengthLong
                runCatching { conn.inputStream?.close() }
                DownloadProbe(finalUrl = finalUrl, totalBytes = total, supportsRanges = false)
            }
        } finally {
            conn.disconnect()
        }
    }

    private suspend fun downloadParallelChunks(
        finalUrl: String,
        totalBytes: Long,
        tempFile: File,
        onProgress: (Int) -> Unit
    ) = coroutineScope {
        RandomAccessFile(tempFile, "rw").use { raf ->
            raf.setLength(totalBytes)
        }

        val chunkCount = if (totalBytes >= LARGE_FILE_BYTES) CHUNKS_LARGE else CHUNKS_MEDIUM
        val chunkSize = totalBytes / chunkCount
        val totalDownloaded = AtomicLong(0L)
        val lastReportedPct = AtomicInteger(-1)

        val jobs = (0 until chunkCount).map { idx ->
            val start = idx * chunkSize
            val end = if (idx == chunkCount - 1) totalBytes - 1L else (start + chunkSize - 1L)
            async(Dispatchers.IO) {
                downloadChunkWithRetry(
                    finalUrl = finalUrl,
                    start = start,
                    end = end,
                    tempFile = tempFile,
                    totalBytes = totalBytes,
                    totalDownloaded = totalDownloaded,
                    lastReportedPct = lastReportedPct,
                    onProgress = onProgress
                )
            }
        }
        jobs.awaitAll()

        if (totalDownloaded.get() != totalBytes || tempFile.length() != totalBytes) {
            throw IllegalStateException("Téléchargement incomplet (${totalDownloaded.get()}/$totalBytes octets).")
        }
    }

    private suspend fun downloadChunkWithRetry(
        finalUrl: String,
        start: Long,
        end: Long,
        tempFile: File,
        totalBytes: Long,
        totalDownloaded: AtomicLong,
        lastReportedPct: AtomicInteger,
        onProgress: (Int) -> Unit
    ) {
        var currentPos = start
        var attempt = 0
        val buffer = ByteArray(IO_BUFFER_SIZE)

        while (currentPos <= end) {
            currentCoroutineContext().ensureActive()
            try {
                val (_, conn) = openFollowingRedirects(
                    urlString = finalUrl,
                    connectTimeoutMs = 15_000,
                    readTimeoutMs = 45_000,
                    extraHeaders = mapOf(
                        "Range" to "bytes=$currentPos-$end",
                        "Accept-Encoding" to "identity",
                        "Connection" to "keep-alive"
                    )
                )
                try {
                    val code = conn.responseCode
                    if (code != HttpURLConnection.HTTP_PARTIAL) {
                        throw IllegalStateException("Le serveur ne supporte pas le téléchargement parallèle (code $code).")
                    }
                    conn.inputStream.use { input ->
                        RandomAccessFile(tempFile, "rw").use { raf ->
                            raf.seek(currentPos)
                            while (currentPos <= end) {
                                currentCoroutineContext().ensureActive()
                                val remaining = (end - currentPos + 1L).coerceAtMost(buffer.size.toLong()).toInt()
                                val read = input.read(buffer, 0, remaining)
                                if (read <= 0) break
                                raf.write(buffer, 0, read)
                                currentPos += read
                                val done = totalDownloaded.addAndGet(read.toLong())
                                emitMonotonicProgress(done, totalBytes, lastReportedPct, onProgress)
                            }
                        }
                    }
                } finally {
                    conn.disconnect()
                }
                if (currentPos <= end) {
                    throw IllegalStateException("Flux interrompu prématurément sur le segment $start-$end.")
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                attempt++
                if (attempt > MAX_CHUNK_RETRIES) throw e
            }
        }
    }

    private suspend fun downloadSingleStream(
        url: String,
        tempFile: File,
        onProgress: (Int) -> Unit
    ) {
        val (_, conn) = openFollowingRedirects(
            urlString = url,
            connectTimeoutMs = 15_000,
            readTimeoutMs = 60_000,
            extraHeaders = mapOf("Accept-Encoding" to "identity")
        )
        try {
            val code = conn.responseCode
            if (code !in 200..299) {
                throw IllegalStateException("Téléchargement impossible (code $code).")
            }
            val totalBytes = conn.contentLengthLong
            var downloaded = 0L
            val lastReportedPct = AtomicInteger(-1)
            val buffer = ByteArray(IO_BUFFER_SIZE)

            conn.inputStream.use { input ->
                BufferedOutputStream(tempFile.outputStream(), IO_BUFFER_SIZE).use { output ->
                    while (true) {
                        currentCoroutineContext().ensureActive()
                        val read = input.read(buffer)
                        if (read <= 0) break
                        output.write(buffer, 0, read)
                        downloaded += read
                        if (totalBytes > 0L) {
                            emitMonotonicProgress(downloaded, totalBytes, lastReportedPct, onProgress)
                        }
                    }
                    output.flush()
                }
            }
        } finally {
            conn.disconnect()
        }
    }

    private fun emitMonotonicProgress(
        downloaded: Long,
        totalBytes: Long,
        lastReportedPct: AtomicInteger,
        onProgress: (Int) -> Unit
    ) {
        if (totalBytes <= 0L) return
        val pct = ((downloaded * 100L) / totalBytes).toInt().coerceIn(0, 99)
        while (true) {
            val prev = lastReportedPct.get()
            if (pct <= prev) return
            if (lastReportedPct.compareAndSet(prev, pct)) {
                onProgress(pct)
                return
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
        val (_, conn) = openFollowingRedirects(urlString, connectTimeoutMs = 8_000, readTimeoutMs = 8_000)
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
        readTimeoutMs: Int,
        extraHeaders: Map<String, String> = emptyMap()
    ): Pair<String, HttpURLConnection> {
        var currentUrl = urlString
        repeat(5) {
            val conn = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = connectTimeoutMs
                readTimeout = readTimeoutMs
                instanceFollowRedirects = false
                setRequestProperty("User-Agent", "KlinUpAndroidApp/${BuildConfig.VERSION_NAME}")
                setRequestProperty("Cache-Control", "no-cache")
                extraHeaders.forEach { (k, v) -> setRequestProperty(k, v) }
            }
            val code = conn.responseCode
            if (code in setOf(301, 302, 303, 307, 308)) {
                val location = conn.getHeaderField("Location")
                conn.disconnect()
                if (location.isNullOrBlank()) return currentUrl to conn
                currentUrl = URL(URL(currentUrl), location).toString()
            } else {
                return currentUrl to conn
            }
        }
        val finalConn = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
            setRequestProperty("User-Agent", "KlinUpAndroidApp/${BuildConfig.VERSION_NAME}")
            extraHeaders.forEach { (k, v) -> setRequestProperty(k, v) }
        }
        return currentUrl to finalConn
    }
}
