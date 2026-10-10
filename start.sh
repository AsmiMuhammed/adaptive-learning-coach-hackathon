#!/usr/bin/env bash
# start.sh - Launch both AdaptIQ Flask backend and Vite frontend

set -e

echo "=========================================================="
echo " Starting AdaptIQ — AI-Powered Adaptive Learning Coach"
echo " Hackathon Problem #8"
echo "=========================================================="

# Check and activate virtualenv
if [ -d "backend/venv" ]; then
    PYTHON_EXEC="backend/venv/bin/python"
else
    PYTHON_EXEC="python3"
fi

# Ensure database is initialized & seeded
echo "[1/3] Initializing and seeding SQLite database..."
PYTHONPATH=. $PYTHON_EXEC backend/app.py seed

# Start Flask backend in background
echo "[2/3] Starting Flask Backend API on http://127.0.0.1:5001..."
PYTHONPATH=. $PYTHON_EXEC backend/app.py &
BACKEND_PID=$!

# Trap signals to cleanly terminate backend when script exits
cleanup() {
    echo ""
    echo "Stopping AdaptIQ services..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start Vite frontend
echo "[3/3] Starting Vite React Frontend on http://localhost:5173..."
cd frontend
npm run dev -- --host
