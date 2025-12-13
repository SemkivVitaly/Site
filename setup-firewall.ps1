# Script for automatic Windows Firewall configuration
# Run as administrator: powershell -ExecutionPolicy Bypass -File setup-firewall.ps1

Write-Host "=== Windows Firewall Configuration for Web Server ===" -ForegroundColor Green
Write-Host ""

# Check administrator rights
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator rights!" -ForegroundColor Red
    Write-Host "Please run PowerShell as administrator" -ForegroundColor Yellow
    exit 1
}

# Create rule for HTTP (port 80)
Write-Host "Creating rule for HTTP (port 80)..." -ForegroundColor Yellow
$rule80 = Get-NetFirewallRule -DisplayName "HTTP (Port 80)" -ErrorAction SilentlyContinue
if (-not $rule80) {
    New-NetFirewallRule -DisplayName "HTTP (Port 80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for port 80 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for port 80 already exists" -ForegroundColor Green
}

# Create rule for HTTPS (port 443)
Write-Host "Creating rule for HTTPS (port 443)..." -ForegroundColor Yellow
$rule443 = Get-NetFirewallRule -DisplayName "HTTPS (Port 443)" -ErrorAction SilentlyContinue
if (-not $rule443) {
    New-NetFirewallRule -DisplayName "HTTPS (Port 443)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for port 443 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for port 443 already exists" -ForegroundColor Green
}

# Create rule for UDP 443 (for QUIC)
Write-Host "Creating rule for UDP 443 (QUIC)..." -ForegroundColor Yellow
$rule443UDP = Get-NetFirewallRule -DisplayName "HTTPS UDP (Port 443)" -ErrorAction SilentlyContinue
if (-not $rule443UDP) {
    New-NetFirewallRule -DisplayName "HTTPS UDP (Port 443)" -Direction Inbound -Protocol UDP -LocalPort 443 -Action Allow -Profile Domain,Private,Public | Out-Null
    Write-Host "[OK] Rule for UDP port 443 created" -ForegroundColor Green
} else {
    Write-Host "[OK] Rule for UDP port 443 already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Firewall configuration completed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Checking rules:" -ForegroundColor Cyan
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*HTTP*" -or $_.DisplayName -like "*HTTPS*"} | Format-Table DisplayName, Enabled, Direction, Action

