# Пошаговая инструкция по настройке проекта на Railway

## Текущая ситуация:
- Проект: Tipograf
- База данных: PostgreSQL (работает)
- Backend сервис: "handsome-serenity" (Build failed)
- Frontend сервис: "Site" (Build failed)

## Что нужно сделать:

### Шаг 1: Настройка Backend сервиса ("handsome-serenity")

1. **Откройте сервис "handsome-serenity" на Railway**
   - Перейдите по ссылке: https://railway.com/project/20639198-334b-4d20-b9b1-9a3dc6aae135/service/f3a60971-64bb-44f9-aedb-b0206e81e4b2
   - Или кликните на карточку сервиса на главной странице проекта

2. **Перейдите в Settings → Service Settings**
   - Нажмите на вкладку "Settings" в меню
   - Найдите раздел "Service Settings"

3. **Настройте Root Directory:**
   - Найдите поле "Root Directory"
   - Установите значение: `backend`
   - Это критически важно! Без этого сборка не будет работать

4. **Настройте Build Command (если нужно):**
   - Build Command: `npm install && npx prisma generate && npm run build`
   - (Обычно это определяется автоматически из nixpacks.toml)

5. **Настройте Start Command (если нужно):**
   - Start Command: `npx prisma migrate deploy && node dist/index.js`
   - (Это также должно быть в nixpacks.toml)

6. **Настройте переменные окружения (Variables):**
   Перейдите в раздел "Variables" и добавьте следующие переменные:

   ```
   DATABASE_URL=<получить из PostgreSQL сервиса>
   JWT_SECRET=<сгенерируйте случайную строку минимум 32 символа>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=<будет настроен после получения URL фронтенда>
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   QR_POINT_SECRET=<сгенерируйте случайную строку минимум 32 символа>
   ```

   **Как получить DATABASE_URL:**
   - Перейдите к PostgreSQL сервису
   - Откройте вкладку "Variables"
   - Скопируйте значение переменной `DATABASE_URL` или `POSTGRES_URL`

7. **Настройте публичный домен:**
   - В Settings → Networking
   - Включите "Generate Domain" или нажмите "Generate Domain"
   - Скопируйте полученный URL (например, `handsome-serenity-production.up.railway.app`)

### Шаг 2: Настройка Frontend сервиса ("Site")

1. **Откройте сервис "Site" на Railway**
   - Найдите карточку "Site" на главной странице проекта
   - Кликните на неё

2. **Перейдите в Settings → Service Settings**

3. **Настройте Root Directory:**
   - Установите значение: `frontend`
   - Это критически важно!

4. **Настройте Build Command:**
   - Build Command: `npm install --legacy-peer-deps && npm run build`

5. **Настройте Start Command:**
   - Start Command: `npm start` (или настройте для статического хостинга)

6. **Настройте переменные окружения:**
   Добавьте переменную:
   ```
   REACT_APP_API_URL=https://<URL-вашего-бэкенда>/api
   ```
   Например: `REACT_APP_API_URL=https://handsome-serenity-production.up.railway.app/api`

7. **Настройте публичный домен:**
   - В Settings → Networking
   - Включите "Generate Domain"
   - Скопируйте полученный URL

### Шаг 3: Обновление переменных окружения

После получения URL фронтенда:

1. Вернитесь к Backend сервису
2. Обновите переменную `FRONTEND_URL` на URL вашего фронтенда
   - Например: `FRONTEND_URL=https://site-production.up.railway.app`

### Шаг 4: Проверка и пересборка

1. **Пересоберите Backend:**
   - В сервисе "handsome-serenity"
   - Нажмите "Deploy" или "Redeploy"
   - Дождитесь успешной сборки

2. **Пересоберите Frontend:**
   - В сервисе "Site"
   - Нажмите "Deploy" или "Redeploy"
   - Дождитесь успешной сборки

### Шаг 5: Проверка работоспособности

1. **Проверьте Backend:**
   - Откройте URL бэкенда в браузере
   - Добавьте `/api/health` в конце
   - Должен вернуться JSON: `{"status":"ok"}`

2. **Проверьте Frontend:**
   - Откройте URL фронтенда в браузере
   - Попробуйте залогиниться
   - Проверьте основные функции

## Быстрая ссылка на сервисы:

- **Backend**: https://railway.com/project/20639198-334b-4d20-b9b1-9a3dc6aae135/service/f3a60971-64bb-44f9-aedb-b0206e81e4b2
- **Frontend**: https://railway.com/project/20639198-334b-4d20-b9b1-9a3dc6aae135/service/2e7a5ed0-8e40-41eb-b2b0-6039adbd0060
- **PostgreSQL**: Найдите в списке сервисов

## Генерация секретов:

Для `JWT_SECRET` и `QR_POINT_SECRET` используйте:
- Онлайн генератор: https://randomkeygen.com/
- Или PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`

## Важные моменты:

1. ⚠️ **Root Directory обязателен для обоих сервисов!**
2. ⚠️ **Все URL должны начинаться с `https://`**
3. ⚠️ **DATABASE_URL должен быть публичным (не внутренним)**
4. ⚠️ **Миграции выполняются автоматически при первом запуске благодаря nixpacks.toml**

---

**После выполнения всех шагов ваш сайт будет доступен всем пользователям!**

