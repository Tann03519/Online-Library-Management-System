# Library Management System

A full-stack library management system built with React (Frontend) and Node.js/Express (Backend), using MongoDB as the database.

## 📋 System Requirements

### Required Software
- **Node.js**: version 16.x or higher
- **MongoDB**: version 4.4 or higher
- **npm** or **yarn**: for dependency management

### Check Versions
```bash
node --version
npm --version
mongod --version
```

## 🚀 Installation & Setup Guide

### Method 1: Automated Scripts (Recommended)

#### 🪟 Windows (Command Prompt/PowerShell)

**Automated setup:**
```cmd
git clone <repository-url>
cd QuanLyThuVien
setup.bat
```

**Start the project:**
```cmd
start.bat
```

**Seed sample data:**
```cmd
seed.bat
```

**Stop the project:**
```cmd
stop.bat
```

**All-in-one script:**
```cmd
dev.bat help    # View all commands
dev.bat setup   # Install project
dev.bat start   # Start servers
dev.bat seed    # Seed sample data
dev.bat test    # Run tests
dev.bat status  # Check status
```

#### 🐧 Linux/macOS (Bash)

**Automated setup:**
```bash
git clone <repository-url>
cd QuanLyThuVien
./setup.sh
```

**Start the project:**
```bash
./start.sh
```

**Seed sample data:**
```bash
./seed.sh
```

**Stop the project:**
```bash
./stop.sh
```

**All-in-one script:**
```bash
./dev.sh help    # View all commands
./dev.sh setup   # Install project
./dev.sh start   # Start servers
./dev.sh seed    # Seed sample data
./dev.sh test    # Run tests
./dev.sh status  # Check status
```

### Method 2: Manual Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd QuanLyThuVien
```

### Step 2: Set Up the Backend

1. **Navigate to the backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
# Copy the example env file to .env
cp env.example .env
```

4. **Edit the .env file with the following settings:**
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

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Step 3: Set Up the Frontend

1. **Navigate to the frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

### Step 4: Start MongoDB

**On Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**On macOS:**
```bash
# Using Homebrew
brew services start mongodb-community
```

**On Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
```

### Step 5: Run the Project

#### Start the Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend will be running at: `http://localhost:5000`

#### Start the Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Frontend will be running at: `http://localhost:3000`

### Step 6: Seed Data (Optional)

To populate sample data for testing, run the following command in the backend directory:

```bash
cd backend
npm run seed
```

#### 📊 Available Seeding Scripts

The `backend/scripts/` directory contains seeding scripts with rich sample data:

**Main scripts:**
- `seed.js` — Primary seeding script with full data
- `seed-optimized.js` — Optimized version

**Additional scripts:**
- `seedLoanData.js` — Generate sample loan records
- `seedNotifications.js` — Generate sample notifications
- `seedReviews.js` — Generate sample book reviews
- `testNotifications.js` — Test the notification system
- `testNewBookNotification.js` — Test new book notifications

**Sample data includes:**
- ✅ **28 books** with real cover images from Amazon
- ✅ **12 categories** across various genres
- ✅ **12 publishers** (domestic and international)
- ✅ **12 departments** and **14 faculties**
- ✅ **5 users** with different roles
- ✅ **3 loan records** with various statuses
- ✅ **Default penalty policies**

**Default test accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | admin123 |
| Librarian | librarian@library.com | librarian123 |
| Student 1 | student1@university.edu | student123 |
| Student 2 | student2@university.edu | student123 |
| Student 3 | student3@university.edu | student123 |

## 🛠️ Available Scripts

### Backend Scripts
- `npm start` — Run the production server
- `npm run dev` — Run the development server with nodemon
- `npm run seed` — Seed sample data
- `npm test` — Run tests

### Additional Seeding Scripts
```bash
# Run the main seeding script
node scripts/seed.js

# Run the optimized version
node scripts/seed-optimized.js

# Generate sample loan records
node scripts/seedLoanData.js

# Generate sample notifications
node scripts/seedNotifications.js

# Generate sample book reviews
node scripts/seedReviews.js

# Test the notification system
node scripts/testNotifications.js

# Test new book notifications
node scripts/testNewBookNotification.js
```

### Frontend Scripts
- `npm start` — Run the development server
- `npm run build` — Build for production
- `npm test` — Run tests
- `npm run eject` — Eject from Create React App

## 📁 Project Structure

```
QuanLyThuVien/
├── backend/                 # Backend API
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── scripts/            # Database seeding scripts
│   │   ├── seed.js         # Main seeding script
│   │   ├── seed-optimized.js # Optimized version
│   │   ├── seedLoanData.js # Sample loan records
│   │   ├── seedNotifications.js # Sample notifications
│   │   ├── seedReviews.js  # Sample reviews
│   │   ├── testNotifications.js # Notification tests
│   │   └── README.md       # Script documentation
│   ├── tests/              # Test files
│   └── uploads/            # File uploads
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # API utilities
│   │   └── types/         # TypeScript types
│   └── public/            # Static files
└── README.md
```

## 🔧 Additional Configuration

### MongoDB Atlas (Cloud Database)
To use MongoDB Atlas instead of a local MongoDB instance:

