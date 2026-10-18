@echo off
title CR League Manager - Development
cd /d "%~dp0"

call "%~dp0dev-config.bat"

echo Starting MySQL container...
docker start "%MYSQL_CONTAINER%"

if errorlevel 1 (
    echo Failed to start MySQL.
    pause
    exit /b 1
)

npm run dev
pause