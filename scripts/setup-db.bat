@echo off
echo ========================================================
echo   Restaurant Management System - Database Setup
echo ========================================================

cd /d "%~dp0..\backend"
set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;C:\Users\koush\AppData\Local\Programs\mariadb\bin;%PATH%"

echo [1/3] Syncing Prisma schema with MySQL database...
call npx prisma db push

echo [2/3] Generating Prisma Client...
call npx prisma generate

echo [3/3] Seeding realistic sample restaurant data...
call node prisma/seed.js

echo.
echo Database setup completed successfully!
pause
