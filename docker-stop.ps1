# Скрипт для остановки Docker контейнеров
Write-Host "Остановка Docker контейнеров..." -ForegroundColor Yellow
docker compose down
Write-Host "Контейнеры остановлены" -ForegroundColor Green

