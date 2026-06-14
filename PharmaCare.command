#!/bin/bash
cd "$(dirname "$0")"
echo "================================================================="
echo "Starting PharmaCare Local Server..."
echo "Please keep this Terminal window open while using the system."
echo "You can close this window or press Ctrl+C here to stop the server."
echo "================================================================="
python3 server.py
