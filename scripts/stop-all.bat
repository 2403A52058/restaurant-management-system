@echo off
title Stop Restaurant Management System
echo ===================================================================
echo     Stopping Restaurant Management System Background Services
echo ===================================================================
echo.

echo [1/2] Stopping Node.js processes (Backend ^& Frontend)...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       Node.js processes stopped.
) else (
    echo       No Node.js processes were running.
)

echo.
echo [2/2] Stopping MariaDB / MySQL database server...
taskkill /F /IM mariadbd.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo       MySQL server stopped.
) else (
    echo       No MySQL server process was running.
)

echo.
echo ===================================================================
echo     All Restaurant System services have been stopped.
echo ===================================================================
