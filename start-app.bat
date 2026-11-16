@echo off
title KLIN UP - Application Mobile (Android Native - Kotlin & Jetpack Compose)
color 0B

:: Verification / Reparation automatique de l'index Git
set "REPO=%~dp0"
set "INDEX=%REPO%.git\index"
set "BACKUP=%REPO%.git\index.backup"

:: Detection de Git
where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "GIT_CMD=git"
) else if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
) else (
    set "GIT_CMD="
)

if exist "%INDEX%" (
    for %%F in ("%INDEX%") do set "IDX_SIZE=%%~zF"
) else (
    set "IDX_SIZE=0"
)

if "%IDX_SIZE%"=="0" (
    echo [GIT] Index corrompu detecte. Reparation automatique...
    if exist "%BACKUP%" (
        for %%B in ("%BACKUP%") do set "BK_SIZE=%%~zB"
        if not "%BK_SIZE%"=="0" (
            copy /Y "%BACKUP%" "%INDEX%" >nul
            echo [GIT] Index restaure depuis backup.
            goto :git_ok
        )
    )
    del /f "%INDEX%" 2>nul
    if defined GIT_CMD (
        "%GIT_CMD%" -C "%REPO%" reset HEAD . >nul 2>&1
        echo [GIT] Index reconstruit depuis HEAD.
    )
    if exist "%INDEX%" copy /Y "%INDEX%" "%BACKUP%" >nul
) else (
    copy /Y "%INDEX%" "%BACKUP%" >nul
)

:git_ok

echo ==============================================================================
echo [KLIN UP] Compilation et Lancement de l'App Native Android (Kotlin / Compose)
echo ==============================================================================
echo.

cd /d "%~dp0android-app"
if exist "gradlew.bat" (
    call gradlew.bat assembleDebug
    if %ERRORLEVEL% equ 0 (
        echo.
        echo [SUCCES] APK Debug genere avec succes dans :
        echo android-app\app\build\outputs\apk\debug\app-debug.apk
    ) else (
        echo.
        echo [ERREUR] La compilation Gradle a echoue avec le code %ERRORLEVEL%.
    )
) else (
    echo [ERREUR] Impossible de trouver gradlew.bat dans android-app.
)

echo.
pause
