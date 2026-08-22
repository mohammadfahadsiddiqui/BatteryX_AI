@echo off
title BatteryX AI - Launcher
echo ========================================================
echo               BatteryX AI Platform Launcher
echo ========================================================
echo.
echo Starting Backend API Server (Port 8000)...
start "BatteryX AI Backend" cmd /k "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend Web App (Port 5173)...
start "BatteryX AI Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo ========================================================
echo App is opening in your browser:
echo Frontend:  http://localhost:5173
echo Backend API Docs: http://localhost:8000/api/docs
echo ========================================================
timeout /t 2 /nobreak >nul
start http://localhost:5173
