#!/bin/bash
cd "$(dirname "$0")"
echo "================================================================="
echo "  PharmaCare — Starting..."
echo "  Keep this window open while using the system."
echo "  Close this window to stop the server."
echo "================================================================="
# Clear any previous stuck instance on port 8088
lsof -ti:8088 | xargs kill -9 2>/dev/null
python3 backend/src/app.py
