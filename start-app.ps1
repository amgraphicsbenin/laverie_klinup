# ==============================================================================
# Pressing Pro - Lanceur Principal (Racine)
# ==============================================================================

$mobileStart = Join-Path $PSScriptRoot "mobile-app\start.ps1"

if (Test-Path $mobileStart) {
    & powershell.exe -NoExit -ExecutionPolicy Bypass -File "$mobileStart"
} else {
    Write-Host "[ERREUR] Impossible de trouver le fichier $mobileStart" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter..."
}
