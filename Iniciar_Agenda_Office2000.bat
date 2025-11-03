@echo off
:: ======================================================
:: 🗓️  Agenda Office2000 - Inicio automático con IP local
:: ======================================================

:: Ir a la carpeta donde está este archivo
cd /d "%~dp0"

:: Obtener la IP local automáticamente
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr "IPv4"') do set ip=%%A
set ip=%ip: =%

:: Iniciar el servidor en segundo plano (minimizado)
start "" /min cmd /c "npm start"

:: Esperar unos segundos a que arranque el servidor
timeout /t 4 /nobreak >nul

:: Abrir automáticamente en el navegador con la IP detectada
start http://%ip%:3000

exit
