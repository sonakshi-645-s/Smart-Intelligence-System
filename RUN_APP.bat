@echo off
title UPS Smart Intelligence System Launcher
echo ================================================================
echo           UPS SMART INTELLIGENCE SYSTEM LAUNCHER
echo ================================================================
echo.
echo 1. Starting Django Backend Server (Port 8000)...
start "UPS Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 127.0.0.1:8000"

echo 2. Starting Vite React Frontend Dev Server (Port 5173)...
start "UPS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo System launched successfully!
echo Open your browser at: http://localhost:5173
echo.
echo Press any key to exit launcher window...
pause >nul
