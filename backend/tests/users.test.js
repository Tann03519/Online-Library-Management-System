const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const mongoose = require('mongoose');

describe('Users API Endpoints', () => {
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
        await User.deleteMany({});

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

    describe('GET /api/users/me', () => {
        it('should get current user profile', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('user@example.com');
            expect(response.body.data.user.fullName).toBe('Test User');
        });

        it('should not get profile without authentication', async () => {
            const response = await request(app)
                .get('/api/users/me')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/me', () => {
        it('should update user profile', async () => {
            const updateData = {
                fullName: 'Updated Test User'
            };

            const response = await request(app)
                .put('/api/users/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.fullName).toBe('Updated Test User');
        });

        it('should not update profile without authentication', async () => {
            const updateData = {
                fullName: 'Updated Test User'
            };

            const response = await request(app)
                .put('/api/users/me')
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/me/password', () => {
        it('should change user password', async () => {
            const passwordData = {
                currentPassword: 'password123',
                newPassword: 'newpassword123'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not change password with wrong current password', async () => {
            const passwordData = {
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword123'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .set('Authorization', `Bearer ${authToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should not change password without authentication', async () => {
            const passwordData = {
                currentPassword: 'password123',
                newPassword: 'newpassword123'
            };

            const response = await request(app)
                .put('/api/users/me/password')
                .send(passwordData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users', () => {
        it('should get users list as admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should not get users list as regular user', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not get users list without authentication', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });


    describe('PUT /api/users/:id', () => {
        it('should update user as admin', async () => {
            const updateData = {
                fullName: 'Admin Updated User',
                role: 'LIBRARIAN'
            };

            const response = await request(app)
                .put(`/api/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.fullName).toBe('Admin Updated User');
            expect(response.body.data.user.role).toBe('LIBRARIAN');
        });

        it('should not update user as regular user', async () => {
            const updateData = {
                fullName: 'Unauthorized Update'
            };

            const response = await request(app)
                .put(`/api/users/${user._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user as admin', async () => {
            const response = await request(app)
                .delete(`/api/users/${user._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete user as regular user', async () => {
            const response = await request(app)
                .delete(`/api/users/${admin._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
