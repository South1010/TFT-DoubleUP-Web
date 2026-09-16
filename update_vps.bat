@echo off
@chcp 65001 >nul
title DoubleUp.GG Remote VPS Deployer

echo ===================================================
echo   DoubleUp.GG VPS Remote Update and Deploy
echo   Target: ubuntu@49.212.178.111
echo ===================================================
echo.

echo [Step 0/3] Running pre-deployment verification ^& auto-sync...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pre_deploy_check.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ===================================================
    echo   [ERROR] Pre-deployment checks failed! Deploy aborted.
    echo ===================================================
    pause
    exit /b 1
)
echo.

echo [Step 1/3] Committing and pushing local changes to GitHub...
git config user.name "South1010" >nul 2>&1
git config user.email "south1010@example.com" >nul 2>&1
git add .
git commit -m "Update site: pre-flight checks verified, admin portal hidden"
git pull origin main --no-rebase --no-edit
git push origin main

echo.
echo [Step 2/3] Connecting to VPS, pulling latest code, and building without cache...
ssh -t ubuntu@49.212.178.111 "cd ~/app && git pull && sudo docker compose down && sudo docker compose build --no-cache && sudo docker compose up -d --force-recreate"

echo.
echo ===================================================
echo   [OK] VPS deployment update complete!
echo   Web site URL: http://49.212.178.111
echo ===================================================
echo.
pause
