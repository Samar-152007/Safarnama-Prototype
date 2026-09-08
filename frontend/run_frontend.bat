@echo off
echo ==============================================
echo Starting Safarnama Frontend (Vite + React) on port 5173...
echo ==============================================
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
call npm run dev
pause
