#!/bin/bash

# Library Management System - Development Script
# Script tổng hợp cho development

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

# Show help
show_help() {
    echo "=========================================="
    echo "🛠️  Library Management System - Dev Tools"
    echo "=========================================="
    echo ""
    echo "Cách sử dụng: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Cài đặt project từ đầu"
    echo "  start     - Khởi động tất cả servers"
    echo "  stop      - Dừng tất cả servers"
    echo "  restart   - Khởi động lại servers"
    echo "  seed      - Tạo dữ liệu mẫu"
    echo "  test      - Chạy tests"
    echo "  build     - Build production"
    echo "  logs      - Xem logs"
    echo "  clean     - Dọn dẹp project"
    echo "  status    - Kiểm tra trạng thái"
    echo "  help      - Hiển thị help này"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup    # Cài đặt project"
    echo "  ./dev.sh start    # Khởi động servers"
    echo "  ./dev.sh seed     # Tạo dữ liệu mẫu"
    echo "  ./dev.sh test     # Chạy tests"
    echo ""
}

# Setup project
setup_project() {
    print_status "Cài đặt project..."
    chmod +x setup.sh
    ./setup.sh
}

# Start servers
start_servers() {
    print_status "Khởi động servers..."
    chmod +x start.sh
    ./start.sh
}

# Stop servers
stop_servers() {
    print_status "Dừng servers..."
    chmod +x stop.sh
    ./stop.sh
}

# Restart servers
restart_servers() {
    print_status "Khởi động lại servers..."
    stop_servers
    sleep 2
    start_servers
}

# Seed data
seed_data() {
    print_status "Tạo dữ liệu mẫu..."
    chmod +x seed.sh
    ./seed.sh
}

# Run tests
run_tests() {
    print_status "Chạy tests..."
    
    # Backend tests
    print_status "Chạy backend tests..."
    cd backend
    npm test
    cd ..
    
    # Frontend tests
    print_status "Chạy frontend tests..."
    cd frontend
    npm test -- --watchAll=false
    cd ..
    
    print_success "Tất cả tests đã hoàn thành"
}

# Build production
build_production() {
    print_status "Build production..."
    
    # Build frontend
    print_status "Build frontend..."
    cd frontend
    npm run build
    cd ..
    
    print_success "Build production hoàn thành"
    echo "Frontend build: frontend/build/"
}

# Show logs
show_logs() {
    echo "=========================================="
    echo "📝 Logs"
    echo "=========================================="
    echo ""
    
    if [ -f "logs/backend.log" ]; then
        echo "🔧 Backend Logs:"
        echo "----------------------------------------"
        tail -20 logs/backend.log
        echo ""
    else
        print_warning "Không tìm thấy backend logs"
    fi
    
    if [ -f "logs/frontend.log" ]; then
        echo "🌐 Frontend Logs:"
        echo "----------------------------------------"
        tail -20 logs/frontend.log
        echo ""
    else
        print_warning "Không tìm thấy frontend logs"
    fi
    
    echo "Để xem logs real-time:"
    echo "  tail -f logs/backend.log"
    echo "  tail -f logs/frontend.log"
}

# Clean project
clean_project() {
    print_status "Dọn dẹp project..."
    
    # Stop servers first
    stop_servers
    
    # Clean node_modules
    print_status "Xóa node_modules..."
    rm -rf backend/node_modules
    rm -rf frontend/node_modules
    
    # Clean logs
    print_status "Xóa logs..."
    rm -rf logs
    
    # Clean build
    print_status "Xóa build files..."
    rm -rf frontend/build
    
    # Clean uploads
    print_status "Xóa uploads..."
    rm -rf backend/uploads/avatars/*
    rm -rf backend/uploads/books/*
    
    print_success "Project đã được dọn dẹp"
    echo "Chạy './dev.sh setup' để cài đặt lại"
}

# Check status
check_status() {
    echo "=========================================="
    echo "📊 Trạng thái Project"
    echo "=========================================="
    echo ""
    
    # Check if ports are in use
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "Frontend đang chạy trên port 3000"
    else
        print_warning "Frontend không chạy"
    fi
    
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "Backend đang chạy trên port 5000"
    else
        print_warning "Backend không chạy"
    fi
    
    # Check MongoDB
    if command -v mongosh &> /dev/null; then
        if mongosh --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
            print_success "MongoDB đang chạy"
        else
            print_warning "MongoDB không chạy"
        fi
    else
        print_warning "MongoDB không được cài đặt hoặc không có trong PATH"
    fi
    
    # Check dependencies
    if [ -d "backend/node_modules" ]; then
        print_success "Backend dependencies đã cài đặt"
    else
        print_warning "Backend dependencies chưa cài đặt"
    fi
    
    if [ -d "frontend/node_modules" ]; then
        print_success "Frontend dependencies đã cài đặt"
    else
        print_warning "Frontend dependencies chưa cài đặt"
    fi
    
    echo ""
    echo "📁 Cấu trúc project:"
    echo "  Backend:  $(ls -la backend/ | wc -l) items"
    echo "  Frontend: $(ls -la frontend/ | wc -l) items"
    echo "  Logs:     $(ls -la logs/ 2>/dev/null | wc -l || echo 0) items"
}

# Main function
main() {
    case ${1:-help} in
        "setup")
            setup_project
            ;;
        "start")
            start_servers
            ;;
        "stop")
            stop_servers
            ;;
        "restart")
            restart_servers
            ;;
        "seed")
            seed_data
            ;;
        "test")
            run_tests
            ;;
        "build")
            build_production
            ;;
        "logs")
            show_logs
            ;;
        "clean")
            clean_project
            ;;
        "status")
            check_status
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function
main "$@"
