@echo off
title Pressing Pro - Serveur Expo
color 0B

cd /d "%~dp0"

:: Eviter toute demande d'authentification Expo ou de telemetrie en dev local
set EXPO_NO_TELEMETRY=1

:: Securite : L'environnement local utilise TOUJOURS la base de TEST (isolee de la production)
set APP_ENV=test
set EXPO_PUBLIC_APP_ENV=test

echo ==========================================================
echo           PRESSING PRO MOBILE APP - SERVEUR EXPO          
echo     [ENV] Mode TEST actif - Base de donnees isolee        
echo ==========================================================
echo.
echo Choisissez le mode de demarrage :
echo   [1] Normal (LAN / WiFi local) - Recommande
echo   [2] CABLE USB (Android via ADB / Localhost)
echo   [3] Tunnel (Accessible sur tout reseau / 4G / 5G)
echo   [4] Web (Navigateur)
echo   [5] Reset complet du cache
echo.
set /p choice="Appuyez sur 1, 2, 3, 4 ou 5 (ou Entree pour Normal) : "

if "%choice%"=="2" (
    echo.
    echo --^> Configuration du pont ADB USB...
    adb reverse tcp:8081 tcp:8081 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [INFO] ADB non trouve ou aucun appareil USB detecte. Lancement en mode Localhost...
    ) else (
        echo [OK] Redirection du port 8081 vers votre mobile USB activee.
    )
    echo --^> Lancement en MODE USB (Localhost)...
    call npx expo start --localhost --clear
    goto :end
)
if "%choice%"=="3" (
    echo.
    echo --^> Lancement en MODE TUNNEL...
    call npx expo start --tunnel --clear
    goto :end
)
if "%choice%"=="4" (
    echo.
    echo --^> Lancement en MODE WEB...
    call npx expo start --web --clear
    goto :end
)
if "%choice%"=="5" (
    echo.
    echo --^> Nettoyage du cache et verification...
    call npm run postinstall
    call npx expo start --clear
    goto :end
)

echo.
echo --^> Lancement en MODE NORMAL (LAN)...
call npx expo start --clear

:end
echo.
echo Le serveur s'est arrete.
pause
