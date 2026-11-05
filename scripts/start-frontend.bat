@echo off
title 3 - React Vite Frontend (Port 3000)
echo Starting React Vite Frontend on port 3000...
set "PATH=C:\Users\koush\AppData\Local\Programs\nodejs;%PATH%"
cd /d "%~dp0..\frontend"
npm run dev
