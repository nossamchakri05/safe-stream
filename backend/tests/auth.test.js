const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/index');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

describe('Auth API', () => {
    beforeAll(async () => {
        // Use a test database if possible, or just cleanup after
    });

    afterAll(async () => {
        await User.deleteMany({ email: 'test@example.com' });
        await Tenant.deleteMany({ name: 'Test Org' });
        await mongoose.connection.close();
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser_new',
                email: 'test_new@example.com',
                password: 'password123',
                role: 'Editor',
                tenantName: 'Test Org'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('token');
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});
