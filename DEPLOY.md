# Инструкция по развертыванию в интернете

Это руководство поможет вам развернуть ERP систему для типографии в интернете.

## 🎯 Варианты развертывания

### 1. Docker (рекомендуется) - VPS сервер
### 2. Railway.app (быстро и просто)
### 3. Heroku
### 4. VPS с ручной установкой

---

## 📦 Вариант 1: Docker на VPS сервере

### Требования:
- VPS сервер (Ubuntu 20.04+, минимум 2GB RAM)
- Домен (опционально, но рекомендуется)
- SSH доступ к серверу

### Шаг 1: Подготовка сервера

```bash
# Подключитесь к серверу по SSH
ssh root@your-server-ip

# Обновите систему
apt update && apt upgrade -y

# Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
apt install docker-compose -y

# Проверьте установку
docker --version
docker-compose --version
```

### Шаг 2: Клонирование проекта

```bash
# Установите Git (если нет)
apt install git -y

# Клонируйте репозиторий (или загрузите файлы)
git clone <your-repo-url> /opt/typography-erp
cd /opt/typography-erp
```

### Шаг 3: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
nano .env
```

Добавьте следующие переменные:

```env
# База данных
DB_USER=typography_user
DB_PASSWORD=your_strong_password_here
DB_NAME=typography_erp
DB_PORT=5432

# Backend
BACKEND_PORT=5000
JWT_SECRET=your-very-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://yourdomain.com

# QR коды
QR_POINT_SECRET=your-qr-secret-key-min-32-characters

# Порт фронтенда
FRONTEND_PORT=80
```

**ВАЖНО**: Замените все пароли и секретные ключи на свои собственные!

### Шаг 4: Сборка и запуск

```bash
# Соберите и запустите контейнеры
docker-compose up -d --build

# Проверьте статус
docker-compose ps

# Просмотрите логи
docker-compose logs -f
```

### Шаг 5: Инициализация базы данных

```bash
# Войдите в контейнер бэкенда
docker exec -it typography_backend sh

# Выполните миграции
npx prisma migrate deploy

# Создайте администратора
npm run create:admin

# Выйдите из контейнера
exit
```

### Шаг 6: Настройка домена и SSL (Nginx + Let's Encrypt)

```bash
# Установите Nginx
apt install nginx certbot python3-certbot-nginx -y

# Создайте конфигурацию для вашего домена
nano /etc/nginx/sites-available/typography
```

Добавьте конфигурацию:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/typography /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Получите SSL сертификат
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🚂 Вариант 2: Railway.app (быстрое развертывание)

Railway автоматически развернет ваше приложение.

### Шаг 1: Подготовка

1. Зарегистрируйтесь на [Railway.app](https://railway.app)
2. Установите Railway CLI: `npm i -g @railway/cli`

### Шаг 2: Развертывание

```bash
# Войдите в Railway
railway login

# Инициализируйте проект
railway init

# Создайте сервисы
# 1. PostgreSQL (выберите из шаблонов)
# 2. Backend (из Dockerfile.backend)
# 3. Frontend (из Dockerfile.frontend)

# Установите переменные окружения в панели Railway
```

### Переменные окружения для Railway:

- `DATABASE_URL` - автоматически создается Railway
- `FRONTEND_URL` - URL вашего Railway домена
- `JWT_SECRET` - создайте свой секретный ключ
- `QR_POINT_SECRET` - создайте свой секретный ключ

---

## 🐳 Вариант 3: Heroku

### Шаг 1: Подготовка

1. Зарегистрируйтесь на [Heroku](https://heroku.com)
2. Установите Heroku CLI
3. Войдите: `heroku login`

### Шаг 2: Создание приложений

```bash
# Создайте приложение для бэкенда
heroku create typography-backend

# Создайте приложение для фронтенда
heroku create typography-frontend

# Добавьте PostgreSQL аддон
heroku addons:create heroku-postgresql:hobby-dev -a typography-backend
```

### Шаг 3: Переменные окружения

```bash
# Backend
heroku config:set NODE_ENV=production -a typography-backend
heroku config:set JWT_SECRET=your-secret -a typography-backend
heroku config:set FRONTEND_URL=https://typography-frontend.herokuapp.com -a typography-backend

