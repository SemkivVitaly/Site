# Решение проблемы с генерацией Prisma Client (Windows)

## Проблема: EPERM - operation not permitted

Эта ошибка возникает когда файл Prisma Client заблокирован другим процессом или антивирусом.

## Решения (попробуйте по порядку):

### Решение 1: Использовать скрипт исправления

Запустите один из файлов:

**Вариант A (Batch файл):**
```bash
fix-prisma.bat
```

**Вариант B (NPM скрипт):**
```bash
npm run fix:prisma
```

### Решение 2: Закрыть все процессы Node.js

1. Откройте Диспетчер задач (Ctrl+Shift+Esc)
2. Найдите все процессы `node.exe`
3. Завершите их
4. Попробуйте снова:
```bash
cd backend
npm run prisma:generate
```

### Решение 3: Запустить от имени администратора

1. Закройте текущий терминал
2. Откройте PowerShell или CMD **от имени администратора** (ПКМ → Запуск от имени администратора)
3. Перейдите в папку проекта
4. Выполните:
```bash
cd backend
npm run prisma:generate
```

### Решение 4: Удалить вручную и переустановить

```bash
# Удалить Prisma Client
rmdir /s /q node_modules\.prisma
rmdir /s /q backend\node_modules\.prisma
rmdir /s /q node_modules\@prisma

# Переустановить зависимости
npm install

# Сгенерировать клиент
cd backend
npm run prisma:generate
```

### Решение 5: Добавить исключение в антивирус

1. Откройте настройки вашего антивируса
2. Добавьте в исключения:
   - Папку проекта: `C:\Users\vital\Типография`
   - Процесс: `node.exe`
3. Попробуйте снова

### Решение 6: Перезагрузка компьютера

Иногда файлы остаются заблокированными даже после закрытия процессов. Перезагрузка поможет.

### Решение 7: Использовать WSL (Windows Subsystem for Linux)

Если проблема не решается, используйте WSL:

```bash
# В WSL терминале
cd /mnt/c/Users/vital/Типография
cd backend
npm run prisma:generate
```

## Предотвращение проблемы в будущем

1. Всегда закрывайте процессы Node.js перед генерацией Prisma
2. Добавьте папку проекта в исключения антивируса
3. Используйте `npm run fix:prisma` вместо прямой команды генерации

## Проверка успешной генерации

После успешной генерации вы должны увидеть:

```
✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

И в папке `node_modules/.prisma/client/` должны появиться файлы:
- `query_engine-windows.dll.node`
- `schema.prisma`
- И другие файлы

## Если ничего не помогает

1. Убедитесь, что у вас установлена последняя версия Node.js (18+)
2. Проверьте, что все зависимости установлены: `npm install`
3. Попробуйте удалить `node_modules` и `package-lock.json`, затем переустановить:
```bash
rmdir /s /q node_modules
rmdir /s /q backend\node_modules
del package-lock.json
del backend\package-lock.json
npm install
cd backend
npm run prisma:generate
```

