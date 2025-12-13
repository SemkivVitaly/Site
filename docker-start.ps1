# Скрипт для запуска Docker контейнеров
# Запустите: powershell -ExecutionPolicy Bypass -File docker-start.ps1

Write-Host "=== Запуск Typography ERP через Docker ===" -ForegroundColor Green
Write-Host ""

# Проверка Docker
Write-Host "Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker найден: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker не найден!" -ForegroundColor Red
        Write-Host "Пожалуйста, установите Docker Desktop и перезапустите компьютер" -ForegroundColor Red
        Write-Host "Скачать: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "✗ Docker не найден!" -ForegroundColor Red
    Write-Host "Пожалуйста, установите Docker Desktop и перезапустите компьютер" -ForegroundColor Red
    Write-Host "Скачать: https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    exit 1
}

# Проверка docker-compose
Write-Host "Проверка Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker Compose найден: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Docker Compose не найден!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Docker Compose не найден!" -ForegroundColor Red
    exit 1
}

# Проверка .env файла
Write-Host "Проверка .env файла..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✓ .env файл найден" -ForegroundColor Green
    
    # Проверка, что ключи не дефолтные
    $envContent = Get-Content .env -Raw
    if ($envContent -match "change-this" -or $envContent -match "your-") {
        Write-Host "⚠ ВНИМАНИЕ: В .env файле используются дефолтные значения!" -ForegroundColor Yellow
        Write-Host "  Рекомендуется сгенерировать секретные ключи:" -ForegroundColor Yellow
        Write-Host "  powershell -ExecutionPolicy Bypass -File generate-secrets.ps1" -ForegroundColor Cyan
        Write-Host ""
        $continue = Read-Host "Продолжить с дефолтными значениями? (y/n)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 0
        }
    }
} else {
    Write-Host "✗ .env файл не найден!" -ForegroundColor Red
    Write-Host "Создание .env из шаблона..." -ForegroundColor Yellow
    if (Test-Path env.docker.example) {
        Copy-Item env.docker.example .env
        Write-Host "✓ .env файл создан. Пожалуйста, отредактируйте его перед запуском!" -ForegroundColor Yellow
        Write-Host "  Особенно важно изменить JWT_SECRET и QR_POINT_SECRET" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "✗ Шаблон env.docker.example не найден!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Запуск Docker Compose..." -ForegroundColor Green
Write-Host ""

# Запуск docker compose
docker compose up --build

