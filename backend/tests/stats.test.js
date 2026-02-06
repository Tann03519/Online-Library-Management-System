const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const Loan = require('../models/Loan');
const mongoose = require('mongoose');

describe('Statistics API Endpoints', () => {
    let authToken;
    let adminToken;
    let user;
    let admin;
    let category;
    let publisher;
    let book;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management_test');
    });

    afterAll(async () => {
        // Clean up and close connection
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear data before each test
        await Promise.all([
            User.deleteMany({}),
            Book.deleteMany({}),
            Category.deleteMany({}),
            Publisher.deleteMany({}),
            Loan.deleteMany({})
        ]);

        // Create test data
        category = await Category.create({
            name: 'Test Category',
            slug: 'test-category'
        });

        publisher = await Publisher.create({
            name: 'Test Publisher',
            slug: 'test-publisher'
        });

        // Create regular user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 12);
        user = new User({
            email: 'user@example.com',
            fullName: 'Test User',
            role: 'USER',
            passwordHash: hashedPassword
        });
        await user.save();

        // Create admin user
        const adminHashedPassword = await bcrypt.hash('admin123', 12);
        admin = new User({
            email: 'admin@example.com',
            fullName: 'Test Admin',
            role: 'ADMIN',
            passwordHash: adminHashedPassword
        });
        await admin.save();

        // Login to get tokens
        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'user@example.com',
                password: 'password123'
            });
        authToken = userLoginResponse.body.data.accessToken;

        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        adminToken = adminLoginResponse.body.data.accessToken;

        // Create test books
        book = await Book.create({
            isbn: '9781234567890',
            title: 'Test Book',
            authors: ['Test Author'],
            categoryId: category._id,
            publisherId: publisher._id,
            quantityTotal: 5,
            quantityAvailable: 5,
            status: 'ACTIVE'
        });

        // Create test loans
        await Loan.create([
            {
                readerUserId: user._id,
                createdByRole: 'USER',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                items: [{ bookId: book._id, qty: 1 }],
                status: 'OPEN'
            },
            {
                readerUserId: user._id,
                createdByRole: 'USER',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                items: [{ bookId: book._id, qty: 2 }],
                status: 'CLOSED'
            }
        ]);
    });

    describe('GET /api/stats/summary', () => {
        it('should get summary statistics as admin', async () => {
            const response = await request(app)
                .get('/api/stats/summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalBooks');
            expect(response.body.data).toHaveProperty('totalUsers');
            expect(response.body.data).toHaveProperty('totalLoans');
            expect(response.body.data).toHaveProperty('activeLoans');
        });

        it('should not get summary statistics as regular user', async () => {
            const response = await request(app)
                .get('/api/stats/summary')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not get summary statistics without authentication', async () => {
            const response = await request(app)
                .get('/api/stats/summary')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/stats/books-by-category', () => {
        it('should get books by category as admin', async () => {
            const response = await request(app)
                .get('/api/stats/books-by-category')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should not get books by category as regular user', async () => {
            const response = await request(app)
                .get('/api/stats/books-by-category')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/stats/monthly-borrows', () => {
        it('should get monthly borrows as admin', async () => {
            const response = await request(app)
                .get('/api/stats/monthly-borrows')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should get monthly borrows with year parameter', async () => {
            const currentYear = new Date().getFullYear();
            const response = await request(app)
                .get(`/api/stats/monthly-borrows?year=${currentYear}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should not get monthly borrows as regular user', async () => {
            const response = await request(app)
                .get('/api/stats/monthly-borrows')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/stats/popular-books', () => {
        it('should get popular books as admin', async () => {
            const response = await request(app)
                .get('/api/stats/popular-books')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should get popular books with limit parameter', async () => {
            const response = await request(app)
                .get('/api/stats/popular-books?limit=5')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should not get popular books as regular user', async () => {
            const response = await request(app)
                .get('/api/stats/popular-books')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/stats/overdue-loans', () => {
        it('should get overdue loans as admin', async () => {
            const response = await request(app)
                .get('/api/stats/overdue-loans')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should not get overdue loans as regular user', async () => {
            const response = await request(app)
                .get('/api/stats/overdue-loans')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
