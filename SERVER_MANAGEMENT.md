# Управление сервером Typography ERP

Полное руководство по управлению сервером и сайтом.

## Быстрый старт

### Запуск сервера (Production)
```powershell
powershell -ExecutionPolicy Bypass -File deploy-windows.ps1
```

### Остановка сервера
```powershell
docker compose -p typography -f docker-compose.prod.yml down
```

### Проверка статуса
```powershell
docker compose -p typography -f docker-compose.prod.yml ps
```

---

## Управление контейнерами

### Запуск всех контейнеров
```powershell
docker compose -p typography -f docker-compose.prod.yml up -d
```

### Остановка всех контейнеров
```powershell
docker compose -p typography -f docker-compose.prod.yml down
```

### Перезапуск всех контейнеров
```powershell
docker compose -p typography -f docker-compose.prod.yml restart
```

### Перезапуск конкретного сервиса
```powershell
# Backend
docker compose -p typography -f docker-compose.prod.yml restart backend

# Frontend
docker compose -p typography -f docker-compose.prod.yml restart frontend

# Caddy (reverse proxy)
docker compose -p typography -f docker-compose.prod.yml restart caddy

# PostgreSQL
docker compose -p typography -f docker-compose.prod.yml restart postgres
```

### Пересборка и запуск
```powershell
docker compose -p typography -f docker-compose.prod.yml up -d --build
```

### Пересборка конкретного сервиса
```powershell
docker compose -p typography -f docker-compose.prod.yml up -d --build backend
docker compose -p typography -f docker-compose.prod.yml up -d --build frontend
```

---

## Просмотр логов

### Все сервисы
```powershell
docker compose -p typography -f docker-compose.prod.yml logs -f
```

### Конкретный сервис
```powershell
# Backend
docker compose -p typography -f docker-compose.prod.yml logs -f backend

# Frontend
docker compose -p typography -f docker-compose.prod.yml logs -f frontend

# Caddy
docker compose -p typography -f docker-compose.prod.yml logs -f caddy

# PostgreSQL
docker compose -p typography -f docker-compose.prod.yml logs -f postgres
```

### Последние N строк логов
```powershell
docker compose -p typography -f docker-compose.prod.yml logs --tail 50 backend
```

---

## Управление базой данных

### Подключение к базе данных
```powershell
docker compose -p typography -f docker-compose.prod.yml exec postgres psql -U typography_user -d typography_erp
```

### Выполнение SQL запроса
```powershell
docker compose -p typography -f docker-compose.prod.yml exec -T postgres psql -U typography_user -d typography_erp -c "SELECT * FROM users;"
```

### Создание резервной копии
```powershell
docker compose -p typography -f docker-compose.prod.yml exec postgres pg_dump -U typography_user typography_erp > backup_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").sql
```

### Восстановление из резервной копии
```powershell
Get-Content backup_2025-12-11_01-00-00.sql | docker compose -p typography -f docker-compose.prod.yml exec -T postgres psql -U typography_user typography_erp
```

### Применение миграций Prisma
```powershell
docker compose -p typography -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Генерация Prisma Client
```powershell
docker compose -p typography -f docker-compose.prod.yml exec backend npx prisma generate
```

### Просмотр схемы базы данных
```powershell
docker compose -p typography -f docker-compose.prod.yml exec backend npx prisma studio
```

---

## Управление пользователями

### Создание администратора
```powershell
docker compose -p typography -f docker-compose.prod.yml exec backend node scripts/create-admin.js
```

### Инициализация базы данных
```powershell
docker compose -p typography -f docker-compose.prod.yml exec backend node scripts/init-db.js
```

---

## Проверка работоспособности

### Проверка API
```powershell
Invoke-WebRequest -Uri http://localhost:8080/api/health -UseBasicParsing
```

### Проверка фронтенда
```powershell
Invoke-WebRequest -Uri http://localhost:8080 -UseBasicParsing
```

### Проверка доступности из интернета
```powershell
# Запустите диагностику
powershell -ExecutionPolicy Bypass -File diagnose-public-access.ps1
```

### Проверка портов
```powershell
netstat -an | Select-String ":8080"
```

---

## Управление файлами

### Просмотр загруженных файлов
```powershell
Get-ChildItem -Path .\backend\public\uploads
```

### Очистка загруженных файлов
```powershell
Remove-Item -Path .\backend\public\uploads\* -Recurse -Force
```

### Размер директории uploads
```powershell
Get-ChildItem -Path .\backend\public\uploads -Recurse | Measure-Object -Property Length -Sum
```

---

## Очистка и обслуживание

### Остановка и удаление контейнеров
```powershell
docker compose -p typography -f docker-compose.prod.yml down
```

### Остановка и удаление контейнеров + volumes (⚠️ удалит данные БД)
```powershell
docker compose -p typography -f docker-compose.prod.yml down -v
```

### Очистка неиспользуемых Docker ресурсов
```powershell
docker system prune -a
```

### Просмотр использования дискового пространства
```powershell
docker system df
```

### Просмотр логов Docker
```powershell
docker events
```

---

## Переменные окружения

### Просмотр текущих переменных окружения
```powershell
Get-Content .env
```

### Редактирование переменных окружения
```powershell
notepad .env
```

### После изменения .env перезапустите контейнеры
```powershell
docker compose -p typography -f docker-compose.prod.yml down
docker compose -p typography -f docker-compose.prod.yml up -d
```

---

## Полезные команды

### Просмотр всех Docker контейнеров
```powershell
docker ps -a
```

### Просмотр Docker образов
```powershell
docker images
```

### Выполнение команды в контейнере
```powershell
# Пример: открыть shell в контейнере backend
docker compose -p typography -f docker-compose.prod.yml exec backend sh

