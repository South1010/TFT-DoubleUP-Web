@echo off
title DoubleUp.GG Public Share Launcher

echo [1/3] Starting Backend (FastAPI - Host 0.0.0.0)...
start "DoubleUp Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/3] Starting Frontend (Next.js - Host 0.0.0.0)...
start "DoubleUp Frontend" cmd /k "cd /d %~dp0frontend && set "NEXT_PUBLIC_ENABLE_ADMIN=false" && npm run dev -- -H 0.0.0.0"

echo [3/3] Starting Public Tunnel (Cloudflare)...
timeout /t 5 /nobreak >nul

start "DoubleUp Public Tunnel" powershell.exe -NoExit -ExecutionPolicy Bypass -File "%~dp0launch_tunnel.ps1"

echo.
echo ===================================================
echo   DoubleUp.GG Share Mode Started Successfully!
echo.
echo   [Share URL Instructions]
echo   Look at the "DoubleUp Public Tunnel" window!
echo   The GREEN highlighted URL (https://...trycloudflare.com)
echo   is the real URL to send to your partner.
echo ===================================================
pause
