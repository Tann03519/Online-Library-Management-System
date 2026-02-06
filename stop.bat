@echo off
REM Library Management System - Stop Script for Windows
REM Dừng tất cả servers

echo.
echo ==========================================
echo 🛑 Dừng Library Management System
echo ==========================================
echo.

REM Kill processes by port
echo [INFO] Đang dừng Backend trên port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Backend đã được dừng
    ) else (
        echo [INFO] Backend không chạy trên port 5000
    )
)

echo [INFO] Đang dừng Frontend trên port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Frontend đã được dừng
    ) else (
        echo [INFO] Frontend không chạy trên port 3000
    )
)

REM Kill Node.js processes
echo [INFO] Dọn dẹp các process Node.js còn lại...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.cmd >nul 2>&1

REM Clean up log files
if exist "logs" (
    echo [INFO] Dọn dẹp log files...
    del /Q logs\*.pid >nul 2>&1
    echo [SUCCESS] Log files đã được dọn dẹp
)

echo.
echo ==========================================
echo [SUCCESS] Tất cả servers đã được dừng!
echo ==========================================
echo.
echo 📝 Để xem logs:
echo    Backend:  type logs\backend.log
echo    Frontend: type logs\frontend.log
echo.
echo 🚀 Để khởi động lại:
echo    start.bat
echo.
pause
