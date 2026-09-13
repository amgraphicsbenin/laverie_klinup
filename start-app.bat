@echo off
title KLIN UP - Serveur Expo
color 0B

:: ── Réparation automatique de l'index Git ─────────────────────────────────────
set GIT_EXE=C:\Users\ANDRE\AppData\Local\Programs\Git\cmd\git.exe
set REPO=%~dp0
set INDEX=%REPO%.git\index
set BACKUP=%REPO%.git\index.backup

if exist "%INDEX%" (
    for %%F in ("%INDEX%") do set IDX_SIZE=%%~zF
) else (
    set IDX_SIZE=0
)

if "%IDX_SIZE%"=="0" (
    echo [GIT] Index corrompu detecte. Reparation automatique...
    if exist "%BACKUP%" (
        for %%B in ("%BACKUP%") do set BK_SIZE=%%~zB
        if not "%BK_SIZE%"=="0" (
            copy /Y "%BACKUP%" "%INDEX%" >nul
            echo [GIT] Index restaure depuis backup.
            goto :git_ok
        )
    )
    del /f "%INDEX%" 2>nul
    "%GIT_EXE%" -C "%REPO%" reset HEAD . >nul 2>&1
    echo [GIT] Index reconstruit depuis HEAD.
    if exist "%INDEX%" copy /Y "%INDEX%" "%BACKUP%" >nul
) else (
    copy /Y "%INDEX%" "%BACKUP%" >nul
)

:git_ok
:: ──────────────────────────────────────────────────────────────────────────────

cd /d "%~dp0mobile-app"
call start.bat
if %ERRORLEVEL% neq 0 (
    echo.
    echo Le serveur s'est termine avec le code %ERRORLEVEL%.
    pause
)