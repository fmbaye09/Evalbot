@echo off
echo Exécution des commandes de permissions PostgreSQL...

REM Connexion à PostgreSQL et exécution du script SQL
psql -U postgres -f "%~dp0grant-permissions.sql"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Permissions accordées avec succès !
) else (
    echo ❌ Erreur lors de l'attribution des permissions
    pause
)

pause 