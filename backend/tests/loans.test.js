const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const Loan = require('../models/Loan');
const mongoose = require('mongoose');

describe('Loan Endpoints', () => {
    let authToken;
    let user;
    let book;
    let category;
    let publisher;

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

        // Create user with hashed password directly
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('password123', 12);
        user = new User({
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'USER',
            passwordHash: hashedPassword
        });
        await user.save();

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        authToken = loginResponse.body.data.accessToken;
    });

    describe('POST /api/loans/self', () => {
        it('should create a self loan successfully', async () => {
            const loanData = {
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/loans/self')
                .set('Authorization', `Bearer ${authToken}`)
                .send(loanData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.readerUserId._id).toBe(user._id.toString());
            expect(response.body.data.createdByRole).toBe('USER');
            expect(response.body.data.status).toBe('OPEN');
            expect(response.body.data.items).toHaveLength(1);

            // Verify book quantity was reduced
            const updatedBook = await Book.findById(book._id);
            expect(updatedBook.quantityAvailable).toBe(4); // 5 - 1
        });

        it('should not create loan with insufficient stock', async () => {
            const loanData = {
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 10 // More than available
                    }
                ]
            };

            const response = await request(app)
                .post('/api/loans/self')
                .set('Authorization', `Bearer ${authToken}`)
                .send(loanData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('STOCK_409');
        });

        it('should not create loan with past due date', async () => {
            const loanData = {
                dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/loans/self')
                .set('Authorization', `Bearer ${authToken}`)
                .send(loanData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('STOCK_409');
        });

        it('should not create loan without authentication', async () => {
            const loanData = {
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/loans/self')
                .send(loanData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });
    });

    describe('GET /api/users/me/loans', () => {
        beforeEach(async () => {
            // Create a test loan
            const loan = new Loan({
                readerUserId: user._id,
                createdByRole: 'USER',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                items: [
                    {
                        bookId: book._id,
                        qty: 1
                    }
                ],
                status: 'OPEN'
            });
            await loan.save();
        });

        it('should get user loans successfully', async () => {
            const response = await request(app)
                .get('/api/users/me/loans')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].readerUserId.toString()).toBe(user._id.toString());
        });

        it('should not get loans without authentication', async () => {
            const response = await request(app)
                .get('/api/users/me/loans')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });
    });
});
