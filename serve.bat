@echo off
echo Starting local server at http://localhost:8000
echo Main app:  http://localhost:8000
echo Chart dev: http://localhost:8000/chart-dev/
echo Press Ctrl+C to stop.
start "" http://localhost:8000
start "" http://localhost:8000/chart-dev/
python -m http.server 8000
   ;     