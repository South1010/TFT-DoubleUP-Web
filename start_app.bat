@echo off
@chcp 65001 >nul
title DoubleUp.GG Launcher

echo ===================================================
echo   DoubleUp.GG TFT Double Up Web App Launcher
echo ===================================================
echo.

echo [1/3] Starting Backend (FastAPI : Port 8000)...
start "DoubleUp.GG Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Frontend (Next.js : Port 3000)...
start "DoubleUp.GG Frontend" cmd /k "cd /d %~dp0frontend && set "NEXT_PUBLIC_ENABLE_ADMIN=true" && set "BACKEND_INTERNAL_URL=http://127.0.0.1:8000" && npm run dev"

echo [3/3] Opening browser at http://localhost:3000 in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ===================================================
echo   App successfully launched!
echo   - Web Site: http://localhost:3000
echo   - Backend API: http://localhost:8000
echo ===================================================

