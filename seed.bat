@echo off
REM Library Management System - Seed Data Script for Windows
REM Tạo dữ liệu mẫu cho database

echo.
echo ==========================================
echo 🌱 Library Management System - Seed Data
echo ==========================================
echo.

REM Check MongoDB connection
echo [INFO] Kiểm tra kết nối MongoDB...
mongosh --eval "db.runCommand('ping')" --quiet >nul 2>&1
if %errorlevel% neq 0 (
    mongo --eval "db.runCommand('ping')" --quiet >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Không thể kết nối đến MongoDB
        echo Vui lòng đảm bảo MongoDB đang chạy:
        echo net start MongoDB
        pause
        exit /b 1
    )
)
echo [SUCCESS] MongoDB đang chạy

REM Check if backend directory exists
if not exist "backend" (
    echo [ERROR] Không tìm thấy thư mục backend
    pause
    exit /b 1
)

REM Check if backend has node_modules
if not exist "backend\node_modules" (
    echo [WARNING] Backend dependencies chưa được cài đặt
    echo Đang cài đặt...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Lỗi khi cài đặt backend dependencies
        pause
        exit /b 1
    )
    cd ..
    echo [SUCCESS] Backend dependencies đã được cài đặt
)

REM Check if .env exists
if not exist "backend\.env" (
    echo [WARNING] File .env không tồn tại. Tạo từ env.example...
    cd backend
    copy env.example .env >nul
    cd ..
    echo [SUCCESS] File .env đã được tạo
)

REM Show available seed scripts
echo.
echo 📊 Các script seeding có sẵn:
echo 1. seed.js - Script seeding chính (28 sách, 5 users, 3 loans)
echo 2. seed-optimized.js - Phiên bản tối ưu hóa
echo 3. seedLoanData.js - Tạo dữ liệu phiếu mượn
echo 4. seedNotifications.js - Tạo thông báo mẫu
echo 5. seedReviews.js - Tạo đánh giá sách mẫu
echo 6. testNotifications.js - Test hệ thống thông báo
echo 7. testNewBookNotification.js - Test thông báo sách mới
echo.

REM Interactive seed selection
echo Chọn script để chạy:
echo 1) seed.js (Khuyến nghị)
echo 2) seed-optimized.js
echo 3) seedLoanData.js
echo 4) seedNotifications.js
echo 5) seedReviews.js
echo 6) testNotifications.js
echo 7) testNewBookNotification.js
echo 8) Chạy tất cả (1, 3, 4, 5)
echo 0) Thoát
echo.

set /p choice="Nhập lựa chọn (0-8): "

if "%choice%"=="1" (
    echo [INFO] Chạy script: seed.js
    cd backend
    node scripts\seed.js
    cd ..
    echo [SUCCESS] Script seed.js đã hoàn thành
) else if "%choice%"=="2" (
    echo [INFO] Chạy script: seed-optimized.js
    cd backend
    node scripts\seed-optimized.js
    cd ..
    echo [SUCCESS] Script seed-optimized.js đã hoàn thành
) else if "%choice%"=="3" (
    echo [INFO] Chạy script: seedLoanData.js
    cd backend
    node scripts\seedLoanData.js
    cd ..
    echo [SUCCESS] Script seedLoanData.js đã hoàn thành
) else if "%choice%"=="4" (
    echo [INFO] Chạy script: seedNotifications.js
    cd backend
    node scripts\seedNotifications.js
    cd ..
    echo [SUCCESS] Script seedNotifications.js đã hoàn thành
) else if "%choice%"=="5" (
    echo [INFO] Chạy script: seedReviews.js
    cd backend
    node scripts\seedReviews.js
    cd ..
    echo [SUCCESS] Script seedReviews.js đã hoàn thành
) else if "%choice%"=="6" (
    echo [INFO] Chạy script: testNotifications.js
    cd backend
    node scripts\testNotifications.js
    cd ..
    echo [SUCCESS] Script testNotifications.js đã hoàn thành
) else if "%choice%"=="7" (
    echo [INFO] Chạy script: testNewBookNotification.js
    cd backend
    node scripts\testNewBookNotification.js
    cd ..
    echo [SUCCESS] Script testNewBookNotification.js đã hoàn thành
) else if "%choice%"=="8" (
    echo [INFO] Chạy tất cả scripts...
    cd backend
    node scripts\seed.js
    node scripts\seedLoanData.js
    node scripts\seedNotifications.js
    node scripts\seedReviews.js
    cd ..
    echo [SUCCESS] Tất cả scripts đã hoàn thành
) else if "%choice%"=="0" (
    echo [INFO] Thoát
    exit /b 0
) else (
    echo [ERROR] Lựa chọn không hợp lệ
    pause
    exit /b 1
)

REM Show account information
echo.
echo ==========================================
echo [SUCCESS] Dữ liệu mẫu đã được tạo!
echo ==========================================
echo.
echo 👥 Tài khoản test:
echo    Admin:     admin@library.com / admin123
echo    Thủ thư:   librarian@library.com / librarian123
echo    Sinh viên: student1@university.edu / student123
echo    Sinh viên: student2@university.edu / student123
echo    Sinh viên: student3@university.edu / student123
echo.
echo 📚 Dữ liệu đã tạo:
echo    - 28 cuốn sách với ảnh bìa thật
echo    - 12 danh mục sách
echo    - 12 nhà xuất bản
echo    - 12 khoa và 14 bộ môn
echo    - 3 phiếu mượn mẫu
echo    - Thông báo và đánh giá mẫu
echo.
echo 🌐 Truy cập ứng dụng:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
pause
