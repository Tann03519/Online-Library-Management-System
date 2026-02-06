# Database Seeding Scripts

## Tổng quan

Thư mục này chứa các script để seed dữ liệu mẫu vào database của hệ thống quản lý thư viện.

## File chính

### `seed.js`
File seed tối ưu duy nhất chứa tất cả dữ liệu mẫu với:
- **28 cuốn sách** với thông tin thật và ảnh bìa từ Amazon
- **12 danh mục** sách đa dạng
- **12 nhà xuất bản** trong và ngoài nước
- **12 khoa** và **14 bộ môn**
- **5 người dùng** mẫu (1 admin, 1 thủ thư, 3 sinh viên)
- **3 phiếu mượn** mẫu với các trạng thái khác nhau
- **Chính sách phạt** mặc định

## Cách sử dụng

### 1. Chạy seed script
```bash
npm run seed
```

### 2. Xóa dữ liệu cũ (nếu cần)
Script sẽ tự động xóa tất cả dữ liệu cũ trước khi tạo dữ liệu mới.

### 3. Kiểm tra kết quả
Script sẽ hiển thị thống kê chi tiết về dữ liệu đã tạo.

## Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | admin@library.com | admin123 |
| Thủ thư | librarian@library.com | librarian123 |
| Sinh viên 1 | student1@university.edu | student123 |
| Sinh viên 2 | student2@university.edu | student123 |
| Sinh viên 3 | student3@university.edu | student123 |

## Đặc điểm nổi bật

### 📚 Sách với ảnh bìa thật
- Tất cả sách đều có ảnh bìa từ Amazon
- Thông tin sách chính xác và đầy đủ
- Đa dạng về thể loại và tác giả

### 🏛️ Cấu trúc tổ chức hoàn chỉnh
- Khoa và bộ môn được liên kết chính xác
- Danh mục sách phong phú
- Nhà xuất bản đa dạng

### 📋 Phiếu mượn mẫu
- Phiếu đang mượn (còn hạn)
- Phiếu quá hạn
- Phiếu đã trả

### 🔧 Tối ưu hóa
- Một file duy nhất thay thế 3 file cũ
- Code sạch và dễ bảo trì
- Xử lý lỗi tốt
- Thông báo chi tiết

## Lưu ý

- Script sẽ xóa toàn bộ dữ liệu cũ
- Đảm bảo MongoDB đang chạy
- Kiểm tra file `.env` có cấu hình database đúng
- Các cảnh báo về duplicate index là bình thường và không ảnh hưởng chức năng
