$rootDir = $PSScriptRoot
$cloudflaredPath = Join-Path $rootDir "cloudflared.exe"

Write-Host "===================================================" -ForegroundColor Yellow
Write-Host "   DoubleUp.GG Public Tunnel (Cloudflare Tunnel)" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "[1/2] Downloading Cloudflare Tunnel (cloudflared.exe)..." -ForegroundColor Cyan
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredPath -UseBasicParsing
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "Download failed: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit
    }
}

Write-Host "[2/2] Generating Public URL..." -ForegroundColor Cyan
Write-Host ""

& $cloudflaredPath tunnel --url http://localhost:3000 2>&1 | ForEach-Object {
    $line = $_.ToString()
    Write-Host $line
    if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
        $foundUrl = $matches[0]
        Write-Host ""
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "  [SHARE URL FOR YOUR PARTNER / FRIENDS]" -ForegroundColor Yellow
        Write-Host "  $foundUrl" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Tunnel stopped." -ForegroundColor Red
Read-Host "Press Enter to exit..."
