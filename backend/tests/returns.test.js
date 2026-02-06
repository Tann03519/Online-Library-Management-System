const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const Loan = require('../models/Loan');
const Return = require('../models/Return');
const mongoose = require('mongoose');

describe('Returns API Endpoints', () => {
    let authToken;
    let adminToken;
    let user;
    let admin;
    let category;
    let publisher;
    let book;
    let loan;

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
            Loan.deleteMany({}),
            Return.deleteMany({})
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

        // Create test loan
        loan = await Loan.create({
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
    });

    describe('GET /api/returns', () => {
        it('should get returns list as admin', async () => {
            // Create test return
            await Return.create({
                loanId: loan._id,
                readerUserId: user._id,
                librarianId: admin._id,
                processedBy: admin._id,
                returnDate: new Date(),
                totalAmount: 0,
                items: [
                    {
                        bookId: book._id,
                        qty: 1,
                        totalFee: 0,
                        condition: 'GOOD'
                    }
                ],
                status: 'COMPLETED'
            });

            const response = await request(app)
                .get('/api/returns')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });

        it('should not get returns list as regular user', async () => {
            const response = await request(app)
                .get('/api/returns')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not get returns list without authentication', async () => {
            const response = await request(app)
                .get('/api/returns')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/returns', () => {
        it('should process return as admin', async () => {
            const returnData = {
                loanId: loan._id.toString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/returns')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(returnData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('COMPLETED');
        });

        it('should not process return as regular user', async () => {
            const returnData = {
                loanId: loan._id.toString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/returns')
                .set('Authorization', `Bearer ${authToken}`)
                .send(returnData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not process return without authentication', async () => {
            const returnData = {
                loanId: loan._id.toString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/returns')
                .send(returnData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not process return for non-existent loan', async () => {
            const fakeLoanId = new mongoose.Types.ObjectId();
            const returnData = {
                loanId: fakeLoanId.toString(),
                items: [
                    {
                        bookId: book._id.toString(),
                        qty: 1
                    }
                ]
            };

            const response = await request(app)
                .post('/api/returns')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(returnData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/returns/:id', () => {
        let returnRecord;

        beforeEach(async () => {
            returnRecord = await Return.create({
                loanId: loan._id,
                readerUserId: user._id,
                librarianId: admin._id,
                processedBy: admin._id,
                returnDate: new Date(),
                totalAmount: 0,
                items: [
                    {
                        bookId: book._id,
                        qty: 1,
                        totalFee: 0,
                        condition: 'GOOD'
                    }
                ],
                status: 'COMPLETED'
            });
        });

        it('should get return by ID as admin', async () => {
            const response = await request(app)
                .get(`/api/returns/${returnRecord._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('COMPLETED');
        });

        it('should not get return by ID as regular user', async () => {
            const response = await request(app)
                .get(`/api/returns/${returnRecord._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent return', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/returns/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });
});
