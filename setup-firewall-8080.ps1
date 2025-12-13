# Script for automatic Windows Firewall configuration for ports 8081 and 8444
# Run as administrator: powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1

Write-Host "=== Windows Firewall Configuration for Web Server (Ports 8081/8444) ===" -ForegroundColor Green
Write-Host ""

# Check administrator rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator rights!" -ForegroundColor Red
    Write-Host "Please run PowerShell as administrator" -ForegroundColor Yellow
    exit 1
}

# Create rule for HTTP (port 8081)
Write-Host "Creating rule for HTTP (port 8081)..." -ForegroundColor Yellow
$rule8081 = Get-NetFirewallRule -DisplayName "HTTP (Port 8081)" -ErrorAction SilentlyContinue
if (-not $rule8081) {
    New-NetFirewallRule -DisplayName "HTTP (Port 8081)" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for port 8081 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for port 8081 already exists" -ForegroundColor Green
}

# Create rule for HTTPS (port 8444)
Write-Host "Creating rule for HTTPS (port 8444)..." -ForegroundColor Yellow
$rule8444 = Get-NetFirewallRule -DisplayName "HTTPS (Port 8444)" -ErrorAction SilentlyContinue
if (-not $rule8444) {
    New-NetFirewallRule -DisplayName "HTTPS (Port 8444)" -Direction Inbound -Protocol TCP -LocalPort 8444 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for port 8444 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for port 8444 already exists" -ForegroundColor Green
}

# Create rule for UDP 8444 (for QUIC)
Write-Host "Creating rule for UDP 8444 (QUIC)..." -ForegroundColor Yellow
$rule8444UDP = Get-NetFirewallRule -DisplayName "HTTPS UDP (Port 8444)" -ErrorAction SilentlyContinue
if (-not $rule8444UDP) {
    New-NetFirewallRule -DisplayName "HTTPS UDP (Port 8444)" -Direction Inbound -Protocol UDP -LocalPort 8444 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for UDP port 8444 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for UDP port 8444 already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Firewall configuration completed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Checking rules:" -ForegroundColor Cyan
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8081*" -or $_.DisplayName -like "*8444*"} | Format-Table DisplayName, Enabled, Direction, Action

