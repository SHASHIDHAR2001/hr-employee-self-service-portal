#!/bin/bash

# Start Vite dev server in background
echo "Starting Vite dev server..."
npx vite --port 5173 --host 0.0.0.0 &
VITE_PID=$!

# Wait for Vite to be ready
sleep 3

# Start Python server
echo "Starting Python server..."
cd python_server && python main.py

# Cleanup on exit
trap "kill $VITE_PID" EXIT
