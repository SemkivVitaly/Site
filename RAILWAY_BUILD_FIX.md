# Исправление ошибки сборки на Railway

## Проблема

При деплое на Railway возникает ошибка:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Причина

Railway пытается выполнить `npm ci` в корне проекта, но `package-lock.json` находится только в подпапках `backend/` и `frontend/`.

## Решение

### ✅ Исправлено в конфигурации

Файлы `nixpacks.toml` обновлены для использования `npm install` вместо `npm ci`:
- `backend/nixpacks.toml` - использует `npm install`
- `frontend/nixpacks.toml` - использует `npm install`

### ⚠️ ВАЖНО: Настройка Root Directory в Railway

Для каждого сервиса в Railway **обязательно** укажите правильный Root Directory:

#### Для бэкенда:
1. Откройте сервис бэкенда в Railway
2. Перейдите в **Settings** → **Service Settings**
3. Найдите **"Root Directory"**
4. Установите значение: `backend`
5. Сохраните изменения

#### Для фронтенда:
1. Откройте сервис фронтенда в Railway
2. Перейдите в **Settings** → **Service Settings**
3. Найдите **"Root Directory"**
4. Установите значение: `frontend`
5. Сохраните изменения

### Альтернативное решение (если проблемы продолжаются)

Если ошибка все еще возникает, можно:

1. **Использовать Dockerfile** вместо nixpacks:
   - Создайте `Dockerfile` в `backend/` и `frontend/`
   - Railway будет использовать Dockerfile вместо nixpacks

2. **Создать корневой package-lock.json**:
   ```bash
   npm install
   git add package-lock.json
   git commit -m "Add root package-lock.json"
   git push
   ```

## Проверка после исправления

После настройки Root Directory и обновления конфигурации:

1. **Пересоберите сервисы** на Railway:
   - Откройте сервис
   - Нажмите **"Deploy"** или **"Redeploy"**

2. **Проверьте логи** сборки:
   - Должны увидеть успешное выполнение `npm install`
   - Должны увидеть выполнение `npm run build`
   - Должны увидеть успешный запуск сервиса

3. **Проверьте работу**:
   - Бэкенд должен отвечать на `/api/health`
   - Фронтенд должен загружаться в браузере

## Структура на Railway

После настройки у вас должно быть:

```
Railway Project
├── PostgreSQL Database
├── Backend Service
│   └── Root Directory: backend/
└── Frontend Service
    └── Root Directory: frontend/
```

---

**Главное:** Не забудьте указать Root Directory для каждого сервиса в настройках Railway!

