@echo off
REM Library Management System - Setup Script for Windows
REM Tự động cài đặt và cấu hình project từ đầu

echo.
echo ==========================================
echo 🚀 Library Management System Setup
echo ==========================================
echo.

REM Check if Node.js is installed
echo [INFO] Kiểm tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js chưa được cài đặt. Vui lòng cài đặt Node.js 16.x trở lên.
    echo Tải về tại: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js đã được cài đặt: %NODE_VERSION%

REM Check if MongoDB is installed
echo [INFO] Kiểm tra MongoDB...
mongod --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB chưa được cài đặt hoặc không có trong PATH.
    echo Vui lòng cài đặt MongoDB:
    echo - Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
    echo.
    set /p continue="Bạn có muốn tiếp tục không? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
) else (
    echo [SUCCESS] MongoDB đã được cài đặt
)

REM Setup backend
echo [INFO] Cài đặt Backend dependencies...
cd backend
if not exist "package.json" (
    echo [ERROR] Không tìm thấy package.json trong thư mục backend
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Lỗi khi cài đặt backend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Backend dependencies đã được cài đặt

REM Setup environment file
if not exist ".env" (
    echo [INFO] Tạo file .env từ env.example...
    copy env.example .env >nul
    echo [SUCCESS] File .env đã được tạo
    echo [WARNING] Vui lòng kiểm tra và cập nhật các thông tin trong file .env
) else (
    echo [SUCCESS] File .env đã tồn tại
)

cd ..

REM Setup frontend
echo [INFO] Cài đặt Frontend dependencies...
cd frontend
if not exist "package.json" (
    echo [ERROR] Không tìm thấy package.json trong thư mục frontend
    pause
    exit /b 1
)

call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Lỗi khi cài đặt frontend dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Frontend dependencies đã được cài đặt

cd ..

REM Create uploads directories
echo [INFO] Tạo thư mục uploads...
if not exist "backend\uploads\avatars" mkdir backend\uploads\avatars
if not exist "backend\uploads\books" mkdir backend\uploads\books
echo [SUCCESS] Thư mục uploads đã được tạo

echo.
echo ==========================================
echo [SUCCESS] Setup hoàn tất!
echo ==========================================
echo.
echo 📋 Các bước tiếp theo:
echo 1. Khởi động MongoDB:
echo    net start MongoDB
echo.
echo 2. Chạy project:
echo    start.bat
echo.
echo 3. Hoặc chạy thủ công:
echo    Backend: cd backend ^&^& npm run dev
echo    Frontend: cd frontend ^&^& npm start
echo.
echo 4. Seed dữ liệu mẫu (tùy chọn):
echo    cd backend ^&^& npm run seed
echo.
echo [SUCCESS] Chúc bạn coding vui vẻ! 🎉
pause
