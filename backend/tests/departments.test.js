const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const mongoose = require('mongoose');

describe('Departments API Endpoints', () => {
    let authToken;
    let adminToken;
    let user;
    let admin;
    let faculty;

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
            Faculty.deleteMany({}),
            Department.deleteMany({})
        ]);

        // Create test faculty
        faculty = await Faculty.create({
            name: 'Faculty of Science',
            code: 'SCI'
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
    });

    describe('GET /api/departments', () => {
        it('should get departments list (public access)', async () => {
            // Create test departments
            await Department.create([
                {
                    name: 'Computer Science',
                    code: 'CS',
                    facultyId: faculty._id
                },
                {
                    name: 'Mathematics',
                    code: 'MATH',
                    facultyId: faculty._id
                }
            ]);

            const response = await request(app)
                .get('/api/departments')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
        });

        it('should get departments with pagination', async () => {
            // Create multiple departments
            const departments = [];
            for (let i = 0; i < 15; i++) {
                departments.push({
                    name: `Department ${i}`,
                    code: `DEPT${i}`,
                    facultyId: faculty._id
                });
            }
            await Department.create(departments);

            const response = await request(app)
                .get('/api/departments?page=1&limit=10')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.meta).toBeDefined();
            expect(response.body.data).toHaveLength(10);
        });

        it('should filter departments by faculty', async () => {
            // Create another faculty
            const anotherFaculty = await Faculty.create({
                name: 'Faculty of Engineering',
                code: 'ENG'
            });

            // Create departments for both faculties
            await Department.create([
                {
                    name: 'Computer Science',
                    code: 'CS',
                    facultyId: faculty._id
                },
                {
                    name: 'Mechanical Engineering',
                    code: 'ME',
                    facultyId: anotherFaculty._id
                }
            ]);

            const response = await request(app)
                .get(`/api/departments?facultyId=${faculty._id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('Computer Science');
        });
    });

    describe('POST /api/departments', () => {
        it('should create department as admin', async () => {
            const departmentData = {
                name: 'Physics',
                code: 'PHY',
                facultyId: faculty._id.toString()
            };

            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(departmentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Physics');
        });

        it('should not create department as regular user', async () => {
            const departmentData = {
                name: 'Physics',
                code: 'PHY',
                facultyId: faculty._id.toString()
            };

            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${authToken}`)
                .send(departmentData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should not create department without authentication', async () => {
            const departmentData = {
                name: 'Physics',
                code: 'PHY',
                facultyId: faculty._id.toString()
            };

            const response = await request(app)
                .post('/api/departments')
                .send(departmentData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it('should not create department with duplicate code', async () => {
            // Create first department
            await Department.create({
                name: 'Existing Department',
                code: 'EXIST',
                facultyId: faculty._id
            });

            const departmentData = {
                name: 'Duplicate Department',
                code: 'EXIST',
                facultyId: faculty._id.toString()
            };

            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(departmentData)
                .expect(409);

            expect(response.body.success).toBe(false);
        });

        it('should not create department with invalid faculty', async () => {
            const fakeFacultyId = new mongoose.Types.ObjectId();
            const departmentData = {
                name: 'Physics',
                code: 'PHY',
                facultyId: fakeFacultyId.toString()
            };

            const response = await request(app)
                .post('/api/departments')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(departmentData)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/departments/:id', () => {
        let department;

        beforeEach(async () => {
            department = await Department.create({
                name: 'Original Department',
                code: 'ORIG',
                facultyId: faculty._id
            });
        });

        it('should update department as admin', async () => {
            const updateData = {
                name: 'Updated Department',
                code: 'UPD'
            };

            const response = await request(app)
                .put(`/api/departments/${department._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Department');
        });

        it('should not update department as regular user', async () => {
            const updateData = {
                name: 'Updated Department'
            };

            const response = await request(app)
                .put(`/api/departments/${department._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/departments/:id', () => {
        let department;

        beforeEach(async () => {
            department = await Department.create({
                name: 'To Delete',
                code: 'DEL',
                facultyId: faculty._id
            });
        });

        it('should delete department as admin', async () => {
            const response = await request(app)
                .delete(`/api/departments/${department._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should not delete department as regular user', async () => {
            const response = await request(app)
                .delete(`/api/departments/${department._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });
});
