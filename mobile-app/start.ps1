# ==============================================================================
# KLIN UP - Lanceur du Serveur Mobile Expo
# ==============================================================================

$Host.UI.RawUI.WindowTitle = "KLIN UP - Serveur Expo"
Clear-Host

$env:EXPO_NO_TELEMETRY = "1"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             KLIN UP MOBILE APP - SERVEUR EXPO            " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Se placer dans le dossier mobile-app
Set-Location -Path $PSScriptRoot

# Vérifier que node et npx sont disponibles
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Node.js / npx n'est pas installe ou pas dans le PATH." -ForegroundColor Red
    Write-Host ""
    Read-Host "Appuyez sur Entree pour quitter..."
    Exit
}

Write-Host "Choisissez le mode de demarrage :" -ForegroundColor White
Write-Host "  [1] Normal (LAN / WiFi local) - Recommande" -ForegroundColor Green
Write-Host "  [2] CABLE USB (Android via ADB / Localhost)" -ForegroundColor Green
Write-Host "  [3] Tunnel (Accessible sur tout reseau / 4G / 5G)" -ForegroundColor Cyan
Write-Host "  [4] Web (Navigateur)" -ForegroundColor Yellow
Write-Host "  [5] Reset complet du cache" -ForegroundColor Magenta
Write-Host ""
Write-Host "Appuyez sur 1, 2, 3, 4 ou 5 (ou Entree pour lancer en mode Normal) : " -NoNewline -ForegroundColor Gray

$choice = Read-Host

switch ($choice) {
    "2" {
        Write-Host "`n--> Configuration du pont ADB USB..." -ForegroundColor Green
        try {
            adb reverse tcp:8081 tcp:8081 2>$null
            Write-Host "[OK] Redirection du port 8081 vers votre mobile USB activee." -ForegroundColor Green
        } catch {
            Write-Host "[INFO] ADB non trouve. Assurez-vous que le debogage USB est active." -ForegroundColor Yellow
        }
        Write-Host "`n--> Lancement en MODE USB (Localhost)..." -ForegroundColor Green
        npx expo start --localhost --clear
    }
    "3" {
        Write-Host "`n--> Lancement en MODE TUNNEL..." -ForegroundColor Cyan
        npx expo start --tunnel --clear
    }
    "4" {
        Write-Host "`n--> Lancement en MODE WEB..." -ForegroundColor Yellow
        npx expo start --web --clear
    }
    "5" {
        Write-Host "`n--> Nettoyage du cache et verification des modules..." -ForegroundColor Magenta
        npm run postinstall
        npx expo start --clear
    }
    Default {
        Write-Host "`n--> Lancement en MODE NORMAL (LAN)..." -ForegroundColor Green
        npx expo start --clear
    }
}

Write-Host ""
Write-Host "Le serveur s'est arrete." -ForegroundColor DarkYellow
Read-Host "Appuyez sur Entree pour fermer cette fenetre..."
