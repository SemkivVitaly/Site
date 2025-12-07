# Скрипт для настройки проекта на Railway через CLI
# Требуется: npm i -g @railway/cli

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Настройка проекта на Railway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Railway CLI
Write-Host "Проверка Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "Railway CLI не установлен. Установка..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ошибка установки Railway CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Railway CLI установлен ✓" -ForegroundColor Green
Write-Host ""

# Вход в Railway
Write-Host "Вход в Railway..." -ForegroundColor Yellow
railway login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка входа в Railway" -ForegroundColor Red
    exit 1
}

Write-Host "Вход выполнен ✓" -ForegroundColor Green
Write-Host ""

# Связывание с проектом
Write-Host "Связывание с проектом..." -ForegroundColor Yellow
Write-Host "Выберите проект 'Tipograf' из списка" -ForegroundColor Cyan
railway link
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка связывания с проектом" -ForegroundColor Red
    exit 1
}

Write-Host "Проект связан ✓" -ForegroundColor Green
Write-Host ""

# Получение DATABASE_URL
Write-Host "Получение DATABASE_URL из PostgreSQL..." -ForegroundColor Yellow
$databaseUrl = railway variables --service $(railway service list | Select-String -Pattern "postgres" | ForEach-Object { $_.ToString().Split()[0] } | Select-Object -First 1) --json | ConvertFrom-Json | Select-Object -ExpandProperty DATABASE_URL

if (-not $databaseUrl) {
    Write-Host "Не удалось получить DATABASE_URL автоматически" -ForegroundColor Red
    Write-Host "Пожалуйста, получите DATABASE_URL вручную из PostgreSQL сервиса в Railway" -ForegroundColor Yellow
    $databaseUrl = Read-Host "Введите DATABASE_URL"
}

Write-Host "DATABASE_URL получен ✓" -ForegroundColor Green
Write-Host ""

# Генерация секретов
Write-Host "Генерация секретов..." -ForegroundColor Yellow
$jwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$qrSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

Write-Host "Секреты сгенерированы ✓" -ForegroundColor Green
Write-Host ""

# Настройка Backend сервиса
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Настройка Backend сервиса" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Выберите сервис 'handsome-serenity' (backend)" -ForegroundColor Yellow
railway service

$backendUrl = Read-Host "Введите URL бэкенда (после настройки домена в Railway)"
if (-not $backendUrl) {
    $backendUrl = "https://handsome-serenity-production.up.railway.app"
}

Write-Host "Установка переменных окружения для Backend..." -ForegroundColor Yellow

railway variables set DATABASE_URL="$databaseUrl"
railway variables set JWT_SECRET="$jwtSecret"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set NODE_ENV="production"
railway variables set PORT="5000"
railway variables set UPLOAD_DIR="./uploads"
railway variables set MAX_FILE_SIZE="10485760"
railway variables set QR_POINT_SECRET="$qrSecret"

Write-Host "Переменные окружения установлены ✓" -ForegroundColor Green
Write-Host ""

Write-Host "ВАЖНО: В настройках сервиса (Settings → Service Settings) установите:" -ForegroundColor Yellow
Write-Host "  - Root Directory: backend" -ForegroundColor Cyan
Write-Host "  - Generate Domain в разделе Networking" -ForegroundColor Cyan
Write-Host ""

# Настройка Frontend сервиса
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Настройка Frontend сервиса" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Выберите сервис 'Site' (frontend)" -ForegroundColor Yellow
railway service

$frontendUrl = Read-Host "Введите URL фронтенда (после настройки домена в Railway)"
if (-not $frontendUrl) {
    $frontendUrl = "https://site-production.up.railway.app"
}

Write-Host "Установка переменных окружения для Frontend..." -ForegroundColor Yellow

railway variables set REACT_APP_API_URL="$backendUrl/api"

Write-Host "Переменные окружения установлены ✓" -ForegroundColor Green
Write-Host ""

Write-Host "ВАЖНО: В настройках сервиса (Settings → Service Settings) установите:" -ForegroundColor Yellow
Write-Host "  - Root Directory: frontend" -ForegroundColor Cyan
Write-Host "  - Generate Domain в разделе Networking" -ForegroundColor Cyan
Write-Host ""

# Обновление FRONTEND_URL в Backend
Write-Host "Обновление FRONTEND_URL в Backend..." -ForegroundColor Yellow
railway service # Вернуться к backend
railway variables set FRONTEND_URL="$frontendUrl"

Write-Host "FRONTEND_URL обновлен ✓" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Настройка завершена!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Убедитесь, что Root Directory установлен для обоих сервисов" -ForegroundColor Cyan
Write-Host "2. Убедитесь, что домены сгенерированы для обоих сервисов" -ForegroundColor Cyan
Write-Host "3. Railway автоматически пересоберет сервисы" -ForegroundColor Cyan
Write-Host "4. Проверьте логи в Railway для отслеживания прогресса" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL сервисов:" -ForegroundColor Yellow
Write-Host "  Backend: $backendUrl" -ForegroundColor Cyan
Write-Host "  Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host ""

