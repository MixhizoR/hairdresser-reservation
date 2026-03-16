@echo off
echo ========================================================
echo         HairMan Studio - GELISTIRME (DEV) MODU
echo ========================================================
echo.
echo Dev ortaminda rate limitler esnektir ve hatalar gosterilir.
echo.
echo Portlar temizleniyor (5000, 5173)...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :5000') DO taskkill /F /PID %%P /T >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :5173') DO taskkill /F /PID %%P /T >nul 2>&1

echo Server (Backend) baslatiliyor...
start cmd /k "cd server && npm run dev"

echo Client (Frontend) baslatiliyor...
start cmd /k "cd client && npm run dev"

echo.
echo Geliştirme ortamlari ayri pencerelerde baslatildi.
echo Uygulamaya gitmek icin: http://localhost:5173
echo.
pause
