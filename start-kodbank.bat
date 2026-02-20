@echo off
cd /d "%~dp0"
title Kodbank
echo Starting Kodbank...
start "Kodbank Backend" cmd /k "npm run server"
timeout /t 2 /nobreak >nul
start "Kodbank Frontend" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
start http://localhost:5173
echo.
echo Kodbank is starting. Browser should open shortly.
echo Close the two server windows when done.
pause
