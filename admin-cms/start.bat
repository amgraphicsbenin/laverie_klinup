@echo off
title Pressing Pro - Admin CMS Server
cd /d "%~dp0"

set VITE_APP_ENV=test

echo ===================================================
echo   Demarrage du serveur Admin CMS - Pressing Pro
echo   [ENV] Mode TEST actif - Base isolee de la PROD
echo ===================================================

if not exist node_modules (
    echo Dossier node_modules introuvable. Installation des dependances...
    call npm install
)

echo Lancement du serveur de developpement...
call npm run dev

pause
