const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Company = require('../models/Company');
const User = require('../models/User');

describe('Company API Tests', () => {
    let authToken;
    let testUser;
    let testCompany;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal-test');
        
        // Clear test data
        await Company.deleteMany({});
        await User.deleteMany({});

        // Create test user
        const userRes = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Test',
                lastName: 'Employer',
                email: 'employer@test.com',
                password: 'password123',
                role: 'employer'
            });

        authToken = userRes.body.token;
        testUser = userRes.body.user;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Company Creation', () => {
        test('should create a new company', async () => {
            const res = await request(app)
                .post('/api/companies')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Company',
                    description: 'A test company',
                    industry: 'Technology',
                    website: 'https://testcompany.com',
                    size: '11-50',
                    contact: {
                        email: 'contact@testcompany.com',
                        phone: '1234567890'
                    }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('name', 'Test Company');
            testCompany = res.body;
        });

        test('should not create company without auth', async () => {
            const res = await request(app)
                .post('/api/companies')
                .send({
                    name: 'Test Company 2',
                    description: 'Another test company',
                    industry: 'Technology'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('Company Retrieval', () => {
        test('should get all companies', async () => {
            const res = await request(app)
                .get('/api/companies');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThan(0);
        });

        test('should get company by ID', async () => {
            const res = await request(app)
                .get(`/api/companies/${testCompany._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name', 'Test Company');
        });

        test('should search companies', async () => {
            const res = await request(app)
                .get('/api/companies')
                .query({ search: 'Test' });

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body[0]).toHaveProperty('name', 'Test Company');
        });
    });

    describe('Company Update', () => {
        test('should update company', async () => {
            const res = await request(app)
                .put(`/api/companies/${testCompany._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Updated description'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('description', 'Updated description');
        });

        test('should not update company without auth', async () => {
            const res = await request(app)
                .put(`/api/companies/${testCompany._id}`)
                .send({
                    description: 'Unauthorized update'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('Employee Management', () => {
        test('should add employee to company', async () => {
            // Create a test employee
            const employeeRes = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'Employee',
                    email: 'employee@test.com',
                    password: 'password123'
                });

            const res = await request(app)
                .post(`/api/companies/${testCompany._id}/employees`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    employeeId: employeeRes.body.user.id
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.employees).toContain(employeeRes.body.user.id);
        });

        test('should remove employee from company', async () => {
            const res = await request(app)
                .delete(`/api/companies/${testCompany._id}/employees/${testUser.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.employees).not.toContain(testUser.id);
        });
    });
}); 