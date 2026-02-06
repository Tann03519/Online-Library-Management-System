const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const Loan = require('../models/Loan');
const mongoose = require('mongoose');

describe('Overdues API Endpoints', () => {
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

        // Create test book
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
    });

    describe('GET /api/overdues', () => {
        it('should get overdue loans as admin', async () => {
            // Create overdue loan (due date in the past)
            await Loan.create({
                readerUserId: user._id,
                createdByRole: 'USER',
                dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                items: [
                    {
                        bookId: book._id,
                        qty: 1
                    }
                ],
                status: 'OPEN'
            });

            const response = await request(app)
                .get('/api/overdues')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should get overdue loans with pagination', async () => {
            // Create multiple overdue loans
            const overdueLoans = [];
            for (let i = 0; i < 15; i++) {
                overdueLoans.push({
                    readerUserId: user._id,
                    createdByRole: 'USER',
                    dueDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // Past dates
                    items: [
                        {
                            bookId: book._id,
                            qty: 1
                        }
                    ],
                    status: 'OPEN'
                });
            }
            await Loan.create(overdueLoans);

            const response = await request(app)
                .get('/api/overdues?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
            expect(response.body.data).toHaveLength(10);
        });

        it('should not get overdue loans as regular user', async () => {
            const response = await request(app)
                .get('/api/overdues')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not get overdue loans without authentication', async () => {
            const response = await request(app)
                .get('/api/overdues')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });


});
