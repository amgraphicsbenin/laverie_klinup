@echo off
title KLIN UP - Mobile App Server
cd /d "%~dp0"

echo ===================================================
echo   Demarrage du serveur Mobile App - KLIN UP
echo ===================================================

if not exist node_modules (
    echo Dossier node_modules introuvable. Installation des dependances...
    call npm install
)

echo Lancement du serveur de developpement...
call npm run dev

pause
