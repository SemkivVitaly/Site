# Script to stop IIS and free port 80
# Run as administrator: powershell -ExecutionPolicy Bypass -File stop-iis.ps1

Write-Host "=== Stopping IIS to free port 80 ===" -ForegroundColor Green
Write-Host ""

# Check administrator rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator rights!" -ForegroundColor Red
    Write-Host "Please run PowerShell as administrator" -ForegroundColor Yellow
    exit 1
}

# Stop IIS services
Write-Host "Stopping IIS services..." -ForegroundColor Yellow

# Stop W3SVC (World Wide Web Publishing Service)
$w3svc = Get-Service W3SVC -ErrorAction SilentlyContinue
if ($w3svc) {
    if ($w3svc.Status -eq "Running") {
        Stop-Service W3SVC -Force
        Write-Host "[OK] W3SVC service stopped" -ForegroundColor Green
    } else {
        Write-Host "[OK] W3SVC service already stopped" -ForegroundColor Green
    }
    
    # Disable service to prevent auto-start
    Set-Service W3SVC -StartupType Disabled
    Write-Host "[OK] W3SVC service disabled" -ForegroundColor Green
} else {
    Write-Host "[INFO] W3SVC service not found" -ForegroundColor Gray
}

# Stop WAS (Windows Process Activation Service) - may be needed by IIS
$was = Get-Service WAS -ErrorAction SilentlyContinue
if ($was -and $was.Status -eq "Running") {
    Write-Host "[WARNING] WAS service is running. It may be needed by other services." -ForegroundColor Yellow
    Write-Host "  Skipping WAS service stop to avoid breaking other services." -ForegroundColor Yellow
}

# Remove HTTP.sys URL reservations for port 80
Write-Host ""
Write-Host "Removing HTTP.sys URL reservations for port 80..." -ForegroundColor Yellow

try {
    netsh http delete urlacl url=http://+:80/ 2>&1 | Out-Null
    Write-Host "[OK] Removed reservation: http://+:80/" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Reservation http://+:80/ not found or already removed" -ForegroundColor Gray
}

try {
    netsh http delete urlacl url=http://*:80/ 2>&1 | Out-Null
    Write-Host "[OK] Removed reservation: http://*:80/" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Reservation http://*:80/ not found or already removed" -ForegroundColor Gray
}

# Wait a moment
Start-Sleep -Seconds 2

# Check if port 80 is free
Write-Host ""
Write-Host "Checking if port 80 is free..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if (-not $port80) {
    Write-Host "[OK] Port 80 is now free!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "  docker compose -p typography -f docker-compose.prod.yml up -d" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] Port 80 is still in use by PID: $($port80.OwningProcess)" -ForegroundColor Yellow
    Write-Host "  You may need to restart your computer for changes to take effect." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green

