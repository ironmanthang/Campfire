@echo off
title Campfire - Dev Server
cd /d "%~dp0"
echo Starting Tauri Dev Server...
npm run tauri dev
pause
