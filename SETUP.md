# Инструкция по настройке и запуску проекта

## Предварительные требования

1. **Node.js** (версия 18 или выше)
2. **PostgreSQL** (версия 12 или выше)
3. **npm** или **yarn**

## Шаг 1: Настройка базы данных

1. Установите и запустите PostgreSQL
2. Создайте базу данных:
   ```sql
   CREATE DATABASE typography_erp;
   ```
3. Обновите файл `backend/.env` с правильными данными подключения:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/typography_erp?schema=public"
   ```

## Шаг 2: Установка зависимостей

Зависимости уже установлены. Если нужно переустановить:

```bash
# В корне проекта
npm install --legacy-peer-deps

# В папке backend
cd backend
npm install

# В папке frontend
cd ../frontend
npm install --legacy-peer-deps
```

## Шаг 3: Настройка базы данных (миграции)

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Шаг 4: Запуск проекта

### Вариант 1: Запуск из корня (оба сервера одновременно)

```bash
npm run dev
```

### Вариант 2: Запуск отдельно

**Backend (терминал 1):**
```bash
cd backend
npm run dev
```

**Frontend (терминал 2):**
```bash
cd frontend
npm start
```

## Шаг 5: Доступ к приложению

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Создание первого пользователя

После запуска миграций создайте первого администратора через API:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@typography.ru",
  "password": "admin123",
  "firstName": "Администратор",
  "lastName": "Системы",
  "role": "ADMIN"
}
```

Или используйте Prisma Studio для создания пользователя:

```bash
cd backend
npx prisma studio
```

## Структура проекта

```
typography-erp/
├── backend/          # Express API сервер
├── frontend/          # React приложение
├── shared/            # Общие типы
└── package.json       # Workspace конфигурация
```

## Переменные окружения

### Backend (.env)

- `DATABASE_URL` - строка подключения к PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов
- `PORT` - порт для backend сервера (по умолчанию 5000)
- `FRONTEND_URL` - URL frontend приложения (для CORS)

### Frontend (.env)

- `REACT_APP_API_URL` - URL backend API (по умолчанию http://localhost:5000/api)

## Роли пользователей

- **ADMIN** - Начальник производства (полный доступ)
- **MANAGER** - Менеджер (работа с заказами)
- **EMPLOYEE** - Сотрудник (мобильный интерфейс)

## Решение проблем

### Ошибка подключения к базе данных

Убедитесь, что:
1. PostgreSQL запущен
2. База данных `typography_erp` создана
3. Данные в `backend/.env` корректны

### Ошибки при установке зависимостей

Используйте флаг `--legacy-peer-deps`:
```bash
npm install --legacy-peer-deps
```

### Порт уже занят

Измените порт в `.env` файлах или остановите процесс, использующий порт.

## Дополнительная информация

- Prisma Studio: `cd backend && npx prisma studio`
- Миграции: `cd backend && npx prisma migrate dev`
- Генерация Prisma Client: `cd backend && npx prisma generate`