# Пример: открыть shell в контейнере postgres
docker compose -p typography -f docker-compose.prod.yml exec postgres sh
```

### Копирование файла из контейнера
```powershell
docker compose -p typography -f docker-compose.prod.yml cp backend:/app/file.txt ./
```

### Копирование файла в контейнер
```powershell
docker compose -p typography -f docker-compose.prod.yml cp ./file.txt backend:/app/
```

---

## Мониторинг

### Использование ресурсов контейнерами
```powershell
docker stats
```

### Просмотр сетевых подключений
```powershell
docker network ls
docker network inspect typography_typography-network
```

---

## Решение проблем

### Просмотр детальной информации о контейнере
```powershell
docker inspect typography-backend
```

### Проверка логов с временными метками
```powershell
docker compose -p typography -f docker-compose.prod.yml logs --timestamps backend
```

### Перезапуск при проблемах с сетью
```powershell
docker compose -p typography -f docker-compose.prod.yml down
docker compose -p typography -f docker-compose.prod.yml up -d
```

### Проверка конфигурации Caddy
```powershell
docker compose -p typography -f docker-compose.prod.yml exec caddy caddy validate --config /etc/caddy/Caddyfile
```

---

## Информация о доступе

### Локальный доступ
- **HTTP:** http://localhost:8081
- **API:** http://localhost:8081/api

### Публичный доступ
- **HTTP:** http://178.67.157.66:8081
- **HTTPS:** https://178.67.157.66:8444
- **API:** http://178.67.157.66:8081/api

### Данные для входа (по умолчанию)
- **Email:** admin@typography.ru
- **Пароль:** admin123

⚠️ **ВАЖНО:** Смените пароль после первого входа!

---

## Автоматизация

### Создание задачи в Windows Task Scheduler для автозапуска

1. Откройте Планировщик заданий Windows
2. Создайте новую задачу:
   - **Триггер:** При входе в систему
   - **Действие:** Запуск программы
   - **Программа:** `powershell.exe`
   - **Аргументы:** `-ExecutionPolicy Bypass -File "C:\Users\vital\Типография\deploy-windows.ps1"`

### Создание скрипта для ежедневного бэкапа

Создайте файл `backup-daily.ps1`:
```powershell
$backupFile = "backup_$(Get-Date -Format 'yyyy-MM-dd').sql"
docker compose -p typography -f docker-compose.prod.yml exec postgres pg_dump -U typography_user typography_erp > ".\backups\$backupFile"
Write-Host "Backup created: $backupFile"
```

---

## Безопасность

### Проверка правил Firewall
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8080*" -or $_.DisplayName -like "*8443*"}
```

### Настройка Firewall (если нужно)
```powershell
powershell -ExecutionPolicy Bypass -File setup-firewall-8080.ps1
```

---

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose -p typography -f docker-compose.prod.yml logs -f`
2. Проверьте статус контейнеров: `docker compose -p typography -f docker-compose.prod.yml ps`
3. Проверьте доступность портов: `netstat -an | Select-String ":8080"`

