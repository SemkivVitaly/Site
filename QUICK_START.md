# Быстрый старт

## ⚠️ ВАЖНО: Настройте базу данных перед запуском!

1. **Установите и запустите PostgreSQL**
2. **Создайте базу данных:**
   ```sql
   CREATE DATABASE typography_erp;
   ```
3. **Обновите `backend/.env`** с правильными данными подключения

## Запуск проекта

Проект уже запущен в фоновом режиме!

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## Если нужно перезапустить:

### Остановить текущие процессы:
Нажмите `Ctrl+C` в терминалах или закройте их.

### Запустить заново:

**Вариант 1 (из корня):**
```bash
npm run dev
```

**Вариант 2 (отдельно):**
```bash
# Терминал 1 - Backend
cd backend
npm run dev

# Терминал 2 - Frontend  
cd frontend
npm start
```

## Первый запуск (миграции БД):

После настройки PostgreSQL выполните:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Создание первого пользователя:

Используйте Prisma Studio:
```bash
cd backend
npx prisma studio
```

Или через API (после запуска сервера):
```bash
POST http://localhost:5000/api/auth/register
{
  "email": "admin@typography.ru",
  "password": "admin123",
  "firstName": "Администратор",
  "lastName": "Системы",
  "role": "ADMIN"
}
```

## Структура URL:

- Главная: http://localhost:3000
- Вход: http://localhost:3000/login
- Заказы: http://localhost:3000/orders
- Станки: http://localhost:3000/machines
- Производство: http://localhost:3000/production
- Рабочее место: http://localhost:3000/employee

Подробная инструкция в файле `SETUP.md`

