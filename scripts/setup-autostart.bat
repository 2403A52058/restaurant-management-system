@echo off
setlocal
title Enable Auto-Start on Laptop Startup
echo ===================================================================
echo     Enable Restaurant Management System Auto-Start on Boot
echo ===================================================================
echo.
echo This will register the system to start SILENTLY in the background
echo every time your laptop powers on or you log into Windows.
echo.

set "SCRIPT_PATH=%~dp0start-hidden.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_DIR%\TelanganaRuchulu_AutoStart.lnk"

powershell -NoProfile -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$s = $ws.CreateShortcut('%SHORTCUT_PATH%'); " ^
    "$s.TargetPath = 'wscript.exe'; " ^
    "$s.Arguments = '\"%SCRIPT_PATH%\"'; " ^
    "$s.WorkingDirectory = '%~dp0'; " ^
    "$s.Description = 'Telangana Ruchulu Background Runner'; " ^
    "$s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [SUCCESS] Auto-start registered successfully!
    echo Location: %SHORTCUT_PATH%
    echo.
    echo Every time you turn on or log in to your laptop:
    echo - MySQL and Node will start automatically and silently.
    echo - You can open http://localhost:3000 anytime without typing commands!
    echo.
    echo To disable this later, run 'scripts\remove-autostart.bat'.
) else (
    echo.
    echo [ERROR] Failed to create shortcut in Startup folder.
)

echo.
pause
