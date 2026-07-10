@echo off
title KLIN UP - Apercu Web Mobile

echo ===================================================
echo   KLIN UP - Apercu Web (Vue Telephone)
echo ===================================================
echo.

cd /d "%~dp0mobile-app"

if not exist node_modules (
    echo Installation des dependances...
    call npm install --legacy-peer-deps
)

:: Liberer le port 8081 si occupe
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do (
    echo Liberation du port 8081 [PID: %%a]...
    taskkill /PID %%a /F >nul 2>&1
)

echo Demarrage du serveur...
echo L'apercu s'ouvrira sur : http://localhost:8081
echo.
echo (Appuyez sur Ctrl+C pour arreter)
echo.

call npx expo start --web --port 8081

pause
