@echo off
title KLIN UP - Admin CMS Server (Port 5174)

echo Demarrage du serveur Admin CMS KLIN UP sur le port 5174...

cd /d "%~dp0admin-cms"

if not exist node_modules (
    echo Dossier node_modules introuvable. Installation des dependances...
    call npm install
)

echo Ouverture de l'application dans votre navigateur (http://localhost:5174)...
start http://localhost:5174

echo Lancement du serveur de developpement Vite (Port 5174)...
call npm run dev -- --port 5174 --strictPort

pause
