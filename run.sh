#!/bin/bash

# 1. Start Python Backend in the background
# Adjust 'python_backend_folder' to your actual python folder name
# Adjust 'app.py' to your actual python entry file (e.g., main.py, uvicorn start)
echo "Starting Python Backend..."
cd /app/python_backend
pip install -r requirements.txt
python3 app.py & 

# 2. Start .NET Backend in the foreground
echo "Starting .NET Backend..."
cd /app
dotnet SAP-MIMOSAapp.dll