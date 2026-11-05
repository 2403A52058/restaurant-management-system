@echo off
title 2 - Express Backend API (Port 5000)
echo Starting Express Backend API on port 5000...
set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;C:\Users\koush\AppData\Local\Programs\mariadb\bin;%PATH%"
cd /d "%~dp0..\backend"
node src/server.js
