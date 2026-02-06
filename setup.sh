#!/bin/bash

# Library Management System - Setup Script
# Tự động cài đặt và cấu hình project từ đầu

set -e  # Exit on any error

echo "🚀 Bắt đầu setup Library Management System..."

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

# Check if Node.js is installed
check_node() {
    print_status "Kiểm tra Node.js..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js chưa được cài đặt. Vui lòng cài đặt Node.js 16.x trở lên."
        echo "Tải về tại: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js đã được cài đặt: $NODE_VERSION"
}

# Check if MongoDB is installed
check_mongodb() {
    print_status "Kiểm tra MongoDB..."
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB chưa được cài đặt hoặc không có trong PATH."
        echo "Vui lòng cài đặt MongoDB:"
        echo "- Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/"
        echo "- macOS: brew install mongodb-community"
        echo "- Linux: https://docs.mongodb.com/manual/administration/install-on-linux/"
        read -p "Bạn có muốn tiếp tục không? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "MongoDB đã được cài đặt"
    fi
}

# Install backend dependencies
setup_backend() {
    print_status "Cài đặt Backend dependencies..."
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "Không tìm thấy package.json trong thư mục backend"
        exit 1
    fi
    
    npm install
    print_success "Backend dependencies đã được cài đặt"
    
    # Setup environment file
    if [ ! -f ".env" ]; then
        print_status "Tạo file .env từ env.example..."
        cp env.example .env
        print_success "File .env đã được tạo"
        print_warning "Vui lòng kiểm tra và cập nhật các thông tin trong file .env"
    else
        print_success "File .env đã tồn tại"
    fi
    
    cd ..
}

# Install frontend dependencies
setup_frontend() {
    print_status "Cài đặt Frontend dependencies..."
    cd frontend
    
    if [ ! -f "package.json" ]; then
        print_error "Không tìm thấy package.json trong thư mục frontend"
        exit 1
    fi
    
    npm install
    print_success "Frontend dependencies đã được cài đặt"
    
    cd ..
}

# Create uploads directories
create_uploads_dirs() {
    print_status "Tạo thư mục uploads..."
    mkdir -p backend/uploads/avatars
    mkdir -p backend/uploads/books
    print_success "Thư mục uploads đã được tạo"
}

# Main setup function
main() {
    echo "=========================================="
    echo "📚 Library Management System Setup"
    echo "=========================================="
    
    # Check prerequisites
    check_node
    check_mongodb
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Create uploads directories
    create_uploads_dirs
    
    echo ""
    echo "=========================================="
    print_success "Setup hoàn tất!"
    echo "=========================================="
    echo ""
    echo "📋 Các bước tiếp theo:"
    echo "1. Khởi động MongoDB:"
    echo "   - Windows: net start MongoDB"
    echo "   - macOS: brew services start mongodb-community"
    echo "   - Linux: sudo systemctl start mongod"
    echo ""
    echo "2. Chạy project:"
    echo "   ./start.sh"
    echo ""
    echo "3. Hoặc chạy thủ công:"
    echo "   Backend: cd backend && npm run dev"
    echo "   Frontend: cd frontend && npm start"
    echo ""
    echo "4. Seed dữ liệu mẫu (tùy chọn):"
    echo "   cd backend && npm run seed"
    echo ""
    print_success "Chúc bạn coding vui vẻ! 🎉"
}

# Run main function
main
