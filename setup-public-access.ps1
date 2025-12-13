# Script to setup public access configuration
# Run: powershell -ExecutionPolicy Bypass -File setup-public-access.ps1

Write-Host "=== Public Access Configuration ===" -ForegroundColor Green
Write-Host ""

$publicIP = "178.67.157.66"
$localIP = "192.168.0.103"

Write-Host "Public IP: $publicIP" -ForegroundColor Cyan
Write-Host "Local IP: $localIP" -ForegroundColor Cyan
Write-Host ""

# Check Port Forwarding configuration
Write-Host "Checking Port Forwarding configuration..." -ForegroundColor Yellow
Write-Host "Make sure router is configured:" -ForegroundColor Yellow
Write-Host "  - External port 8081 -> Local $localIP:8081 (TCP)" -ForegroundColor Gray
Write-Host "  - External port 8444 -> Local $localIP:8444 (TCP)" -ForegroundColor Gray
Write-Host ""

# Update .env file
Write-Host "Updating .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    
    # Update REACT_APP_API_URL
    if ($envContent -match "REACT_APP_API_URL=") {
        $envContent = $envContent -replace "REACT_APP_API_URL=.*", "REACT_APP_API_URL=/api"
    } else {
        $envContent += "`nREACT_APP_API_URL=/api"
    }
    
    # Update FRONTEND_URL
    if ($envContent -match "FRONTEND_URL=") {
        $envContent = $envContent -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://$publicIP:8081"
    } else {
        $envContent += "`nFRONTEND_URL=http://$publicIP:8081"
    }
    
    $envContent | Out-File -FilePath .env -Encoding UTF8 -NoNewline
    Write-Host "[OK] .env file updated" -ForegroundColor Green
} else {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Create .env from env.docker.example" -ForegroundColor Yellow
    exit 1
}

# Check firewall
Write-Host ""
Write-Host "Checking firewall..." -ForegroundColor Yellow
$firewall8081 = Get-NetFirewallRule -DisplayName "HTTP (Port 8081)" -ErrorAction SilentlyContinue
$firewall8444 = Get-NetFirewallRule -DisplayName "HTTPS (Port 8444)" -ErrorAction SilentlyContinue

if (-not $firewall8081 -or -not $firewall8081.Enabled) {
    Write-Host "[WARNING] Firewall rule for port 8081 not found" -ForegroundColor Yellow
    Write-Host "  Run: powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1" -ForegroundColor Gray
} else {
    Write-Host "[OK] Firewall configured for port 8081" -ForegroundColor Green
}

if (-not $firewall8444 -or -not $firewall8444.Enabled) {
    Write-Host "[WARNING] Firewall rule for port 8444 not found" -ForegroundColor Yellow
    Write-Host "  Run: powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1" -ForegroundColor Gray
} else {
    Write-Host "[OK] Firewall configured for port 8444" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Configuration completed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your site will be available at:" -ForegroundColor Cyan
Write-Host "  http://$publicIP:8081" -ForegroundColor Green
Write-Host "  https://$publicIP:8444 (if domain configured)" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure Port Forwarding is configured on router:" -ForegroundColor Gray
Write-Host "     - External port 8081 -> Local $localIP:8081 (TCP)" -ForegroundColor Gray
Write-Host "     - External port 8444 -> Local $localIP:8444 (TCP)" -ForegroundColor Gray
Write-Host "  2. Run deployment: powershell -ExecutionPolicy Bypass -File deploy-windows.ps1" -ForegroundColor Gray
Write-Host "  3. Check access: Invoke-WebRequest -Uri http://$publicIP:8081/api/health" -ForegroundColor Gray
Write-Host ""
