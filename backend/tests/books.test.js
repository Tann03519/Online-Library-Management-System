const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const mongoose = require('mongoose');

describe('Books API Endpoints', () => {
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
            Publisher.deleteMany({})
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

    describe('GET /api/books', () => {
        it('should get books list (public access)', async () => {
            const response = await request(app)
                .get('/api/books')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe('Test Book');
        });

        it('should get books with pagination', async () => {
            const response = await request(app)
                .get('/api/books?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
        });

        it('should search books by title', async () => {
            const response = await request(app)
                .get('/api/books?search=Test')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
        });
    });

    describe('GET /api/books/:id', () => {
        it('should get book by ID (public access)', async () => {
            const response = await request(app)
                .get(`/api/books/${book._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Book');
        });

        it('should return 404 for non-existent book', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/books/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/books', () => {
        it('should create book as admin', async () => {
            const bookData = {
                isbn: '9780987654321',
                title: 'New Test Book',
                authors: ['New Author'],
                categoryId: category._id.toString(),
                publisherId: publisher._id.toString(),
                quantityTotal: 3,
                quantityAvailable: 3,
                status: 'ACTIVE'
            };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(bookData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('New Test Book');
        });

        it('should not create book as regular user', async () => {
            const bookData = {
                isbn: '9780987654321',
                title: 'New Test Book',
                authors: ['New Author'],
                categoryId: category._id.toString(),
                publisherId: publisher._id.toString(),
                quantityTotal: 3,
                quantityAvailable: 3,
                status: 'ACTIVE'
            };

            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send(bookData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not create book without authentication', async () => {
            const bookData = {
                isbn: '9780987654321',
                title: 'New Test Book',
                authors: ['New Author'],
                categoryId: category._id.toString(),
                publisherId: publisher._id.toString(),
                quantityTotal: 3,
                quantityAvailable: 3,
                status: 'ACTIVE'
            };

            const response = await request(app)
                .post('/api/books')
                .send(bookData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/books/:id', () => {
        it('should update book as admin', async () => {
            const updateData = {
                title: 'Updated Test Book',
                quantityTotal: 10,
                quantityAvailable: 10
            };

            const response = await request(app)
                .put(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Test Book');
        });

        it('should not update book as regular user', async () => {
            const updateData = {
                title: 'Updated Test Book'
            };

            const response = await request(app)
                .put(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/books/:id', () => {
        it('should delete book as admin', async () => {
            const response = await request(app)
                .delete(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete book as regular user', async () => {
            const response = await request(app)
                .delete(`/api/books/${book._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
