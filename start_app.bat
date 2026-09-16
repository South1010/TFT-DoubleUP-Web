@echo off
@chcp 65001 >nul
title DoubleUp.GG Admin Launcher (Local + Home LAN)

echo ===================================================
echo   DoubleUp.GG TFT Double Up Web App Launcher
echo   (管理者ポータル ^& 宅内LANマルチデバイス対応)
echo ===================================================
echo.

echo [1/3] Starting Backend (FastAPI : Host 0.0.0.0 - Port 8000)...
start "DoubleUp.GG Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Frontend (Next.js : Host 0.0.0.0 - Port 3000)...
start "DoubleUp.GG Frontend" cmd /k "cd /d %~dp0frontend && set "NEXT_PUBLIC_ENABLE_ADMIN=true" && set "BACKEND_INTERNAL_URL=http://127.0.0.1:8000" && npm run dev -- -H 0.0.0.0"

echo [3/3] Opening browser at http://localhost:3000/admin in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000/admin

for /f "usebackq tokens=*" %%i in (`powershell -Command "((ipconfig | Select-String 'IPv4').ToString().Split(':')[1]).Trim()"`) do set LOCAL_IP=%%i

echo.
echo ===================================================
echo   アプリが正常に起動しました！
echo.
echo   【1. このPC（サーバー機）でのアクセス】
echo   - サイト全般:     http://localhost:3000
echo   - 管理者ポータル: http://localhost:3000/admin
echo.
echo   【2. 家にある他のPC・スマホ・タブレットからのアクセス】
if defined LOCAL_IP (
    echo   - サイト全般:     http://%LOCAL_IP%:3000
    echo   - 管理者ポータル: http://%LOCAL_IP%:3000/admin
) else (
    echo   - IPアドレスを取得できませんでした。cmdで「ipconfig」を実行し、
    echo     IPv4アドレスをご確認ください (例: http://192.168.x.x:3000/admin)
)
echo.
echo   ※別PCから接続できない場合は、初回起動時に表示される
echo     Windowsファイアウォールで「プライベート ネットワーク」に
echo     チェックを入れて「アクセスを許可」をクリックしてください。
echo ===================================================
pause
