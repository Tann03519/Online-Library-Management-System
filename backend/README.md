# Library Management System API

Hệ thống quản lý thư viện được xây dựng bằng Node.js + Express + MongoDB với JWT authentication và RBAC (Role-Based Access Control).

## 🚀 Tính năng chính

### Vai trò người dùng
- **GUEST**: Chỉ xem sách, chi tiết sách và filters
- **USER (Sinh viên)**: Đăng ký/đăng nhập, chỉnh sửa profile, mượn sách cho chính mình, xem lịch sử mượn/trả
- **LIBRARIAN (Thủ thư)**: Lập phiếu mượn/trả cho bất kỳ độc giả, in phiếu PDF, quản lý danh mục
- **ADMIN**: Toàn quyền + quản trị người dùng/role + cấu hình phạt

### Chức năng chính
- ✅ Authentication & Authorization với JWT
- ✅ Quản lý người dùng với RBAC
- ✅ Quản lý sách, danh mục, nhà xuất bản, khoa, bộ môn
- ✅ Hệ thống mượn/trả sách với transaction
- ✅ Tính phí trễ hạn và hư hỏng
- ✅ Thống kê và báo cáo
- ✅ Upload ảnh bìa sách và avatar
- ✅ Cron job cập nhật trạng thái quá hạn

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express.js
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest, Supertest
- **Scheduling**: Node-cron

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.0.0
- MongoDB >= 4.0.0
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd QuanLyThuVien/backend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình environment
```bash
cp env.example .env
```

Chỉnh sửa file `.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/library_management
DB_NAME=library_management

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_REFRESH_EXPIRE=30d

# Server
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting (disabled for development)
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Bước 4: Khởi động MongoDB
```bash
# Với MongoDB local
mongod

# Hoặc sử dụng MongoDB Atlas (cloud)
```

### Bước 5: Seed data
```bash
npm run seed
```

### Bước 6: Khởi động server
```bash
# Development
npm run dev

# Production
npm start
```

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy test với coverage
npm run test:coverage

# Chạy test watch mode
npm run test:watch
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Tất cả các endpoint (trừ public) yêu cầu header:
```
Authorization: Bearer <access_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... } // Chỉ có với pagination
}
```

Error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": [ ... ] // Chỉ có với validation errors
  }
}
```

### Endpoints chính

#### Authentication
- `POST /auth/register` - Đăng ký (public)
- `POST /auth/login` - Đăng nhập (public)
- `POST /auth/refresh` - Refresh token (public)
- `GET /auth/me` - Thông tin user hiện tại

#### Users
- `GET /users/me` - Profile user
- `PUT /users/me` - Cập nhật profile
- `PUT /users/me/password` - Đổi mật khẩu
- `POST /users/me/avatar` - Upload avatar
- `GET /users` - Danh sách users (ADMIN)
- `POST /users` - Tạo user (ADMIN)
- `PUT /users/:id` - Cập nhật user (ADMIN)
- `DELETE /users/:id` - Xóa user (ADMIN)
- `PATCH /users/:id/role` - Đổi role (ADMIN)

#### Books (Public)
- `GET /books` - Danh sách sách với filters
- `GET /books/:id` - Chi tiết sách

#### Books (LIBRARIAN/ADMIN)
- `POST /books` - Tạo sách
- `PUT /books/:id` - Cập nhật sách
- `DELETE /books/:id` - Xóa sách
- `PATCH /books/:id/adjust-stock` - Điều chỉnh kho (ADMIN)

#### Loans
- `GET /loans` - Danh sách phiếu mượn (LIBRARIAN/ADMIN)
- `GET /loans/:id` - Chi tiết phiếu mượn (LIBRARIAN/ADMIN)
- `POST /loans/self` - Mượn sách cho chính mình (USER)
- `POST /loans` - Tạo phiếu mượn cho độc giả (LIBRARIAN/ADMIN)
- `POST /loans/:id/print` - In phiếu mượn (LIBRARIAN/ADMIN)

#### Returns
- `GET /returns` - Danh sách phiếu trả (LIBRARIAN/ADMIN)
- `GET /returns/:id` - Chi tiết phiếu trả (LIBRARIAN/ADMIN)
- `POST /returns` - Xử lý trả sách (LIBRARIAN/ADMIN)
- `POST /returns/:id/print` - In phiếu trả (LIBRARIAN/ADMIN)

#### User Loans/Returns
- `GET /users/me/loans` - Lịch sử mượn của user
- `GET /users/me/returns` - Lịch sử trả của user

#### Statistics
- `GET /stats/summary` - Tổng quan thống kê (LIBRARIAN/ADMIN)
- `GET /stats/books-by-category` - Thống kê sách theo danh mục (LIBRARIAN/ADMIN)
- `GET /stats/borrows-monthly` - Thống kê mượn theo tháng (LIBRARIAN/ADMIN)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Role-based access control
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Password Hashing**: bcrypt with salt rounds

## 📁 Cấu trúc thư mục

```
backend/
├── models/           # MongoDB models
├── routes/           # API routes
├── middleware/       # Custom middleware
├── utils/            # Utility functions
├── scripts/          # Seed scripts
├── tests/            # Test files
├── uploads/          # Uploaded files
│   ├── books/        # Book cover images
│   └── avatars/      # User avatars
├── server.js         # Main server file
└── package.json      # Dependencies
```

## 🚀 Deployment

### Environment Variables
Đảm bảo cấu hình đúng các biến môi trường cho production:

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-secret
PORT=5000
```

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name "library-api"
pm2 startup
pm2 save
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**Happy Coding! 🎉**
