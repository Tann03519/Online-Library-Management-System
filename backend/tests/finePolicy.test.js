const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const FinePolicy = require('../models/FinePolicy');
const mongoose = require('mongoose');

describe('Fine Policy API Endpoints', () => {
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
            FinePolicy.deleteMany({})
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

    describe('GET /api/fine-policy', () => {
        it('should get fine policy (public access)', async () => {
            // Create test fine policy
            await FinePolicy.create({
                dailyFineAmount: 1000,
                gracePeriodDays: 3,
                maxFineAmount: 50000,
                lateFeePerDay: 1000,
                damageFeeRate: 0.1,
                isActive: true
            });

            const response = await request(app)
                .get('/api/fine-policy')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.dailyFineAmount).toBe(1000);
        });

        it('should return default policy if none exists', async () => {
            const response = await request(app)
                .get('/api/fine-policy')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('PUT /api/fine-policy', () => {
        it('should update fine policy as admin', async () => {
            // Create initial policy
            await FinePolicy.create({
                dailyFineAmount: 1000,
                gracePeriodDays: 3,
                maxFineAmount: 50000,
                lateFeePerDay: 1000,
                damageFeeRate: 0.1,
                isActive: true
            });

            const updateData = {
                dailyFineAmount: 2000,
                gracePeriodDays: 5,
                maxFineAmount: 100000
            };

            const response = await request(app)
                .put('/api/fine-policy')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.dailyFineAmount).toBe(2000);
            expect(response.body.data.gracePeriodDays).toBe(5);
        });

        it('should create fine policy if none exists as admin', async () => {
            const policyData = {
                dailyFineAmount: 1500,
                gracePeriodDays: 2,
                maxFineAmount: 75000,
                lateFeePerDay: 1500,
                damageFeeRate: 0.15,
                isActive: true
            };

            const response = await request(app)
                .put('/api/fine-policy')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(policyData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.dailyFineAmount).toBe(1500);
        });

        it('should not update fine policy as regular user', async () => {
            const updateData = {
                dailyFineAmount: 2000
            };

            const response = await request(app)
                .put('/api/fine-policy')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not update fine policy without authentication', async () => {
            const updateData = {
                dailyFineAmount: 2000
            };

            const response = await request(app)
                .put('/api/fine-policy')
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should validate fine policy data', async () => {
            const invalidData = {
                dailyFineAmount: -100, // Negative amount
                gracePeriodDays: -1,   // Negative days
                maxFineAmount: 0       // Zero max amount
            };

            const response = await request(app)
                .put('/api/fine-policy')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/fine-policy/toggle', () => {
        beforeEach(async () => {
            // Create test policy
            await FinePolicy.create({
                dailyFineAmount: 1000,
                gracePeriodDays: 3,
                maxFineAmount: 50000,
                lateFeePerDay: 1000,
                damageFeeRate: 0.1,
                isActive: true
            });
        });

        it('should toggle fine policy status as admin', async () => {
            const response = await request(app)
                .post('/api/fine-policy/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);
        });

        it('should not toggle fine policy as regular user', async () => {
            const response = await request(app)
                .post('/api/fine-policy/toggle')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
