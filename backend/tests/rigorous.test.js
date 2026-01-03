const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/index');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');
const Video = require('../src/models/Video');
const path = require('path');
const fs = require('fs');

// Mock videoService to avoid ffprobe/ffmpeg issues with fake files
jest.mock('../src/services/videoService', () => ({
    getVideoMetadata: jest.fn().mockResolvedValue({
        duration: 10,
        resolution: '1280x720',
        codec: 'h264',
        bitrate: 5000
    }),
    processVideo: jest.fn().mockResolvedValue({
        sensitivityStatus: 'Safe',
        status: 'Completed'
    })
}));

describe('Rigorous Backend Testing', () => {
    let adminToken, editorToken, viewerToken;
    let tenant1Id, tenant2Id;
    let videoId;

    beforeAll(async () => {
        // Cleanup
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await Video.deleteMany({});

        // Create Tenants
        const t1 = await Tenant.create({ name: 'Tenant 1' });
        const t2 = await Tenant.create({ name: 'Tenant 2' });
        tenant1Id = t1._id;
        tenant2Id = t2._id;

        // Create Users & Get Tokens
        // Admin registration is now blocked, use seeded admin
        const adminRes = await request(app).post('/api/auth/login').send({
            email: 'admin@gmail.com', password: 'admin'
        });
        adminToken = adminRes.body.token;

        const editorRes = await request(app).post('/api/auth/register').send({
            username: 'editor', email: 'editor@test.com', password: 'password', role: 'Editor', tenantName: 'Tenant 1'
        });
        editorToken = editorRes.body.token;

        const viewerRes = await request(app).post('/api/auth/register').send({
            username: 'viewer', email: 'viewer@test.com', password: 'password', role: 'Viewer', tenantName: 'Tenant 1'
        });
        viewerToken = viewerRes.body.token;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Tenant.deleteMany({});
        await Video.deleteMany({});
        await mongoose.connection.close();
    });

    describe('Video Operations & RBAC', () => {
        it('Editor should be able to upload a video', async () => {
            const testFilePath = path.join(__dirname, 'test-video.mp4');
            fs.writeFileSync(testFilePath, 'fake video content');

            const res = await request(app)
                .post('/api/videos/upload')
                .set('Authorization', `Bearer ${editorToken}`)
                .field('title', 'Test Video')
                .attach('video', testFilePath);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            videoId = res.body._id;

            fs.unlinkSync(testFilePath);
        });

        it('Viewer should NOT be able to upload a video', async () => {
            const res = await request(app)
                .post('/api/videos/upload')
                .set('Authorization', `Bearer ${viewerToken}`)
                .field('title', 'Fail Video');
            expect(res.statusCode).toBe(403);
        });

        it('Admin should see all videos from all tenants', async () => {
            const res = await request(app)
                .get('/api/videos')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('Editor should only see videos from their tenant', async () => {
            const res = await request(app)
                .get('/api/videos')
                .set('Authorization', `Bearer ${editorToken}`);
            expect(res.statusCode).toBe(200);
            res.body.forEach(v => {
                // v.tenantId is populated in the controller
                expect(v.tenantId._id.toString()).toBe(tenant1Id.toString());
            });
        });

        it('Viewer should be able to stream a video from their tenant', async () => {
            const res = await request(app)
                .get(`/api/videos/stream/${videoId}`)
                .set('Authorization', `Bearer ${viewerToken}`)
                .set('Range', 'bytes=0-5'); // Smaller range for fake file
            expect(res.statusCode).toBe(206); // Streaming returns 206 Partial Content
        });

        it('Editor should NOT be able to delete a video from another tenant (Isolation)', async () => {
            // Create a video for Tenant 2
            const t2EditorRes = await request(app).post('/api/auth/register').send({
                username: 'editor2', email: 'editor2@test.com', password: 'password', role: 'Editor', tenantName: 'Tenant 2'
            });
            const t2EditorToken = t2EditorRes.body.token;

            const res = await request(app)
                .delete(`/api/videos/${videoId}`)
                .set('Authorization', `Bearer ${t2EditorToken}`);

            // Should fail because videoId belongs to Tenant 1
            expect(res.statusCode).toBe(403);
        });

        it('Admin should be able to delete any video', async () => {
            const res = await request(app)
                .delete(`/api/videos/${videoId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });
    });

    describe('Admin Management', () => {
        it('Admin should be able to list all users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeGreaterThan(2);
        });

        it('Non-admin should NOT be able to list all users', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${editorToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Should block Admin registration', async () => {
            const res = await request(app).post('/api/auth/register').send({
                username: 'newadmin', email: 'newadmin@test.com', password: 'password', role: 'Admin'
            });
            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe('Admin registration is not allowed');
        });
    });
});
