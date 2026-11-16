# ==============================================================================
# KLIN UP - Lanceur Principal Application Mobile Android (Kotlin & Compose)
# ==============================================================================

$androidDir = Join-Path $PSScriptRoot "android-app"
$gradlew = Join-Path $androidDir "gradlew.bat"

if (Test-Path $gradlew) {
    Write-Host "[KLIN UP] Lancement de la compilation Gradle (Android Native)..." -ForegroundColor Cyan
    Set-Location $androidDir
    & ".\gradlew.bat" assembleDebug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[SUCCES] APK Debug genere dans android-app\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
    } else {
        Write-Host "`n[ERREUR] Echec de la compilation avec le code $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "[ERREUR] Impossible de trouver $gradlew" -ForegroundColor Red
}

Read-Host "Appuyez sur Entree pour quitter..."
