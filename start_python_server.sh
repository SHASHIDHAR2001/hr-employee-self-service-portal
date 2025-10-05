#!/bin/bash

# HR Portal - Python Backend Startup Script
# This script starts the Python FastAPI backend

set -e  # Exit on error

echo "=========================================="
echo "HR Portal - Starting Python Backend"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "python_server" ]; then
    echo "Error: python_server directory not found!"
    echo "Please run this script from the project root"
    exit 1
fi

# Navigate to python_server
cd python_server

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Check if database needs initialization
echo ""
echo "Checking database..."
python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('✓ Database tables ready')"

# Initialize database with sample data if needed
echo "Initializing database with sample data..."
python init_db.py

echo ""
echo "=========================================="
echo "Starting FastAPI server on port 5000..."
echo "=========================================="
echo ""
echo "API Docs: http://localhost:5000/docs"
echo "Server: http://localhost:5000"
echo ""

# Start the server
python main.py
