@echo off
title MySQL Database Server (Port 3306)
echo Starting MySQL / MariaDB Server on port 3306...
set PATH=C:\Users\koush\AppData\Local\Programs\mariadb\bin;%PATH%
"C:\Users\koush\AppData\Local\Programs\mariadb\bin\mariadbd.exe" --datadir="%~dp0..\data\mysql" --port=3306 --console
