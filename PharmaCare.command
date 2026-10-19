#!/bin/bash
cd "$(dirname "$0")"
echo "Starting NexusPOS..."
python3 backend/src/app.py || python backend/src/app.py
