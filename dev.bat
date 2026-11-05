@echo off
setlocal
title Telangana Ruchulu RMS - Single Terminal Runner
set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;C:\Users\koush\AppData\Local\Programs\mariadb\bin;%PATH%"
cd /d "%~dp0"
node scripts/dev.js
