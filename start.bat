@echo off
REM Library Management System - Start Script for Windows
REM Khởi động cả backend và frontend

echo.
echo ==========================================
echo 🚀 Library Management System
echo ==========================================
echo.

REM Create logs directory
if not exist "logs" mkdir logs

REM Check MongoDB connection
echo [INFO] Kiểm tra kết nối MongoDB...
mongosh --eval "db.runCommand('ping')" --quiet >nul 2>&1
if %errorlevel% neq 0 (
    mongo --eval "db.runCommand('ping')" --quiet >nul 2>&1
    if %errorlevel% neq 0 (
        echo [WARNING] Không thể kết nối đến MongoDB
        echo Vui lòng đảm bảo MongoDB đang chạy:
        echo net start MongoDB
        echo.
        set /p continue="Bạn có muốn tiếp tục không? (y/n): "
        if /i not "%continue%"=="y" exit /b 1
    )
)
echo [SUCCESS] MongoDB đang chạy

REM Check if backend port is in use
echo [INFO] Kiểm tra port 5000...
netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 5000 đang được sử dụng. Đang dừng process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

REM Start backend
echo [INFO] Khởi động Backend server...
cd backend

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] File .env không tồn tại. Tạo từ env.example...
    copy env.example .env >nul
)

REM Start backend in background
start /b "Backend Server" cmd /c "npm run dev > ..\logs\backend.log 2>&1"
echo %date% %time% > ..\logs\backend.pid

REM Wait a moment for backend to start
timeout /t 3 >nul

REM Check if backend started successfully
netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend đang chạy tại http://localhost:5000
) else (
    echo [ERROR] Backend không khởi động được. Kiểm tra logs\backend.log
    pause
    exit /b 1
)

cd ..

REM Check if frontend port is in use
echo [INFO] Kiểm tra port 3000...
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 đang được sử dụng. Đang dừng process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 >nul
)

REM Start frontend
echo [INFO] Khởi động Frontend server...
cd frontend

REM Start frontend in background
start /b "Frontend Server" cmd /c "npm start > ..\logs\frontend.log 2>&1"
echo %date% %time% > ..\logs\frontend.pid

REM Wait a moment for frontend to start
timeout /t 5 >nul

REM Check if frontend started successfully
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend đang chạy tại http://localhost:3000
) else (
    echo [ERROR] Frontend không khởi động được. Kiểm tra logs\frontend.log
    pause
    exit /b 1
)

cd ..

echo.
echo ==========================================
echo [SUCCESS] Tất cả servers đã khởi động!
echo ==========================================
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    API Health: http://localhost:5000/api/health
echo.
echo 📋 Tài khoản test:
echo    Admin: admin@library.com / admin123
echo    Thủ thư: librarian@library.com / librarian123
echo    Sinh viên: student1@university.edu / student123
echo.
echo 📊 Seed dữ liệu mẫu:
echo    cd backend ^&^& npm run seed
echo.
echo 📝 Logs:
echo    Backend:  logs\backend.log
echo    Frontend: logs\frontend.log
echo.
echo 🛑 Nhấn Ctrl+C để dừng tất cả servers
echo.

REM Keep script running
:loop
timeout /t 1 >nul
goto loop
