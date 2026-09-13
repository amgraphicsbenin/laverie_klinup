@echo off
:: repair-git.bat - Répare le fichier .git/index corrompu du projet KLIN UP
:: Double-cliquer pour réparer manuellement si l'erreur git index persiste

set REPO=%~dp0
set GIT_EXE=C:\Users\ANDRE\AppData\Local\Programs\Git\cmd\git.exe
set INDEX=%REPO%.git\index
set BACKUP=%REPO%.git\index.backup

echo [KLIN UP] Verification de l'index Git...

:: Vérifier si l'index est corrompu (0 octet)
for /f "tokens=*" %%f in ('powershell -NoProfile -Command "(Get-Item '%INDEX%' -ErrorAction SilentlyContinue).Length"') do set SIZE=%%f

if "%SIZE%"=="0" (
    echo [REPAIR] Index corrompu detecte. Reparation en cours...
    
    :: Essayer de restaurer depuis le backup si disponible
    if exist "%BACKUP%" (
        for /f "tokens=*" %%g in ('powershell -NoProfile -Command "(Get-Item '%BACKUP%').Length"') do set BKSIZE=%%g
        if not "%BKSIZE%"=="0" (
            copy /Y "%BACKUP%" "%INDEX%"
            echo [REPAIR] Index restaure depuis backup - Size: %BKSIZE% bytes
            goto :verify
        )
    )
    
    :: Sinon reconstruire depuis HEAD
    del /f "%INDEX%" 2>nul
    "%GIT_EXE%" -C "%REPO%" reset HEAD .
    echo [REPAIR] Index reconstruit depuis HEAD
) else (
    echo [OK] Index sain - Taille: %SIZE% bytes
    :: Mettre a jour le backup
    copy /Y "%INDEX%" "%BACKUP%" >nul
    echo [OK] Backup mis a jour.
    goto :done
)

:verify
for /f "tokens=*" %%h in ('powershell -NoProfile -Command "(Get-Item '%INDEX%' -ErrorAction SilentlyContinue).Length"') do set NEWSIZE=%%h
echo [VERIFY] Taille de l'index apres reparation: %NEWSIZE% bytes

:done
echo.
pause
