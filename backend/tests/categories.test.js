const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Category = require('../models/Category');
const mongoose = require('mongoose');

describe('Categories API Endpoints', () => {
    let authToken;
    let adminToken;
    let user;
    let admin;

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
            Category.deleteMany({})
        ]);

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
    });

    describe('GET /api/categories', () => {
        it('should get categories list (public access)', async () => {
            // Create test categories
            await Category.create([
                { name: 'Fiction', slug: 'fiction' },
                { name: 'Non-Fiction', slug: 'non-fiction' }
            ]);

            const response = await request(app)
                .get('/api/categories')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should get categories with pagination', async () => {
            // Create multiple categories
            const categories = [];
            for (let i = 0; i < 15; i++) {
                categories.push({
                    name: `Category ${i}`,
                    slug: `category-${i}`
                });
            }
            await Category.create(categories);

            const response = await request(app)
                .get('/api/categories?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
            expect(response.body.data).toHaveLength(10);
        });
    });

    describe('POST /api/categories', () => {
        it('should create category as admin', async () => {
            const categoryData = {
                name: 'Science Fiction',
                slug: 'science-fiction'
            };

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Science Fiction');
        });

        it('should not create category as regular user', async () => {
            const categoryData = {
                name: 'Science Fiction',
                slug: 'science-fiction'
            };

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${authToken}`)
                .send(categoryData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not create category without authentication', async () => {
            const categoryData = {
                name: 'Science Fiction',
                slug: 'science-fiction'
            };

            const response = await request(app)
                .post('/api/categories')
                .send(categoryData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not create category with duplicate name', async () => {
            // Create first category
            await Category.create({
                name: 'Fiction',
                slug: 'fiction'
            });

            const categoryData = {
                name: 'Fiction',
                slug: 'fiction-duplicate'
            };

            const response = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(categoryData)
                .expect(409);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/categories/:id', () => {
        let category;

        beforeEach(async () => {
            category = await Category.create({
                name: 'Original Category',
                slug: 'original-category'
            });
        });

        it('should update category as admin', async () => {
            const updateData = {
                name: 'Updated Category',
                slug: 'updated-category'
            };

            const response = await request(app)
                .put(`/api/categories/${category._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Category');
        });

        it('should not update category as regular user', async () => {
            const updateData = {
                name: 'Updated Category'
            };

            const response = await request(app)
                .put(`/api/categories/${category._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/categories/:id', () => {
        let category;

        beforeEach(async () => {
            category = await Category.create({
                name: 'To Delete',
                slug: 'to-delete'
            });
        });

        it('should delete category as admin', async () => {
            const response = await request(app)
                .delete(`/api/categories/${category._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete category as regular user', async () => {
            const response = await request(app)
                .delete(`/api/categories/${category._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
