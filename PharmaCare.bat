@echo off
title PharmaCare Local Server
cd /d "%~dp0"
cls
echo ==================================================================
echo   PharmaCare — Starting Server...
echo ==================================================================
echo.
python backend\src\app.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ The server encountered an error and stopped.
    echo Please make sure Python is installed and check the logs above.
    echo.
    pause
)
