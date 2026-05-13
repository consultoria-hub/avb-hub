@echo off
title AVB HUB - Servidor
cd /d "%~dp0"
echo ============================================
echo   AVB HUB - Iniciando servidor web...
echo ============================================
echo.
echo Aguarde a mensagem "Ready" abaixo, depois abra:
echo   http://localhost:3000
echo.
echo Para parar o servidor: feche esta janela.
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000"
npm run dev
pause
