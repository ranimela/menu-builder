@echo off
title Menu Builder Starter
echo Starting Menu Builder...

:: Navigate to script's directory
cd /d "%~dp0"

:: Start the Vite development server in the background
start "" npm.cmd run dev

:: Wait 2 seconds for Vite to initialize
timeout /t 2 /nobreak >nul

:: Open the application in the default web browser
start http://localhost:5173/

echo Menu Builder is running! You can close this window.
exit /b