# DATABASE_URL автоматически установится при добавлении PostgreSQL
```

### Шаг 4: Деплой

```bash
# Backend
cd backend
heroku git:remote -a typography-backend
git push heroku main

# После деплоя выполните миграции
heroku run npx prisma migrate deploy -a typography-backend
heroku run npm run create:admin -a typography-backend

# Frontend
cd ../frontend
heroku git:remote -a typography-frontend
git push heroku main
```

---

## 🖥️ Вариант 4: VPS с ручной установкой

### Шаг 1: Установка Node.js и PostgreSQL

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PostgreSQL
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql

# Создайте базу данных
sudo -u postgres psql
CREATE DATABASE typography_erp;
CREATE USER typography_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE typography_erp TO typography_user;
\q
```

### Шаг 2: Настройка Backend

```bash
cd /opt/typography-erp/backend
npm install
cp env.example .env
nano .env  # Настройте переменные

# Миграции
npx prisma generate
npx prisma migrate deploy

# Создайте администратора
npm run create:admin

# Установите PM2 для управления процессом
npm install -g pm2
pm2 start npm --name "backend" -- start
pm2 save
pm2 startup
```

### Шаг 3: Настройка Frontend

```bash
cd /opt/typography-erp/frontend
npm install --legacy-peer-deps
npm run build

# Настройте Nginx для раздачи статики
cp -r build/* /var/www/html/

# Или используйте serve
npm install -g serve
pm2 serve build 3000 --name "frontend" --spa
```

### Шаг 4: Настройка Nginx

```bash
apt install nginx -y
nano /etc/nginx/sites-available/typography
```

Добавьте конфигурацию из раздела "Docker + SSL" выше.

---

## 🔐 Безопасность

### Обязательно:
1. ✅ Используйте сильные пароли для базы данных
2. ✅ Измените `JWT_SECRET` на случайную строку (минимум 32 символа)
3. ✅ Используйте HTTPS (SSL сертификат)
4. ✅ Ограничьте доступ к портам через firewall
5. ✅ Настройте регулярные бэкапы базы данных

### Настройка Firewall (UFW)

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

---

## 📊 Мониторинг и обслуживание

### Просмотр логов (Docker)

```bash
# Все сервисы
docker-compose logs -f

# Только бэкенд
docker-compose logs -f backend

# Только фронтенд
docker-compose logs -f frontend
```

### Обновление приложения

```bash
# Остановите контейнеры
docker-compose down

# Обновите код
git pull

# Пересоберите и запустите
docker-compose up -d --build

# Выполните миграции, если нужно
docker exec -it typography_backend npx prisma migrate deploy
```

### Бэкапы базы данных

```bash
# Создайте скрипт бэкапа
nano /opt/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec typography_postgres pg_dump -U typography_user typography_erp > /opt/backups/db_backup_$DATE.sql
# Храните только последние 7 дней
find /opt/backups -name "db_backup_*.sql" -mtime +7 -delete
```

```bash
chmod +x /opt/backup-db.sh

# Добавьте в cron для ежедневных бэкапов
crontab -e
# Добавьте строку: 0 2 * * * /opt/backup-db.sh
```

---

## 🌐 Полезные ссылки

- **VPS провайдеры**: DigitalOcean, Linode, Vultr, Timeweb
- **Облачные платформы**: Railway, Render, Heroku, Fly.io
- **Домены**: Namecheap, GoDaddy, Reg.ru
- **SSL сертификаты**: Let's Encrypt (бесплатно)

---

## ❓ Частые проблемы

### Порт занят
```bash
# Проверьте, что использует порт
sudo lsof -i :5000
sudo lsof -i :80

# Остановите процесс или измените порт в .env
```

### Ошибки подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в .env
- Убедитесь, что база данных создана

### Frontend не подключается к Backend
- Проверьте FRONTEND_URL в .env бэкенда
- Убедитесь, что CORS настроен правильно
- Проверьте прокси в nginx.conf

---

После завершения развертывания ваше приложение будет доступно по адресу вашего домена или IP-адреса сервера!

