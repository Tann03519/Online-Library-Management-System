// Load environment variables first
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/library_management_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_for_testing_only';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_REFRESH_EXPIRE = '7d';
process.env.PORT = '0'; // Use random available port for tests

// Increase timeout for database operations
jest.setTimeout(30000);
