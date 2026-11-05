@echo off
setlocal
cd /d "%~dp0"

echo ===================================================================
echo     Telangana Ruchulu - Restaurant Management System Launcher
echo ===================================================================
echo.

set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;C:\Users\koush\AppData\Local\Programs\mariadb\bin;%PATH%"

:: 1. Start MySQL Server
echo [1/3] Starting MySQL Database Server (Port 3306)...
start "1 - MySQL Database Server (Port 3306)" cmd /k "echo Starting MySQL on port 3306... && "C:\Users\koush\AppData\Local\Programs\mariadb\bin\mariadbd.exe" --datadir="%~dp0data\mysql" --port=3306 --console"

timeout /t 3 /nobreak >nul

:: 2. Start Express Backend
echo [2/3] Starting Express Backend API (Port 5000)...
start "2 - Express Backend API (Port 5000)" cmd /k "cd /d "%~dp0backend" && set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;%PATH%" && node src/server.js"

timeout /t 2 /nobreak >nul

:: 3. Start React Frontend
echo [3/3] Starting React Vite Frontend (Port 3000)...
start "3 - React Frontend UI (Port 3000)" cmd /k "cd /d "%~dp0frontend" && set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;%PATH%" && npm run dev"

timeout /t 3 /nobreak >nul

:: Open Browser
echo.
echo Launching http://localhost:3000 in your web browser...
start http://localhost:3000

echo.
echo ===================================================================
echo   All 3 services have started!
echo.
echo   - Web Application: http://localhost:3000
echo   - Backend REST API: http://localhost:5000
echo   - MySQL Database:   Port 3306
echo.
echo   Demo Login:
echo     Username: admin
echo     Password: admin123
echo ===================================================================
echo (Leave the 3 opened terminal windows open in the background)
pause
