@echo off
cd /d "%~dp0"
echo =================================================================
echo Starting PharmaCare Local Server...
echo Please keep this command prompt window open while using the system.
echo You can close this window or press Ctrl+C here to stop the server.
echo =================================================================
python server.py
pause
