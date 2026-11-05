# Telangana Ruchulu - System Launcher for PowerShell
Write-Host "===================================================================" -ForegroundColor Yellow
Write-Host "   Telangana Ruchulu - Restaurant Management System Launcher       " -ForegroundColor Yellow
Write-Host "===================================================================" -ForegroundColor Yellow
Write-Host ""

$baseDir = $PSScriptRoot
$env:Path = "C:\Users\koush\AppData\Local\Programs\nodejs;C:\Users\koush\AppData\Local\Programs\mariadb\bin;" + $env:Path

# 1. Start MySQL Server
Write-Host "[1/3] Starting MySQL Database Server (Port 3306)..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k `"title 1-MySQL Server && `"C:\Users\koush\AppData\Local\Programs\mariadb\bin\mariadbd.exe`" --datadir=`"$baseDir\data\mysql`" --port=3306 --console`""

Start-Sleep -Seconds 3

# 2. Start Backend API
Write-Host "[2/3] Starting Express Backend API (Port 5000)..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k `"title 2-Backend API && cd /d `"$baseDir\backend`" && set PATH=C:\Users\koush\AppData\Local\Programs\nodejs;%PATH% && node src/server.js`""

Start-Sleep -Seconds 2

# 3. Start Frontend UI
Write-Host "[3/3] Starting React Frontend (Port 3000)..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k `"title 3-Frontend UI && cd /d `"$baseDir\frontend`" && set PATH=C:\Users\koush\AppData\Local\Programs\nodejs;%PATH% && npm run dev`""

Start-Sleep -Seconds 3

Write-Host "`nLaunching http://localhost:3000 in your browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "===================================================================" -ForegroundColor Yellow
Write-Host "  System is now active!" -ForegroundColor Green
Write-Host "  - UI: http://localhost:3000" -ForegroundColor White
Write-Host "  - API: http://localhost:5000" -ForegroundColor White
Write-Host "  - Login: admin / admin123" -ForegroundColor Yellow
Write-Host "===================================================================" -ForegroundColor Yellow
