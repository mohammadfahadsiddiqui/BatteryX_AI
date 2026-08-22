@echo off
title BatteryX AI - Backend API Server
echo Starting BatteryX AI Backend (FastAPI)...
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
