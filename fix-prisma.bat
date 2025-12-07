@echo off
echo Fixing Prisma Client generation issue...

echo Closing Node processes...
taskkill /F /IM node.exe 2>nul

echo Waiting for processes to close...
timeout /t 2 /nobreak >nul

echo Removing Prisma client cache...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma"
)

if exist "backend\node_modules\.prisma" (
    rmdir /s /q "backend\node_modules\.prisma"
)

echo Removing lock files...
if exist "node_modules\.prisma\client\.locks" (
    rmdir /s /q "node_modules\.prisma\client\.locks"
)

echo Regenerating Prisma Client...
cd backend
call npm run prisma:generate
cd ..

echo Done! Prisma Client should be generated now.
pause

