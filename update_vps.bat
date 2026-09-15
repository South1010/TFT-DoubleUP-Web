@echo off
@chcp 65001 >nul
title DoubleUp.GG Remote VPS Deployer

echo ===================================================
echo   DoubleUp.GG VPS Remote Update and Deploy
echo   Target: ubuntu@49.212.178.111
echo ===================================================
echo.

echo [1/3] Committing and pushing local changes to GitHub...
git add .
git commit -m "Fix CompDetailModal costColor type error and update_vps script"
git push origin main

echo.
echo [2/3] Connecting to VPS, pulling latest code, and building without cache...
ssh -t ubuntu@49.212.178.111 "cd ~/app && git pull && sudo docker compose down && sudo docker compose build --no-cache && sudo docker compose up -d --force-recreate"

echo.
echo ===================================================
echo   [OK] VPS deployment update complete!
echo   Web site URL: http://49.212.178.111
echo ===================================================
echo.
pause
