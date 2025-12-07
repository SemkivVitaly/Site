# Быстрый старт развертывания на Railway

Это краткая версия инструкции для опытных пользователей. Подробная инструкция находится в файле `RAILWAY_DEPLOYMENT_GUIDE.md`.

## Шаг 1: Подготовка проекта

```bash
# Убедитесь, что проект загружен в GitHub
git add .
git commit -m "Prepare for Railway deployment"
git push
```

## Шаг 2: Создание проекта на Railway

1. Откройте [railway.app](https://railway.app) и зарегистрируйтесь через GitHub
2. Нажмите **"+ New Project"** → **"Deploy from GitHub repo"**
3. Выберите ваш репозиторий

## Шаг 3: Создание базы данных

1. В проекте нажмите **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Скопируйте значение `DATABASE_URL` из вкладки **"Variables"**

## Шаг 4: Настройка бэкенда

1. Если еще не добавлен репозиторий, нажмите **"+ New"** → **"GitHub Repo"**
2. Выберите ваш репозиторий
3. **⚠️ КРИТИЧЕСКИ ВАЖНО:** В настройках сервиса (Settings → Service Settings):
   - **Root Directory**: `backend` (обязательно!)
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`

**Без указания Root Directory сборка не будет работать!**
4. Добавьте переменные окружения в **"Variables"**:

```
DATABASE_URL=<скопированное значение из PostgreSQL>
JWT_SECRET=<сгенерируйте: openssl rand -base64 32>
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=<заполните после получения URL фронтенда>
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
QR_POINT_SECRET=<сгенерируйте: openssl rand -base64 32>
```

5. Получите URL бэкенда из настроек → **"Networking"** → **"Generate Domain"**

## Шаг 5: Выполнение миграций

**⚠️ ВАЖНО:** Миграции автоматически выполняются при деплое благодаря настройке в `backend/nixpacks.toml`.

### Автоматическое выполнение (рекомендуется)

Просто разверните сервис бэкенда - миграции применятся автоматически при первом запуске.

### Ручное выполнение (если необходимо)

Если нужно выполнить миграции вручную перед первым запуском:

**Вариант A: Через Railway CLI**

1. Получите публичный `DATABASE_URL` из Railway (PostgreSQL → Variables → DATABASE_URL)
2. Установите Railway CLI: `npm i -g @railway/cli`
3. Войдите: `railway login`
4. Свяжите проект: `railway link`
5. Установите публичный URL: `railway variables set DATABASE_URL="<публичный-url>"`
6. Выполните: `cd backend && railway run npx prisma migrate deploy`

**Вариант B: Локально с публичным URL**

1. Получите публичный `DATABASE_URL` из Railway
2. Временно добавьте его в `backend/.env`
3. Выполните: `cd backend && npx prisma migrate deploy`
4. Удалите временный `.env` файл

## Шаг 6: Настройка фронтенда

1. Нажмите **"+ New"** → **"GitHub Repo"** (тот же репозиторий)
2. **⚠️ КРИТИЧЕСКИ ВАЖНО:** В настройках сервиса (Settings → Service Settings):
   - **Root Directory**: `frontend` (обязательно!)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

**Без указания Root Directory сборка не будет работать!**
3. Добавьте переменную окружения:
   - `REACT_APP_API_URL=https://ваш-бэкенд-url.railway.app/api`
4. Получите URL фронтенда

## Шаг 7: Финальная настройка

1. Вернитесь к сервису бэкенда
2. Обновите `FRONTEND_URL` на URL вашего фронтенда

## Шаг 8: Проверка

1. Откройте `https://ваш-бэкенд-url.railway.app/api/health` - должен вернуть `{"status":"ok"}`
2. Откройте URL фронтенда и попробуйте залогиниться

## Генерация секретов

```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Linux/Mac
openssl rand -base64 32

# Или используйте онлайн генератор
https://randomkeygen.com/
```

## Структура проекта на Railway

```
Railway Project
├── PostgreSQL Database
│   └── Variables: DATABASE_URL
├── Backend Service (root: backend/)
│   ├── Variables: DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.
│   └── URL: backend-production.up.railway.app
└── Frontend Service (root: frontend/)
    ├── Variables: REACT_APP_API_URL
    └── URL: frontend-production.up.railway.app
```

## Важные моменты

- ⚠️ Всегда проверяйте, что `FRONTEND_URL` и `REACT_APP_API_URL` используют `https://`
- ⚠️ Убедитесь, что миграции выполнены перед первым запуском
- ⚠️ Проверьте логи в Railway при возникновении проблем
- ⚠️ Используйте сильные секреты для `JWT_SECRET` и `QR_POINT_SECRET`

## Полезные команды Railway CLI

```bash
railway logs              # Просмотр логов
railway variables         # Просмотр переменных
railway open              # Открыть проект в браузере
railway run <команда>     # Запустить команду в окружении Railway
```

---

**Подробная инструкция с описанием каждого шага:** `RAILWAY_DEPLOYMENT_GUIDE.md`  
**Чеклист для проверки:** `DEPLOYMENT_CHECKLIST.md`

