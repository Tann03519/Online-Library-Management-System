#!/bin/bash

# Library Management System - Seed Data Script
# Tạo dữ liệu mẫu cho database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if MongoDB is running
check_mongodb() {
    print_status "Kiểm tra kết nối MongoDB..."
    
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
            print_success "MongoDB đang chạy"
            return 0
        fi
    elif command -v mongo &> /dev/null; then
        if mongo --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
            print_success "MongoDB đang chạy"
            return 0
        fi
    fi
    
    print_error "Không thể kết nối đến MongoDB"
    echo "Vui lòng đảm bảo MongoDB đang chạy:"
    echo "- Windows: net start MongoDB"
    echo "- macOS: brew services start mongodb-community"
    echo "- Linux: sudo systemctl start mongod"
    exit 1
}

# Show available seed scripts
show_scripts() {
    echo ""
    echo "📊 Các script seeding có sẵn:"
    echo "1. seed.js - Script seeding chính (28 sách, 5 users, 3 loans)"
    echo "2. seed-optimized.js - Phiên bản tối ưu hóa"
    echo "3. seedLoanData.js - Tạo dữ liệu phiếu mượn"
    echo "4. seedNotifications.js - Tạo thông báo mẫu"
    echo "5. seedReviews.js - Tạo đánh giá sách mẫu"
    echo "6. testNotifications.js - Test hệ thống thông báo"
    echo "7. testNewBookNotification.js - Test thông báo sách mới"
    echo ""
}

# Run seed script
run_seed() {
    local script_name=$1
    local script_path="backend/scripts/$script_name"
    
    if [ ! -f "$script_path" ]; then
        print_error "Không tìm thấy script: $script_path"
        exit 1
    fi
    
    print_status "Chạy script: $script_name"
    cd backend
    node "scripts/$script_name"
    cd ..
    print_success "Script $script_name đã hoàn thành"
}

# Interactive seed selection
interactive_seed() {
    show_scripts
    
    echo "Chọn script để chạy:"
    echo "1) seed.js (Khuyến nghị)"
    echo "2) seed-optimized.js"
    echo "3) seedLoanData.js"
    echo "4) seedNotifications.js"
    echo "5) seedReviews.js"
    echo "6) testNotifications.js"
    echo "7) testNewBookNotification.js"
    echo "8) Chạy tất cả (1, 3, 4, 5)"
    echo "0) Thoát"
    echo ""
    
    read -p "Nhập lựa chọn (0-8): " choice
    
    case $choice in
        1)
            run_seed "seed.js"
            ;;
        2)
            run_seed "seed-optimized.js"
            ;;
        3)
            run_seed "seedLoanData.js"
            ;;
        4)
            run_seed "seedNotifications.js"
            ;;
        5)
            run_seed "seedReviews.js"
            ;;
        6)
            run_seed "testNotifications.js"
            ;;
        7)
            run_seed "testNewBookNotification.js"
            ;;
        8)
            print_status "Chạy tất cả scripts..."
            run_seed "seed.js"
            run_seed "seedLoanData.js"
            run_seed "seedNotifications.js"
            run_seed "seedReviews.js"
            print_success "Tất cả scripts đã hoàn thành"
            ;;
        0)
            print_status "Thoát"
            exit 0
            ;;
        *)
            print_error "Lựa chọn không hợp lệ"
            exit 1
            ;;
    esac
}

# Show account information
show_accounts() {
    echo ""
    echo "=========================================="
    print_success "Dữ liệu mẫu đã được tạo!"
    echo "=========================================="
    echo ""
    echo "👥 Tài khoản test:"
    echo "   Admin:     admin@library.com / admin123"
    echo "   Thủ thư:   librarian@library.com / librarian123"
    echo "   Sinh viên: student1@university.edu / student123"
    echo "   Sinh viên: student2@university.edu / student123"
    echo "   Sinh viên: student3@university.edu / student123"
    echo ""
    echo "📚 Dữ liệu đã tạo:"
    echo "   - 28 cuốn sách với ảnh bìa thật"
    echo "   - 12 danh mục sách"
    echo "   - 12 nhà xuất bản"
    echo "   - 12 khoa và 14 bộ môn"
    echo "   - 3 phiếu mượn mẫu"
    echo "   - Thông báo và đánh giá mẫu"
    echo ""
    echo "🌐 Truy cập ứng dụng:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
}

# Main function
main() {
    echo "=========================================="
    echo "🌱 Library Management System - Seed Data"
    echo "=========================================="
    
    # Check MongoDB
    check_mongodb
    
    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        print_error "Không tìm thấy thư mục backend"
        exit 1
    fi
    
    # Check if backend has node_modules
    if [ ! -d "backend/node_modules" ]; then
        print_warning "Backend dependencies chưa được cài đặt"
        echo "Đang cài đặt..."
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies đã được cài đặt"
    fi
    
    # Check if .env exists
    if [ ! -f "backend/.env" ]; then
        print_warning "File .env không tồn tại. Tạo từ env.example..."
        cd backend
        cp env.example .env
        cd ..
        print_success "File .env đã được tạo"
    fi
    
    # Run interactive seed
    interactive_seed
    
    # Show account information
    show_accounts
}

# Handle command line arguments
if [ $# -eq 0 ]; then
    # No arguments, run interactive mode
    main
else
    # Arguments provided, run specific script
    case $1 in
        "seed"|"main")
            check_mongodb
            run_seed "seed.js"
            show_accounts
            ;;
        "optimized")
            check_mongodb
            run_seed "seed-optimized.js"
            show_accounts
            ;;
        "loans")
            check_mongodb
            run_seed "seedLoanData.js"
            ;;
        "notifications")
            check_mongodb
            run_seed "seedNotifications.js"
            ;;
        "reviews")
            check_mongodb
            run_seed "seedReviews.js"
            ;;
        "test-notifications")
            check_mongodb
            run_seed "testNotifications.js"
            ;;
        "test-new-book")
            check_mongodb
            run_seed "testNewBookNotification.js"
            ;;
        "all")
            check_mongodb
            run_seed "seed.js"
            run_seed "seedLoanData.js"
            run_seed "seedNotifications.js"
            run_seed "seedReviews.js"
            show_accounts
            ;;
        *)
            echo "Cách sử dụng: $0 [script_name]"
            echo ""
            echo "Scripts có sẵn:"
            echo "  seed, main     - Chạy seed.js (khuyến nghị)"
            echo "  optimized      - Chạy seed-optimized.js"
            echo "  loans          - Chạy seedLoanData.js"
            echo "  notifications  - Chạy seedNotifications.js"
            echo "  reviews        - Chạy seedReviews.js"
            echo "  test-notifications - Chạy testNotifications.js"
            echo "  test-new-book  - Chạy testNewBookNotification.js"
            echo "  all            - Chạy tất cả scripts"
            echo ""
            echo "Hoặc chạy không có tham số để chọn tương tác"
            exit 1
            ;;
    esac
fi
