const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('API Integration Tests', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal-test');
        
        // Clear test data
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Authentication', () => {
        test('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            
            authToken = res.body.token;
            testUser = res.body.user;
        });

        test('should login existing user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });

        test('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('email', 'test@example.com');
        });
    });

    describe('Job Management', () => {
        test('should create a new job posting', async () => {
            const res = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Software Developer',
                    company: 'Test Company',
                    location: 'Remote',
                    type: 'Full-time',
                    salary: '$80,000 - $100,000',
                    description: 'Test job description',
                    requirements: ['JavaScript', 'Node.js']
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('title', 'Software Developer');
        });

        test('should get all jobs', async () => {
            const res = await request(app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });
    });
}); 