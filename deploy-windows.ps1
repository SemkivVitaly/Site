# Script for automatic deployment on Windows Server
# Run: powershell -ExecutionPolicy Bypass -File deploy-windows.ps1

Write-Host "=== Typography ERP Deployment on Windows Server ===" -ForegroundColor Green
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Docker not found!" -ForegroundColor Red
        Write-Host "Please install Docker Desktop" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Docker not found!" -ForegroundColor Red
    exit 1
}

# Check docker-compose
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker Compose found: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Docker Compose not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Docker Compose not found!" -ForegroundColor Red
    exit 1
}

# Check .env file
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "[OK] .env file found" -ForegroundColor Green
    
    $envContent = Get-Content .env -Raw
    if ($envContent -match "change-this" -or $envContent -match "your-") {
        Write-Host "[WARNING] .env file contains default values!" -ForegroundColor Yellow
        Write-Host "  Please edit .env file before deployment" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "Continue with default values? (y/n)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 0
        }
    }
} else {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    if (Test-Path env.docker.example) {
        Write-Host "Creating .env from template..." -ForegroundColor Yellow
        Copy-Item env.docker.example .env
        Write-Host "[OK] .env file created. Please edit it!" -ForegroundColor Yellow
        Write-Host "  Important to change:" -ForegroundColor Yellow
        Write-Host "  - POSTGRES_PASSWORD" -ForegroundColor Cyan
        Write-Host "  - JWT_SECRET" -ForegroundColor Cyan
        Write-Host "  - QR_POINT_SECRET" -ForegroundColor Cyan
        Write-Host "  - REACT_APP_API_URL" -ForegroundColor Cyan
        Write-Host "  - FRONTEND_URL" -ForegroundColor Cyan
        exit 1
    } else {
        Write-Host "[ERROR] Template env.docker.example not found!" -ForegroundColor Red
        exit 1
    }
}

# Check Caddyfile.prod
Write-Host "Checking Caddyfile.prod..." -ForegroundColor Yellow
if (Test-Path Caddyfile.prod) {
    Write-Host "[OK] Caddyfile.prod found" -ForegroundColor Green
    $caddyContent = Get-Content Caddyfile.prod -Raw
    if ($caddyContent -match "ваш-домен.com") {
        Write-Host "[WARNING] Caddyfile.prod uses example domain!" -ForegroundColor Yellow
        Write-Host "  If you don't have a domain, change to :80 for HTTP" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Caddyfile.prod not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting build and container startup..." -ForegroundColor Green
Write-Host "This may take 10-20 minutes on first run..." -ForegroundColor Yellow
Write-Host ""

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker compose -p typography -f docker-compose.prod.yml down 2>&1 | Out-Null

# Build images
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker compose -p typography -f docker-compose.prod.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    exit 1
}

# Start containers
Write-Host "Starting containers..." -ForegroundColor Yellow
docker compose -p typography -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Startup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check status
Write-Host "Checking container status..." -ForegroundColor Yellow
docker compose -p typography -f docker-compose.prod.yml ps

Write-Host ""
Write-Host "=== Deployment completed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Check logs:" -ForegroundColor Cyan
Write-Host "  docker compose -p typography -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Initialize database:" -ForegroundColor Cyan
Write-Host "  docker compose -p typography -f docker-compose.prod.yml exec backend node scripts/create-admin.js" -ForegroundColor Gray
Write-Host ""
Write-Host "Check health:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest -Uri http://localhost:8081/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Your site will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:8081" -ForegroundColor Green
Write-Host "  https://localhost:8444 (if using domain)" -ForegroundColor Green
Write-Host ""
