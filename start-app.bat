@echo off
title KLIN UP - Mobile App (Web Preview)

echo ===================================================
echo   KLIN UP - Apercu Web de l'App Mobile
echo ===================================================
echo.
echo L'application s'ouvrira automatiquement dans votre navigateur.
echo URL : http://localhost:8081
echo.
echo Pour arreter le serveur : Ctrl+C
echo.

cd /d "%~dp0mobile-app"

if not exist node_modules (
    echo Dossier node_modules introuvable. Installation des dependances...
    call npm install --legacy-peer-deps
)

call npx expo start --web --port 8081

pause
