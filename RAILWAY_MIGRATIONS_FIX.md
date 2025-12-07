# Решение проблемы с миграциями Prisma на Railway

## Проблема

При выполнении команды:
```bash
railway run npx prisma migrate deploy
```

Возникает ошибка:
```
Error: P1001: Can't reach database server at `postgres.railway.internal:5432`
```

## Причина

Команда `railway run` пытается использовать внутренний адрес базы данных (`postgres.railway.internal`), который доступен **только внутри инфраструктуры Railway**, а не с вашей локальной машины.

## Решение

### ✅ Способ 1: Автоматическое выполнение (Рекомендуется)

**Миграции уже настроены для автоматического выполнения!**

В файле `backend/nixpacks.toml` (строка 16) настроена автоматическая выполнение миграций при каждом деплое:

```toml
[start]
cmd = "npx prisma migrate deploy && node dist/index.js"
```

Это означает, что при развертывании сервиса бэкенда на Railway миграции выполнятся автоматически. **Ничего дополнительного делать не нужно!**

Просто:
1. Разверните сервис бэкенда на Railway
2. Миграции применятся автоматически при первом запуске
3. Проверьте логи в Railway, чтобы убедиться, что миграции выполнены успешно

### Способ 2: Использование публичного DATABASE_URL

Если все же нужно выполнить миграции вручную перед деплоем:

#### Шаг 1: Получите публичный DATABASE_URL

1. Откройте ваш проект на [Railway](https://railway.app)
2. Перейдите к PostgreSQL базе данных
3. Откройте вкладку **"Variables"**
4. Найдите переменную `DATABASE_URL` или `POSTGRES_URL`
5. Скопируйте значение

**Важно:** Публичный URL должен выглядеть примерно так:
```
postgres://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

А не так:
```
postgres://postgres:password@postgres.railway.internal:5432/railway
```

#### Шаг 2A: Через Railway CLI

```bash
# Установите Railway CLI (если еще не установлен)
npm i -g @railway/cli

# Войдите в Railway
railway login

# Свяжите с проектом
railway link

# Установите публичный DATABASE_URL
railway variables set DATABASE_URL="<ваш-публичный-DATABASE_URL>"

# Выполните миграции
cd backend
railway run npx prisma migrate deploy
```

#### Шаг 2B: Локально с временным .env

```bash
# Временно добавьте публичный DATABASE_URL в backend/.env
# (создайте или отредактируйте файл)

# Выполните миграции локально
cd backend
npx prisma migrate deploy

# ⚠️ ВАЖНО: После выполнения верните локальный DATABASE_URL
# или удалите временный файл
```

### Способ 3: Через Railway Console

1. Откройте ваш проект на Railway
2. Перейдите к сервису бэкенда
3. Откройте последний деплой
4. Найдите кнопку **"View Logs"** или **"Open Console"**
5. В консоли выполните: `npx prisma migrate deploy`

## Проверка успешного выполнения

После выполнения миграций проверьте:

1. **В логах Railway** должны быть строки:
   ```
   Prisma schema loaded from prisma/schema.prisma
   Datasource "db": PostgreSQL database "railway"...
   All migrations have been successfully applied.
   ```

2. **В базе данных** должны появиться таблицы:
   - `_prisma_migrations`
   - `User`
   - `Order`
   - `ProductionTask`
   - `Machine`
   - и другие из вашей схемы

## Создание первого администратора

После выполнения миграций вы можете создать первого администратора:

### Вариант 1: Через Railway CLI

```bash
cd backend
railway run npm run create:admin
```

### Вариант 2: Через Railway Console

В консоли Railway выполните:
```bash
npm run create:admin
```

### Вариант 3: Через API после запуска

После того как бэкенд запущен, отправьте POST запрос:

```bash
POST https://ваш-бэкенд-url.railway.app/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "secure_password",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN"
}
```

## Рекомендации

1. **Используйте автоматическое выполнение миграций** - это самый безопасный и удобный способ
2. **Не храните публичные DATABASE_URL в коде** - используйте переменные окружения Railway
3. **Проверяйте логи после деплоя** - убедитесь, что миграции выполнились успешно
4. **Создавайте резервные копии** перед выполнением миграций в production

## Дополнительная информация

- [Railway Documentation](https://docs.railway.app)
- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)

