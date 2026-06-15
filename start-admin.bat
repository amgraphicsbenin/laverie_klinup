@echo off
title KLIN UP - Admin CMS Server (Root Launcher)

echo Demarrage du serveur de base de donnees partagee en arriere-plan...
start /b node "%~dp0db-server.js"

cd /d "%~dp0admin-cms"

echo ===================================================
echo   Demarrage du serveur Admin CMS - KLIN UP
echo ===================================================

if not exist node_modules (
    echo Dossier node_modules introuvable. Installation des dependances...
    call npm install
)

echo Lancement du serveur de developpement...
call npm run dev

pause
