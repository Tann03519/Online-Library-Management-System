@echo off
REM Library Management System - Development Script for Windows
REM Script tổng hợp cho development

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="setup" goto setup
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="seed" goto seed
if "%1"=="test" goto test
if "%1"=="build" goto build
if "%1"=="logs" goto logs
if "%1"=="clean" goto clean
if "%1"=="status" goto status
goto help

:help
echo.
echo ==========================================
echo 🛠️  Library Management System - Dev Tools
echo ==========================================
echo.
echo Cách sử dụng: dev.bat [command]
echo.
echo Commands:
echo   setup     - Cài đặt project từ đầu
echo   start     - Khởi động tất cả servers
echo   stop      - Dừng tất cả servers
echo   restart   - Khởi động lại servers
echo   seed      - Tạo dữ liệu mẫu
echo   test      - Chạy tests
echo   build     - Build production
echo   logs      - Xem logs
echo   clean     - Dọn dẹp project
echo   status    - Kiểm tra trạng thái
echo   help      - Hiển thị help này
echo.
echo Examples:
echo   dev.bat setup    # Cài đặt project
echo   dev.bat start    # Khởi động servers
echo   dev.bat seed     # Tạo dữ liệu mẫu
echo   dev.bat test     # Chạy tests
echo.
goto end

:setup
echo [INFO] Cài đặt project...
call setup.bat
goto end

:start
echo [INFO] Khởi động servers...
call start.bat
goto end

:stop
echo [INFO] Dừng servers...
call stop.bat
goto end

:restart
echo [INFO] Khởi động lại servers...
call stop.bat
timeout /t 2 >nul
call start.bat
goto end

:seed
echo [INFO] Tạo dữ liệu mẫu...
call seed.bat
goto end

:test
echo [INFO] Chạy tests...
echo [INFO] Chạy backend tests...
cd backend
call npm test
cd ..
echo [INFO] Chạy frontend tests...
cd frontend
call npm test -- --watchAll=false
cd ..
echo [SUCCESS] Tất cả tests đã hoàn thành
goto end

:build
echo [INFO] Build production...
echo [INFO] Build frontend...
cd frontend
call npm run build
cd ..
echo [SUCCESS] Build production hoàn thành
echo Frontend build: frontend\build\
goto end

:logs
echo.
echo ==========================================
echo 📝 Logs
echo ==========================================
echo.
if exist "logs\backend.log" (
    echo 🔧 Backend Logs:
    echo ----------------------------------------
    type logs\backend.log
    echo.
) else (
    echo [WARNING] Không tìm thấy backend logs
)

if exist "logs\frontend.log" (
    echo 🌐 Frontend Logs:
    echo ----------------------------------------
    type logs\frontend.log
    echo.
) else (
    echo [WARNING] Không tìm thấy frontend logs
)

echo Để xem logs real-time:
echo   Get-Content logs\backend.log -Wait
echo   Get-Content logs\frontend.log -Wait
goto end

:clean
echo [INFO] Dọn dẹp project...
call stop.bat
echo [INFO] Xóa node_modules...
if exist "backend\node_modules" rmdir /s /q backend\node_modules
if exist "frontend\node_modules" rmdir /s /q frontend\node_modules
echo [INFO] Xóa logs...
if exist "logs" rmdir /s /q logs
echo [INFO] Xóa build files...
if exist "frontend\build" rmdir /s /q frontend\build
echo [INFO] Xóa uploads...
if exist "backend\uploads\avatars" del /q backend\uploads\avatars\*
if exist "backend\uploads\books" del /q backend\uploads\books\*
echo [SUCCESS] Project đã được dọn dẹp
echo Chạy 'dev.bat setup' để cài đặt lại
goto end

:status
echo.
echo ==========================================
echo 📊 Trạng thái Project
echo ==========================================
echo.

REM Check if ports are in use
netstat -an | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend đang chạy trên port 3000
) else (
    echo [WARNING] Frontend không chạy
)

netstat -an | findstr ":5000" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend đang chạy trên port 5000
) else (
    echo [WARNING] Backend không chạy
)

REM Check MongoDB
mongosh --eval "db.runCommand('ping')" --quiet >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MongoDB đang chạy
) else (
    mongo --eval "db.runCommand('ping')" --quiet >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] MongoDB đang chạy
    ) else (
        echo [WARNING] MongoDB không chạy
    )
)

REM Check dependencies
if exist "backend\node_modules" (
    echo [SUCCESS] Backend dependencies đã cài đặt
) else (
    echo [WARNING] Backend dependencies chưa cài đặt
)

if exist "frontend\node_modules" (
    echo [SUCCESS] Frontend dependencies đã cài đặt
) else (
    echo [WARNING] Frontend dependencies chưa cài đặt
)

echo.
echo 📁 Cấu trúc project:
dir backend /b | find /c /v "" >nul 2>&1
echo   Backend: %errorlevel% items
dir frontend /b | find /c /v "" >nul 2>&1
echo   Frontend: %errorlevel% items
if exist "logs" (
    dir logs /b | find /c /v "" >nul 2>&1
    echo   Logs: %errorlevel% items
) else (
    echo   Logs: 0 items
)
goto end

:end
