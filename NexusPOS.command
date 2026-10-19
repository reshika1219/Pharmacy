#!/bin/bash
cd "$(dirname "$0")"
echo "Starting NexusPOS Universal Point of Sale & Inventory System..."
python3 backend/src/app.py || python backend/src/app.py
