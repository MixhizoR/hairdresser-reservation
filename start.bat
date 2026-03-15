@echo off
echo Cleaning up existing processes on ports 5000 and 5173...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :5000') DO taskkill /F /PID %%P /T >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :5173') DO taskkill /F /PID %%P /T >nul 2>&1

echo Starting Noir Barber System...
start cmd /k "cd server && npx nodemon index.js"
start cmd /k "cd client && npm run dev"
echo Backend and Frontend are starting in separate windows.
