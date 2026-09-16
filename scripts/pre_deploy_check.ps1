# DoubleUp.GG VPS Pre-Deployment Safety Check
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$app = Join-Path $root "app"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  DoubleUp.GG Pre-Deployment Verification Check    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$failed = $false

# ----------------------------------------------------
# 1. Check: No Admin Portal links in Header.tsx
# ----------------------------------------------------
Write-Host "[Check 1/4] Checking for Admin Portal leaks in Header.tsx..." -NoNewline
$headerPath = Join-Path $root "frontend\components\Header.tsx"
if (Test-Path -LiteralPath $headerPath) {
    $headerTxt = [System.IO.File]::ReadAllText($headerPath)
    if ($headerTxt -match 'href=["'']\/admin["'']' -or $headerTxt -match '管理者ポータル') {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "  Error: Header.tsx contains Admin Portal button/link!" -ForegroundColor Red
        $failed = $true
    } else {
        Write-Host " [PASS]" -ForegroundColor Green
    }
} else {
    Write-Host " [SKIP]" -ForegroundColor Yellow
}

# ----------------------------------------------------
# 2. Check: No '管理者ポータル' text in public pages
# ----------------------------------------------------
Write-Host "[Check 2/4] Checking public pages for '管理者ポータル' text..." -NoNewline
$scanDirs = @(
    (Join-Path $root "frontend\app"),
    (Join-Path $root "frontend\components"),
    (Join-Path $root "frontend\utils")
)
$publicFiles = @()
foreach ($d in $scanDirs) {
    if (Test-Path -LiteralPath $d) {
        $publicFiles += Get-ChildItem -Path $d -Recurse -File | Where-Object { 
            ($_.Extension -in '.ts', '.tsx') -and ($_.FullName -notmatch '\\admin\\')
        }
    }
}

$adminMentions = @()
foreach ($f in $publicFiles) {
    $txt = [System.IO.File]::ReadAllText($f.FullName)
    if ($txt -match '管理者ポータル') {
        $adminMentions += $f.Name
    }
}

if ($adminMentions.Count -gt 0) {
    Write-Host " [FAILED]" -ForegroundColor Red
    foreach ($m in $adminMentions) {
        Write-Host "  Found '管理者ポータル' in: $m" -ForegroundColor Red
    }
    $failed = $true
} else {
    Write-Host " [PASS]" -ForegroundColor Green
}

# ----------------------------------------------------
# 3. Check: Fast Syntax Bracket/Paren Balance
# ----------------------------------------------------
Write-Host "[Check 3/4] Verifying bracket & parenthesis syntax balance..." -NoNewline
$allCodeFiles = @()
foreach ($d in $scanDirs) {
    if (Test-Path -LiteralPath $d) {
        $allCodeFiles += Get-ChildItem -Path $d -Recurse -File | Where-Object { $_.Extension -in '.ts', '.tsx' }
    }
}
$middleware = Join-Path $root "frontend\middleware.ts"
if (Test-Path -LiteralPath $middleware) {
    $allCodeFiles += Get-Item -LiteralPath $middleware
}

$syntaxErrors = @()
foreach ($f in $allCodeFiles) {
    $txt = [System.IO.File]::ReadAllText($f.FullName)
    $ob = 0; $cb = 0; $op = 0; $cp = 0
    foreach ($c in $txt.ToCharArray()) {
        if ($c -eq '{') { $ob++ }
        elseif ($c -eq '}') { $cb++ }
        elseif ($c -eq '(') { $op++ }
        elseif ($c -eq ')') { $cp++ }
    }
    if ($ob -ne $cb -or $op -ne $cp) {
        $syntaxErrors += "$($f.Name) (Braces diff: $($ob-$cb), Parens diff: $($op-$cp))"
    }
}

if ($syntaxErrors.Count -gt 0) {
    Write-Host " [FAILED]" -ForegroundColor Red
    foreach ($err in $syntaxErrors) {
        Write-Host "  Syntax balance error in: $err" -ForegroundColor Red
    }
    $failed = $true
} else {
    Write-Host " [PASS ($($allCodeFiles.Count) files)]" -ForegroundColor Green
}

# ----------------------------------------------------
# 4. Sync: Fast sync root changes to app repository
# ----------------------------------------------------
Write-Host "[Check 4/4] Synchronizing workspace source files to app repository..." -NoNewline
if (Test-Path -LiteralPath $app) {
    $syncDirs = @("app", "components", "utils", "public")
    foreach ($sd in $syncDirs) {
        $src = Join-Path $root "frontend\$sd"
        $dst = Join-Path $app "frontend\$sd"
        if (Test-Path -LiteralPath $src) {
            robocopy $src $dst /E /R:1 /W:1 /NJH /NJS /NDL /NC /NS > $null
        }
    }
    $rootFrontendFiles = @("package.json", "package-lock.json", "next.config.js", "middleware.ts", "tsconfig.json")
    foreach ($rf in $rootFrontendFiles) {
        $srcF = Join-Path $root "frontend\$rf"
        $dstF = Join-Path $app "frontend\$rf"
        if (Test-Path -LiteralPath $srcF) {
            Copy-Item -LiteralPath $srcF -Destination $dstF -Force
        }
    }
    $backendSrc = Join-Path $root "backend\app"
    $backendDst = Join-Path $app "backend\app"
    if (Test-Path -LiteralPath $backendSrc) {
        robocopy $backendSrc $backendDst /E /XD __pycache__ /R:1 /W:1 /NJH /NJS /NDL /NC /NS > $null
    }
    Write-Host " [PASS - Synced]" -ForegroundColor Green
} else {
    Write-Host " [SKIP (app directory not found)]" -ForegroundColor Yellow
}

Write-Host ""
if ($failed) {
    Write-Host "===================================================" -ForegroundColor Red
    Write-Host "  [ABORT] Pre-deployment verification FAILED!      " -ForegroundColor Red
    Write-Host "  Please resolve the above errors before deploy.   " -ForegroundColor Red
    Write-Host "===================================================" -ForegroundColor Red
    exit 1
} else {
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "  [OK] All verification checks PASSED! Safe to go! " -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
    exit 0
}
