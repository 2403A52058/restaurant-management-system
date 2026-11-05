@echo off
setlocal
title Remove Auto-Start on Laptop Startup
echo ===================================================================
echo     Remove Restaurant Management System from Windows Startup
echo ===================================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_DIR%\TelanganaRuchulu_AutoStart.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUCCESS] Auto-start removed! The system will no longer start on boot.
) else (
    echo [INFO] Auto-start was not registered. Nothing to remove.
)

echo.
pause
