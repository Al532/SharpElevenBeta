@echo off
setlocal

set "ROOT=%~dp0"
set "SCRIPT=%ROOT%scripts\inspect-android-chart-layout.mjs"
set "COMMAND=%~1"
set "STEPS=%~2"
set "BAR=%~3"

if "%COMMAND%"=="" goto :help
if "%BAR%"=="" set "BAR=8"

if /I "%COMMAND%"=="on" goto :on
if /I "%COMMAND%"=="bypass" goto :on
if /I "%COMMAND%"=="off" goto :off
if /I "%COMMAND%"=="reset" goto :reset
if /I "%COMMAND%"=="clear" goto :reset
if /I "%COMMAND%"=="only" goto :only
if /I "%COMMAND%"=="show" goto :show
if /I "%COMMAND%"=="status" goto :show
goto :help

:on
if "%STEPS%"=="" goto :missing_steps
node "%SCRIPT%" --bar=%BAR% --bypass=%STEPS%
goto :end

:only
if "%STEPS%"=="" goto :missing_steps
node "%SCRIPT%" --bar=%BAR% --only=%STEPS%
goto :end

:off
if "%STEPS%"=="" goto :reset
node "%SCRIPT%" --bar=%BAR% --unbypass=%STEPS%
goto :end

:reset
node "%SCRIPT%" --bar=%BAR% --clear-bypasses
goto :end

:show
node "%SCRIPT%" --bar=%BAR%
goto :end

:missing_steps
echo Missing step list.
echo Example: layout-debug on compression,postCompressionDisplacement
exit /b 1

:help
echo Layout debug controls for the currently open Android emulator WebView.
echo.
echo Usage:
echo   layout-debug on STEP[,STEP...] [BAR]
echo   layout-debug off STEP[,STEP...] [BAR]
echo   layout-debug only STEP[,STEP...] [BAR]
echo   layout-debug reset [BAR]
echo   layout-debug show [BAR]
echo.
echo Examples:
echo   layout-debug on compression
echo   layout-debug off compression
echo   layout-debug on compression,postCompressionDisplacement 8
echo   layout-debug only displacement 8
echo   layout-debug reset
echo   layout-debug show 8
echo.
echo Steps:
echo   barLinePlacement
echo   displacement
echo   rowResizing
echo   compression
echo   postCompressionDisplacement
echo   rowGap
echo   firstRowHeaderShift
echo   endingMargins
echo   annotationPlacement
echo   collisionOverlay
exit /b 0

:end
endlocal
