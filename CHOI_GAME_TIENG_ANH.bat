@echo off
title LEXICON ARCADE - Game Hoc Tieng Anh IELTS 8.0
chcp 65001 >nul
color 0A

echo ===================================================================
echo     🎮 LEXICON ARCADE & LEARNING ECOSYSTEM (IELTS 8.0)
echo ===================================================================
echo.

cd /d "d:\English"

:: Kiểm tra xem port 5173 đã đang chạy hay chưa
netstat -ano | findstr 127.0.0.1:5173 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo [✓] Máy chủ game đang bật sẵn! Đang mở trình duyệt...
    start http://localhost:5173
    timeout /t 2 >nul
    exit
)

echo [*] Đang khởi động máy chủ và mở game trên trình duyệt...
start http://localhost:5173
call npm run dev -- --host 127.0.0.1
