const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const mongoose = require('mongoose');

describe('Faculties API Endpoints', () => {
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
            Faculty.deleteMany({})
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

    describe('GET /api/faculties', () => {
        it('should get faculties list (public access)', async () => {
            // Create test faculties
            await Faculty.create([
                { name: 'Faculty of Science', code: 'SCI' },
                { name: 'Faculty of Engineering', code: 'ENG' }
            ]);

            const response = await request(app)
                .get('/api/faculties')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should get faculties with pagination', async () => {
            // Create multiple faculties
            const faculties = [];
            for (let i = 0; i < 15; i++) {
                faculties.push({
                    name: `Faculty ${i}`,
                    code: `FAC${i}`
                });
            }
            await Faculty.create(faculties);

            const response = await request(app)
                .get('/api/faculties?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
            expect(response.body.data).toHaveLength(10);
        });
    });

    describe('POST /api/faculties', () => {
        it('should create faculty as admin', async () => {
            const facultyData = {
                name: 'Faculty of Medicine',
                code: 'MED'
            };

            const response = await request(app)
                .post('/api/faculties')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(facultyData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Faculty of Medicine');
        });

        it('should not create faculty as regular user', async () => {
            const facultyData = {
                name: 'Faculty of Medicine',
                code: 'MED'
            };

            const response = await request(app)
                .post('/api/faculties')
                .set('Authorization', `Bearer ${authToken}`)
                .send(facultyData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not create faculty without authentication', async () => {
            const facultyData = {
                name: 'Faculty of Medicine',
                code: 'MED'
            };

            const response = await request(app)
                .post('/api/faculties')
                .send(facultyData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not create faculty with duplicate code', async () => {
            // Create first faculty
            await Faculty.create({
                name: 'Existing Faculty',
                code: 'EXIST'
            });

            const facultyData = {
                name: 'Duplicate Faculty',
                code: 'EXIST'
            };

            const response = await request(app)
                .post('/api/faculties')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(facultyData)
                .expect(409);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/faculties/:id', () => {
        let faculty;

        beforeEach(async () => {
            faculty = await Faculty.create({
                name: 'Original Faculty',
                code: 'ORIG'
            });
        });

        it('should update faculty as admin', async () => {
            const updateData = {
                name: 'Updated Faculty',
                code: 'UPD'
            };

            const response = await request(app)
                .put(`/api/faculties/${faculty._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Faculty');
        });

        it('should not update faculty as regular user', async () => {
            const updateData = {
                name: 'Updated Faculty'
            };

            const response = await request(app)
                .put(`/api/faculties/${faculty._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/faculties/:id', () => {
        let faculty;

        beforeEach(async () => {
            faculty = await Faculty.create({
                name: 'To Delete',
                code: 'DEL'
            });
        });

        it('should delete faculty as admin', async () => {
            const response = await request(app)
                .delete(`/api/faculties/${faculty._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete faculty as regular user', async () => {
            const response = await request(app)
                .delete(`/api/faculties/${faculty._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
