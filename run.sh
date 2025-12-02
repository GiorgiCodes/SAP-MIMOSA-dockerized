#!/bin/bash

# Start Python Backend in the background
echo "Starting Python Backend..."
cd /app/python_backend
pip install -r requirements.txt
python3 app.py & 

# Start .NET Backend in the foreground
echo "Starting .NET Backend..."
cd /app
dotnet SAP-MIMOSAapp.dll