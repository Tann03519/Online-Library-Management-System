const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const mongoose = require('mongoose');

describe('Authentication Endpoints', () => {
    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management_test');
    });

    afterAll(async () => {
        // Clean up and close connection
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.user.fullName).toBe(userData.fullName);
            expect(response.body.data.user.role).toBe('USER');
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should not register user with duplicate email', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User'
            };

            // Register first user
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // Try to register with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_400');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 12);
            const user = new User({
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'USER',
                passwordHash: hashedPassword
            });
            await user.save();
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(loginData.email);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should not login with invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });

        it('should not login with non-existent email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });
    });

    describe('GET /api/auth/me', () => {
        let authToken;

        beforeEach(async () => {
            // Create and login a test user
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 12);
            const user = new User({
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'USER',
                passwordHash: hashedPassword
            });
            await user.save();

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            authToken = loginResponse.body.data.accessToken;
        });

        it('should get current user info with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.fullName).toBe('Test User');
        });

        it('should not get user info without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });

        it('should not get user info with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_401');
        });
    });
});
