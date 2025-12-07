@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   ERP Система для Типографии
echo ========================================
echo.

REM Сохраняем текущую директорию
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Проверяем наличие директорий
if not exist "backend" (
    echo [ОШИБКА] Директория backend не найдена
    echo Убедитесь, что скрипт запускается из корневой директории проекта
    pause
    exit /b 1
)

if not exist "frontend" (
    echo [ОШИБКА] Директория frontend не найдена
    echo Убедитесь, что скрипт запускается из корневой директории проекта
    pause
    exit /b 1
)

echo Проверка базы данных...
cd backend
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в директорию backend
    pause
    exit /b 1
)

npx prisma generate >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Не удалось сгенерировать Prisma Client
    echo Убедитесь, что база данных настроена
    cd ..
    pause
    exit /b 1
)

echo.
echo Запуск Backend сервера...
start "Backend Server" cmd /k "cd /d %SCRIPT_DIR%backend && npm run dev"

timeout /t 3 >nul

echo.
echo Запуск Frontend сервера...
cd /d "%SCRIPT_DIR%frontend"
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в директорию frontend
    cd /d "%SCRIPT_DIR%"
    pause
    exit /b 1
)

start "Frontend Server" cmd /k "cd /d %SCRIPT_DIR%frontend && npm start"

cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo   Серверы запущены!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Нажмите любую клавишу для выхода...
pause >nul

