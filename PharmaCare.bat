@echo off
title NexusPOS
cd /d "%~dp0"
echo Starting NexusPOS...
python backend/src/app.py
if errorlevel 1 (
    echo.
    echo ERROR: Could not start the server.
    echo Make sure Python and Flask are installed: pip install flask
    pause
)
