@echo off
setlocal

set "HOST=127.0.0.1"
for /f %%P in ('powershell -NoProfile -Command "$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0); $listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop(); $port"') do set "PORT=%%P"

cd /d "%~dp0"

set "URL=http://%HOST%:%PORT%/font-visualizer.html"
start "" powershell -NoProfile -Command "Start-Sleep -Milliseconds 600; Start-Process '%URL%'"

echo Serving %CD%
echo Opening %URL%
echo Press Ctrl+C to stop.
echo.

python -m http.server %PORT% --bind %HOST%
