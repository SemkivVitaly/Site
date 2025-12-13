# Script to fix port 80 issue on Windows
# Run as administrator: powershell -ExecutionPolicy Bypass -File fix-port-80.ps1

Write-Host "=== Fixing Port 80 Issue ===" -ForegroundColor Green
Write-Host ""

# Check administrator rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator rights!" -ForegroundColor Red
    Write-Host "Please run PowerShell as administrator" -ForegroundColor Yellow
    exit 1
}

# Check what's using port 80
Write-Host "Checking what's using port 80..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    $process = Get-Process -Id $port80.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "Port 80 is used by: $($process.ProcessName) (PID: $($port80.OwningProcess))" -ForegroundColor Cyan
}

# Check HTTP services
Write-Host ""
Write-Host "Checking HTTP services..." -ForegroundColor Yellow
$httpServices = Get-Service | Where-Object {$_.Name -like "*http*" -or $_.Name -like "*www*" -or $_.Name -like "*iis*"}
if ($httpServices) {
    $httpServices | ForEach-Object {
        Write-Host "  Service: $($_.Name) - Status: $($_.Status) - Display: $($_.DisplayName)" -ForegroundColor Cyan
    }
}

# Check HTTP.sys reservations
Write-Host ""
Write-Host "Checking HTTP.sys URL reservations..." -ForegroundColor Yellow
$reservations = netsh http show urlacl 2>&1
if ($reservations -match "http://") {
    Write-Host "Found URL reservations:" -ForegroundColor Cyan
    $reservations | Select-String "http://" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
} else {
    Write-Host "  No URL reservations found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Solutions ===" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1: Stop World Wide Web Publishing Service (if running)" -ForegroundColor Yellow
Write-Host "  Stop-Service W3SVC" -ForegroundColor Gray
Write-Host "  Set-Service W3SVC -StartupType Disabled" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Remove HTTP.sys URL reservations" -ForegroundColor Yellow
Write-Host "  netsh http delete urlacl url=http://+:80/" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Change Docker port mapping (recommended)" -ForegroundColor Yellow
Write-Host "  Edit docker-compose.prod.yml and change port 80 to 8080" -ForegroundColor Gray
Write-Host ""
Write-Host "Which option do you want to use? (1/2/3)" -ForegroundColor Cyan
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host "Stopping W3SVC service..." -ForegroundColor Yellow
        Stop-Service W3SVC -ErrorAction SilentlyContinue
        Set-Service W3SVC -StartupType Disabled -ErrorAction SilentlyContinue
        Write-Host "[OK] W3SVC service stopped and disabled" -ForegroundColor Green
    }
    "2" {
        Write-Host "Removing HTTP.sys URL reservations..." -ForegroundColor Yellow
        netsh http delete urlacl url=http://+:80/ 2>&1 | Out-Null
        netsh http delete urlacl url=http://*:80/ 2>&1 | Out-Null
        Write-Host "[OK] URL reservations removed" -ForegroundColor Green
        Write-Host "You may need to restart your computer" -ForegroundColor Yellow
    }
    "3" {
        Write-Host "Please edit docker-compose.prod.yml manually" -ForegroundColor Yellow
        Write-Host "Change '80:80' to '8080:80' in caddy service ports" -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "[ERROR] Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Checking port 80 again..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$port80Check = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if (-not $port80Check) {
    Write-Host "[OK] Port 80 is now free!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Port 80 is still in use. You may need to restart your computer." -ForegroundColor Yellow
}

