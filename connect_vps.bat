@echo off
@chcp 65001 >nul
title Sakura VPS SSH Terminal (ubuntu@49.212.178.111)

echo ===================================================
echo   Connecting to Sakura VPS...
echo   User: ubuntu
echo   Host: 49.212.178.111
echo ===================================================
echo.

ssh ubuntu@49.212.178.111

echo.
echo Connection closed. Press any key to exit...
pause >nul
