@echo off
echo ========================================================
echo         NOIR BARBER - CANLI (PROD) MODU
echo ========================================================
echo.
echo Prod ortaminda security (rate limit, CORS) sıkıdır.
echo.
echo Portlar temizleniyor (5000, 4173)...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :5000') DO taskkill /F /PID %%P /T >nul 2>&1
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr :4173') DO taskkill /F /PID %%P /T >nul 2>&1

echo Frontend (Client) proje derleniyor... (Build)
cd client
call npm run build
cd ..

echo Server (Backend) baslatiliyor...
start cmd /k "cd server && npm run start"

echo Client (Frontend) Prod ortaminda baslatiliyor...
start cmd /k "cd client && npm run preview"

echo.
echo Canli (Prod) sistemler ayri pencerelerde baslatildi.
echo Uygulamaya gitmek icin: http://localhost:4173
echo.
pause
