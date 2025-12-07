@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   Инициализация базы данных
echo ========================================
echo.

REM Сохраняем текущую директорию
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Проверяем наличие директории backend
if not exist "backend" (
    echo [ОШИБКА] Директория backend не найдена
    echo Убедитесь, что скрипт запускается из корневой директории проекта
    pause
    exit /b 1
)

cd backend
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в директорию backend
    pause
    exit /b 1
)

echo Генерация Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ОШИБКА] Не удалось сгенерировать Prisma Client
    echo Убедитесь, что зависимости установлены: npm install
    cd /d "%SCRIPT_DIR%"
    pause
    exit /b 1
)

echo.
echo Выполнение миграций...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo [ОШИБКА] Не удалось выполнить миграции
    echo Убедитесь, что:
    echo   1. PostgreSQL запущен
    echo   2. База данных typography_erp создана
    echo   3. Данные в backend/.env корректны
    cd /d "%SCRIPT_DIR%"
    pause
    exit /b 1
)

echo.
echo Инициализация тестовых данных...
call npm run init:db
if errorlevel 1 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Не удалось создать тестовые данные
    echo Вы можете создать пользователя вручную через Prisma Studio
    echo   npx prisma studio
)

cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo   База данных готова!
echo ========================================
echo.
echo Учетные данные:
echo   Администратор: admin@typography.ru / admin123
echo   Менеджер: manager@typography.ru / manager123
echo   Сотрудник: employee@typography.ru / employee123
echo.
pause

