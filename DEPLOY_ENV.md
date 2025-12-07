# Переменные окружения для деплоя

Скопируйте эти переменные в настройки вашей платформы деплоя:

## Обязательные переменные:

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
QR_POINT_SECRET=your-qr-secret-key-minimum-32-characters-long
NODE_ENV=production
PORT=5000
```

## Инструкция для Railway:

1. Перейдите в Settings → Variables
2. Добавьте все переменные выше
3. Для DATABASE_URL - Railway автоматически создаст переменную при подключении PostgreSQL
4. Обновите FRONTEND_URL на ваш реальный домен

## Инструкция для Render:

1. Перейдите в Environment
2. Добавьте все переменные
3. Для DATABASE_URL - используйте внутренний URL из Render PostgreSQL

## Инструкция для Heroku:

```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set FRONTEND_URL=https://your-domain.com
heroku config:set QR_POINT_SECRET=your-qr-secret
heroku config:set NODE_ENV=production
```

DATABASE_URL будет автоматически добавлен при подключении PostgreSQL addon.