1. Create a cluster on [MongoDB Atlas](https://cloud.mongodb.com)
2. Get the connection string
3. Update `MONGODB_URI` in the `.env` file

### Environment Variables
Key environment variables:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret key for JWT tokens
- `PORT` — Backend server port (default: 5000)
- `CORS_ORIGIN` — Allowed frontend URL for CORS

## 🐛 Troubleshooting

### Common Errors

1. **MongoDB connection error:**
   - Verify that MongoDB is running
   - Check the connection string in `.env`

2. **Port already in use:**
   - Change the PORT in `.env`
   - Or kill the process occupying the port

3. **CORS error:**
   - Check `CORS_ORIGIN` in `.env`
   - Ensure frontend and backend are running on the correct ports

4. **Module not found:**
   - Run `npm install` again
   - Delete `node_modules` and reinstall

### Logs & Debugging

**Backend logs:**
```bash
cd backend
npm run dev
```

**Frontend logs:**
```bash
cd frontend
npm start
```

## 📚 API Documentation

The backend API is documented in a Postman collection:
- File: `backend/postman/Library_Management_API.postman_collection.json`

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Production Deployment

### Build the Frontend
```bash
cd frontend
npm run build
```

### Run in Production
```bash
cd backend
NODE_ENV=production npm start
```

## 📞 Support

If you encounter any issues:
1. Check the terminal logs
2. Ensure all dependencies are installed
3. Verify the MongoDB connection
4. Refer to the Troubleshooting section above

## 🛠️ Automation Scripts

The project includes `.sh` and `.bat` scripts to automate setup and management.

### 📋 Script List

#### 🪟 Windows Scripts (.bat)

| Script | Description | Usage |
|--------|-------------|-------|
| `setup.bat` | Full project setup from scratch | `setup.bat` |
| `start.bat` | Start both backend and frontend | `start.bat` |
| `stop.bat` | Stop all servers | `stop.bat` |
| `seed.bat` | Seed sample data | `seed.bat` |
| `dev.bat` | All-in-one development script | `dev.bat help` |

#### 🐧 Linux/macOS Scripts (.sh)

| Script | Description | Usage |
|--------|-------------|-------|
| `setup.sh` | Full project setup from scratch | `./setup.sh` |
| `start.sh` | Start both backend and frontend | `./start.sh` |
| `stop.sh` | Stop all servers | `./stop.sh` |
| `seed.sh` | Seed sample data | `./seed.sh` |
| `dev.sh` | All-in-one development script | `./dev.sh help` |

### 🚀 Script Details

#### `setup.sh` — Automated Setup
```bash
./setup.sh
```
**Functions:**
- Checks for Node.js and MongoDB
- Installs backend and frontend dependencies
- Creates `.env` from `env.example`
- Creates the uploads directory
- Displays next steps

#### `start.sh` — Start Servers
```bash
./start.sh
```
**Functions:**
- Verifies MongoDB connection
- Starts the backend on port 5000
- Starts the frontend on port 3000
- Creates logs and manages PIDs
- Displays URLs and test accounts

#### `stop.sh` — Stop Servers
```bash
./stop.sh
```
**Functions:**
- Stops backend and frontend servers
- Cleans up processes and PIDs
- Displays restart instructions

#### `seed.sh` — Seed Sample Data
```bash
./seed.sh                    # Interactive mode
./seed.sh seed              # Run seed.js
./seed.sh optimized         # Run seed-optimized.js
./seed.sh loans             # Run seedLoanData.js
./seed.sh notifications     # Run seedNotifications.js
./seed.sh reviews           # Run seedReviews.js
./seed.sh all               # Run all scripts
```
**Functions:**
- Checks MongoDB connection
- Runs seeding scripts
- Displays test accounts and generated data

#### `dev.sh` — Development Tools
```bash
./dev.sh help      # Show help
./dev.sh setup     # Install project
./dev.sh start     # Start servers
./dev.sh stop      # Stop servers
./dev.sh restart   # Restart servers
./dev.sh seed      # Seed sample data
./dev.sh test      # Run tests
./dev.sh build     # Build for production
./dev.sh logs      # View logs
./dev.sh clean     # Clean the project
./dev.sh status    # Check status
```

### 📝 Logs & Monitoring

**View real-time logs:**
```bash
tail -f logs/backend.log    # Backend logs
tail -f logs/frontend.log   # Frontend logs
```

**Check status:**
```bash
./dev.sh status
```

**Important URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

### 🔧 Script Troubleshooting

#### 🪟 Windows

**If a script fails to run:**
```cmd
dev.bat clean             # Clean and reinstall
dev.bat status            # Check status
```

**If a port is occupied:**
```cmd
stop.bat                  # Stop all servers
netstat -ano | findstr ":3000"  # Find process on port 3000
netstat -ano | findstr ":5000"  # Find process on port 5000
taskkill /PID <PID> /F    # Force kill the process
```

**If MongoDB is not running:**
```cmd
net start MongoDB         # Start MongoDB service
```

#### 🐧 Linux/macOS

**If a script fails to run:**
```bash
chmod +x *.sh              # Grant execute permissions
./dev.sh clean             # Clean and reinstall
./dev.sh status            # Check status
```

**If a port is occupied:**
```bash
./stop.sh                  # Stop all servers
lsof -ti:3000 | xargs kill -9  # Force kill port 3000
lsof -ti:5000 | xargs kill -9  # Force kill port 5000
```

**If MongoDB is not running:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

> **Note:** Make sure MongoDB is running before starting the backend server.
