const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Publisher = require('../models/Publisher');
const mongoose = require('mongoose');

describe('Publishers API Endpoints', () => {
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
            Publisher.deleteMany({})
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

    describe('GET /api/publishers', () => {
        it('should get publishers list (public access)', async () => {
            // Create test publishers
            await Publisher.create([
                { name: 'Publisher 1', slug: 'publisher-1' },
                { name: 'Publisher 2', slug: 'publisher-2' }
            ]);

            const response = await request(app)
                .get('/api/publishers')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should get publishers with pagination', async () => {
            // Create multiple publishers
            const publishers = [];
            for (let i = 0; i < 15; i++) {
                publishers.push({
                    name: `Publisher ${i}`,
                    slug: `publisher-${i}`
                });
            }
            await Publisher.create(publishers);

            const response = await request(app)
                .get('/api/publishers?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
            expect(response.body.data).toHaveLength(10);
        });
    });

    describe('POST /api/publishers', () => {
        it('should create publisher as admin', async () => {
            const publisherData = {
                name: 'New Publisher',
                slug: 'new-publisher'
            };

            const response = await request(app)
                .post('/api/publishers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(publisherData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('New Publisher');
        });

        it('should not create publisher as regular user', async () => {
            const publisherData = {
                name: 'New Publisher',
                slug: 'new-publisher'
            };

            const response = await request(app)
                .post('/api/publishers')
                .set('Authorization', `Bearer ${authToken}`)
                .send(publisherData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not create publisher without authentication', async () => {
            const publisherData = {
                name: 'New Publisher',
                slug: 'new-publisher'
            };

            const response = await request(app)
                .post('/api/publishers')
                .send(publisherData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not create publisher with duplicate name', async () => {
            // Create first publisher
            await Publisher.create({
                name: 'Existing Publisher',
                slug: 'existing-publisher'
            });

            const publisherData = {
                name: 'Existing Publisher',
                slug: 'duplicate-publisher'
            };

            const response = await request(app)
                .post('/api/publishers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(publisherData)
                .expect(409);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/publishers/:id', () => {
        let publisher;

        beforeEach(async () => {
            publisher = await Publisher.create({
                name: 'Original Publisher',
                slug: 'original-publisher'
            });
        });

        it('should update publisher as admin', async () => {
            const updateData = {
                name: 'Updated Publisher',
                slug: 'updated-publisher'
            };

            const response = await request(app)
                .put(`/api/publishers/${publisher._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Publisher');
        });

        it('should not update publisher as regular user', async () => {
            const updateData = {
                name: 'Updated Publisher'
            };

            const response = await request(app)
                .put(`/api/publishers/${publisher._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/publishers/:id', () => {
        let publisher;

        beforeEach(async () => {
            publisher = await Publisher.create({
                name: 'To Delete',
                slug: 'to-delete'
            });
        });

        it('should delete publisher as admin', async () => {
            const response = await request(app)
                .delete(`/api/publishers/${publisher._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete publisher as regular user', async () => {
            const response = await request(app)
                .delete(`/api/publishers/${publisher._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
