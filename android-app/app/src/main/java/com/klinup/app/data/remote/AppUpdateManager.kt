package com.klinup.app.data.remote

import com.google.firebase.appdistribution.FirebaseAppDistribution
import com.google.firebase.appdistribution.FirebaseAppDistributionException
import kotlinx.coroutines.tasks.await

data class AppUpdateInfo(
    val versionCode: Int,
    val versionName: String,
    val releaseNotes: String = "",
    val mandatory: Boolean = false
)

sealed class UpdateCheckResult {
    data class UpdateAvailable(val info: AppUpdateInfo) : UpdateCheckResult()
    data object UpToDate : UpdateCheckResult()
    data class Error(val message: String) : UpdateCheckResult()
}

/**
 * Gestionnaire de mises à jour OTA natif via App Distribution (aucune mention technique externe en UI).
 */
object AppUpdateManager {

    suspend fun checkForUpdate(): UpdateCheckResult {
        return try {
            val dist = FirebaseAppDistribution.getInstance()
            if (!dist.isTesterSignedIn) {
                dist.signInTester().await()
            }
            val release = dist.checkForNewRelease().await()
            if (release == null) {
                UpdateCheckResult.UpToDate
            } else {
                UpdateCheckResult.UpdateAvailable(
                    AppUpdateInfo(
                        versionCode = release.versionCode.toInt(),
                        versionName = release.displayVersion.ifBlank { release.versionCode.toString() },
                        releaseNotes = release.releaseNotes.orEmpty().trim(),
                        mandatory = false
                    )
                )
            }
        } catch (e: FirebaseAppDistributionException) {
            val msg = when (e.errorCode) {
                FirebaseAppDistributionException.Status.AUTHENTICATION_CANCELED ->
                    "Vérification annulée."
                FirebaseAppDistributionException.Status.AUTHENTICATION_FAILURE ->
                    "Authentification requise pour vérifier les mises à jour."
                FirebaseAppDistributionException.Status.NETWORK_FAILURE ->
                    "Impossible de vérifier les mises à jour. Vérifiez votre connexion internet."
                else ->
                    "Aucune mise à jour accessible pour ce compte."
            }
            UpdateCheckResult.Error(msg)
        } catch (e: Exception) {
            UpdateCheckResult.Error("Impossible de vérifier les mises à jour. Vérifiez votre connexion internet.")
        }
    }

    suspend fun downloadAndInstallUpdate(
        onProgress: (Int) -> Unit
    ): Result<Unit> {
        return try {
            val dist = FirebaseAppDistribution.getInstance()
            val updateTask = dist.updateApp()
            updateTask.addOnProgressListener { progress ->
                val total = progress.apkFileTotalBytes
                if (total > 0L) {
                    val pct = ((progress.apkBytesDownloaded * 100L) / total).toInt().coerceIn(0, 100)
                    onProgress(pct)
                }
            }
            updateTask.await()
            onProgress(100)
            Result.success(Unit)
        } catch (e: FirebaseAppDistributionException) {
            val msg = when (e.errorCode) {
                FirebaseAppDistributionException.Status.DOWNLOAD_FAILURE ->
                    "Échec du téléchargement de la mise à jour."
                FirebaseAppDistributionException.Status.INSTALLATION_CANCELED ->
                    "Installation annulée."
                FirebaseAppDistributionException.Status.INSTALLATION_FAILURE ->
                    "Échec de l'installation de la mise à jour."
                FirebaseAppDistributionException.Status.NETWORK_FAILURE ->
                    "Connexion interrompue pendant le téléchargement."
                else ->
                    "La mise à jour n'a pas pu être installée."
            }
            Result.failure(IllegalStateException(msg))
        } catch (e: Exception) {
            Result.failure(IllegalStateException("Échec du téléchargement de la mise à jour."))
        }
    }
}
