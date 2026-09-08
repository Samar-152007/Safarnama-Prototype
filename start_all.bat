@echo off
echo ========================================================
echo Launching Safarnama Smart Logistics Platform
echo ========================================================
echo.
echo Starting Backend in new window...
start "Safarnama Backend (FastAPI)" cmd /c "%~dp0backend\run_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend in new window...
start "Safarnama Frontend (React + Vite)" cmd /c "%~dp0frontend\run_frontend.bat"

echo.
echo ========================================================
echo Backend:  http://127.0.0.1:8000 (API Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:5173
echo ========================================================
