@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js est introuvable. Installe Node.js ou lance depuis un terminal ou npm fonctionne.
  pause
  exit /b 1
)

if not exist "%ROOT%.beta-passwords.json" (
  echo Le fichier .beta-passwords.json est introuvable.
  echo.
  set /p INIT="Creer une nouvelle liste de 15 codes a 6 chiffres ? (o/N) : "
  if /i "%INIT%"=="o" (
    node "%ROOT%scripts\beta-passwords.mjs" init
    echo.
    pause
  ) else (
    exit /b 1
  )
)

:menu
cls
echo Sharp Eleven - codes beta
echo =========================
echo.
echo 1. Voir les codes actifs
echo 2. Donner un code a quelqu'un
echo 3. Ajouter un nouveau code
echo 4. Revoquer un code
echo 5. Retirer une attribution sans revoquer
echo 6. Afficher la valeur Supabase
echo 7. Copier la valeur Supabase dans le presse-papiers
echo 8. Pousser la valeur vers Supabase avec la CLI
echo 9. Voir tous les codes, meme revoques
echo 0. Quitter
echo.
set /p CHOICE="Choix : "

if "%CHOICE%"=="1" goto list
if "%CHOICE%"=="2" goto issue
if "%CHOICE%"=="3" goto add
if "%CHOICE%"=="4" goto revoke
if "%CHOICE%"=="5" goto unassign
if "%CHOICE%"=="6" goto export
if "%CHOICE%"=="7" goto copy
if "%CHOICE%"=="8" goto push
if "%CHOICE%"=="9" goto list_all
if "%CHOICE%"=="0" exit /b 0

echo.
echo Choix inconnu.
pause
goto menu

:list
cls
node "%ROOT%scripts\beta-passwords.mjs" list
echo.
pause
goto menu

:list_all
cls
node "%ROOT%scripts\beta-passwords.mjs" list --all
echo.
pause
goto menu

:issue
cls
echo Donner un code
echo --------------
set /p RECIPIENT="Nom de la personne : "
if "%RECIPIENT%"=="" goto menu
echo.
node "%ROOT%scripts\beta-passwords.mjs" issue "%RECIPIENT%"
echo.
pause
goto menu

:add
cls
echo Ajouter un code
echo ---------------
set /p LABEL="Label optionnel, ex. invite-16. Laisser vide pour automatique : "
if "%LABEL%"=="" (
  node "%ROOT%scripts\beta-passwords.mjs" add
) else (
  node "%ROOT%scripts\beta-passwords.mjs" add "%LABEL%"
)
echo.
echo Pense a mettre a jour Supabase ensuite avec l'option 6, 7 ou 8.
pause
goto menu

:revoke
cls
echo Revoquer un code
echo ---------------
set /p TARGET="Label ou code a revoquer : "
if "%TARGET%"=="" goto menu
echo.
node "%ROOT%scripts\beta-passwords.mjs" revoke "%TARGET%"
echo.
echo Pense a mettre a jour Supabase ensuite avec l'option 6, 7 ou 8.
pause
goto menu

:unassign
cls
echo Retirer une attribution
echo -----------------------
set /p TARGET="Nom, label ou code : "
if "%TARGET%"=="" goto menu
echo.
node "%ROOT%scripts\beta-passwords.mjs" unassign "%TARGET%"
echo.
pause
goto menu

:export
cls
node "%ROOT%scripts\beta-passwords.mjs" export
echo.
pause
goto menu

:copy
cls
node "%ROOT%scripts\beta-passwords.mjs" export --raw | clip
if errorlevel 1 (
  echo Impossible de copier dans le presse-papiers.
) else (
  echo Valeur BETA_ACCESS_PASSWORD_HASHES copiee dans le presse-papiers.
  echo Colle-la dans Supabase, secret BETA_ACCESS_PASSWORD_HASHES.
)
echo.
pause
goto menu

:push
cls
echo Cette option utilise "supabase" via npx et demande une connexion Supabase CLI.
echo.
node "%ROOT%scripts\beta-passwords.mjs" push
echo.
pause
goto menu
