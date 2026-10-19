@echo off
title NexusPOS — Universal Point of Sale
cd /d "%~dp0"
echo Starting NexusPOS Universal Point of Sale ^& Inventory System...
python backend/src/app.py
if errorlevel 1 (
    echo.
    echo ERROR: Could not start the server.
    echo Make sure Python and Flask are installed: pip install flask
    pause
)
