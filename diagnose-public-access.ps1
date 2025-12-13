# Script for diagnosing public access issues
# Run: powershell -ExecutionPolicy Bypass -File diagnose-public-access.ps1

Write-Host "=== Public Access Diagnostics ===" -ForegroundColor Green
Write-Host ""

# Get local IP (exclude virtual adapters like WSL, Hyper-V, VirtualBox)
$excludeInterfaces = @("WSL", "Hyper-V", "VirtualBox", "vEthernet", "TAP", "OpenVPN", "outline")
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object {
        ($_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*") -and
        $_.IPAddress -notlike "169.254.*" -and
        ($excludeInterfaces | Where-Object { $_.InterfaceAlias -notlike "*$_*" }) -ne $null
    } | 
    Select-Object IPAddress, InterfaceAlias | 
    Sort-Object InterfaceAlias | 
    Select-Object -First 1)

if ($localIP) {
    $localIPAddress = $localIP.IPAddress
    $localInterface = $localIP.InterfaceAlias
    Write-Host "Local IP address: $localIPAddress" -ForegroundColor Cyan
    Write-Host "Interface: $localInterface" -ForegroundColor Gray
} else {
    # Fallback: get first non-virtual IP
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object {
            ($_.IPAddress -like "192.168.*" -or ($_.IPAddress -like "10.*" -and $_.IPAddress -notlike "10.10.*")) -and
            $_.IPAddress -notlike "169.254.*" -and
            $_.InterfaceAlias -notlike "*WSL*" -and
            $_.InterfaceAlias -notlike "*Hyper-V*" -and
            $_.InterfaceAlias -notlike "*VirtualBox*" -and
            $_.InterfaceAlias -notlike "*vEthernet*"
        } | 
        Select-Object -First 1)
    
    if ($localIP) {
        $localIPAddress = $localIP.IPAddress
        $localInterface = $localIP.InterfaceAlias
        Write-Host "Local IP address: $localIPAddress" -ForegroundColor Cyan
        Write-Host "Interface: $localInterface" -ForegroundColor Gray
    } else {
        Write-Host "[WARNING] Could not determine local IP address!" -ForegroundColor Yellow
        Write-Host "Please check your network settings manually" -ForegroundColor Yellow
        $localIPAddress = "unknown"
    }
}

# Get public IP
Write-Host "Getting public IP..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content.Trim()
    Write-Host "Public IP address: $publicIP" -ForegroundColor Cyan
} catch {
    Write-Host "[WARNING] Could not get public IP: $_" -ForegroundColor Yellow
    $publicIP = "unknown"
}

Write-Host ""

# Check if port 8081 is listening
Write-Host "Checking if port 8081 is listening..." -ForegroundColor Yellow
$listening = netstat -an | Select-String ":8081.*LISTENING"
if ($listening) {
    Write-Host "[OK] Port 8081 is listening on:" -ForegroundColor Green
    $listening | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "[ERROR] Port 8081 is NOT listening!" -ForegroundColor Red
}

Write-Host ""

# Check firewall rules
Write-Host "Checking Windows Firewall rules for port 8081..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8081*"} | Select-Object DisplayName, Enabled, Direction, Action
if ($firewallRules) {
    Write-Host "[OK] Found firewall rules:" -ForegroundColor Green
    $firewallRules | Format-Table -AutoSize
} else {
    Write-Host "[WARNING] No firewall rules found for port 8081!" -ForegroundColor Yellow
    Write-Host "Run setup-firewall-8080.ps1 as administrator" -ForegroundColor Yellow
}

Write-Host ""

# Check Docker containers
Write-Host "Checking Docker containers..." -ForegroundColor Yellow
$containers = docker compose -p typography -f docker-compose.prod.yml ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Docker containers status:" -ForegroundColor Green
    $containers | Select-Object -Skip 1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "[ERROR] Could not check Docker containers" -ForegroundColor Red
}

Write-Host ""

# Test local access
Write-Host "Testing local access to http://localhost:8081..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Local access works! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Local access failed: $_" -ForegroundColor Red
}

Write-Host ""

# Instructions
Write-Host "=== Next Steps ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "If local access works but public access doesn't:" -ForegroundColor Cyan
Write-Host "1. Configure Port Forwarding on your router:" -ForegroundColor White
Write-Host "   - External Port: 8081 (TCP)" -ForegroundColor Gray
Write-Host "   - Internal IP: $localIPAddress" -ForegroundColor Gray
Write-Host "   - Internal Port: 8081" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check if your ISP blocks incoming connections" -ForegroundColor White
Write-Host ""
Write-Host "3. Test from another network (mobile data, etc.)" -ForegroundColor White
Write-Host ""
Write-Host "Your site should be accessible at:" -ForegroundColor Cyan
Write-Host "  http://$publicIP:8081" -ForegroundColor Green
Write-Host ""

