# Script for checking deployment status
# Run: powershell -ExecutionPolicy Bypass -File check-deployment.ps1

Write-Host "=== Deployment Status Check ===" -ForegroundColor Green
Write-Host ""

# Check Docker
Write-Host "1. Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "   [OK] Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Docker not found!" -ForegroundColor Red
}

# Check containers
Write-Host "2. Checking containers..." -ForegroundColor Yellow
$containers = docker compose -p typography -f docker-compose.prod.yml ps 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Container status:" -ForegroundColor Cyan
    $containers | ForEach-Object {
        if ($_ -match "Up|healthy") {
            Write-Host "   [OK] $_" -ForegroundColor Green
        } elseif ($_ -match "Exit|unhealthy") {
            Write-Host "   [ERROR] $_" -ForegroundColor Red
        } else {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "   [ERROR] Error checking containers" -ForegroundColor Red
}

# Check ports
Write-Host "3. Checking ports..." -ForegroundColor Yellow
$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
$port8444 = Get-NetTCPConnection -LocalPort 8444 -ErrorAction SilentlyContinue

if ($port8081) {
    Write-Host "   [OK] Port 8081 (HTTP) is open" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Port 8081 (HTTP) is not open" -ForegroundColor Red
}

if ($port8444) {
    Write-Host "   [OK] Port 8444 (HTTPS) is open" -ForegroundColor Green
} else {
    Write-Host "   [ERROR] Port 8444 (HTTPS) is not open" -ForegroundColor Red
}

# Check firewall
Write-Host "4. Checking firewall..." -ForegroundColor Yellow
$firewall8081 = Get-NetFirewallRule -DisplayName "HTTP (Port 8081)" -ErrorAction SilentlyContinue
$firewall8444 = Get-NetFirewallRule -DisplayName "HTTPS (Port 8444)" -ErrorAction SilentlyContinue

if ($firewall8081 -and $firewall8081.Enabled) {
    Write-Host "   [OK] Firewall rule for port 8081 is enabled" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Firewall rule for port 8081 not found" -ForegroundColor Yellow
    Write-Host "   Run: powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1" -ForegroundColor Gray
}

if ($firewall8444 -and $firewall8444.Enabled) {
    Write-Host "   [OK] Firewall rule for port 8444 is enabled" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Firewall rule for port 8444 not found" -ForegroundColor Yellow
    Write-Host "   Run: powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1" -ForegroundColor Gray
}

# Check API
Write-Host "5. Checking API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:8081/api/health -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] API responds: $($response.Content)" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] API returned code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] API unavailable: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Frontend
Write-Host "6. Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:8081 -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Frontend responds (code 200)" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Frontend returned code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Frontend unavailable: $($_.Exception.Message)" -ForegroundColor Red
}

# Get IP address
Write-Host "7. Network settings..." -ForegroundColor Yellow
$ipConfig = ipconfig | Select-String "IPv4"
$ipConfig | ForEach-Object {
    if ($_ -match "(\d+\.\d+\.\d+\.\d+)") {
        $ip = $matches[1]
        if ($ip -notmatch "^127\.") {
            Write-Host "   IP address: $ip" -ForegroundColor Cyan
        }
    }
}

# Get public IP
Write-Host "8. Public IP..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing).Content
    Write-Host "   Public IP: $publicIP" -ForegroundColor Cyan
} catch {
    Write-Host "   [ERROR] Could not get public IP" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Check completed ===" -ForegroundColor Green
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  docker compose -p typography -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
