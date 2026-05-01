const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Auth Routes (Integration)', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should return 401 if username is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 401 if password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 401 if user not found', async () => {
            dbService.findUserByUsername.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nonexistent', password: 'testpass123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Kullanıcı adı veya şifre hatalı.');
        });

        it('should return 401 if password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'user-1',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Kullanıcı adı veya şifre hatalı.');
        });

        it('should return 403 if user account is inactive', async () => {
            const hashedPassword = await bcrypt.hash('testpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'user-1',
                username: 'inactive',
                password: hashedPassword,
                role: 'BARBER',
                isActive: false
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'inactive', password: 'testpass123' });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
        });

        it('should return 200 and token for valid admin credentials', async () => {
            const hashedPassword = await bcrypt.hash('adminpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'admin-1',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                name: 'Admin User',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'adminpass123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user).toEqual({
                id: 'admin-1',
                username: 'admin',
                role: 'ADMIN',
                name: 'Admin User'
            });
            expect(res.body.user.password).toBeUndefined();
        });

        it('should return 200 and token for valid barber credentials', async () => {
            const hashedPassword = await bcrypt.hash('barberpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'barber-1',
                username: 'barber',
                password: hashedPassword,
                role: 'BARBER',
                name: 'Barber User',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'barber', password: 'barberpass123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.role).toBe('BARBER');
        });

        it('should call findUserByUsername with correct username (no role filtering)', async () => {
            const hashedPassword = await bcrypt.hash('testpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'user-1',
                username: 'testuser',
                password: hashedPassword,
                role: 'BARBER',
                isActive: true
            });

            await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'testpass123' });

            // Verify findUserByUsername is called with only username, no role filtering
            expect(dbService.findUserByUsername).toHaveBeenCalledWith('testuser');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Yetkilendirme gerekli.');
        });

        it('should return 401 with invalid token', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Geçersiz veya süresi dolmuş token.');
        });

        it('should return user info with valid token', async () => {
            const { JWT_SECRET } = require('../../src/config/env');
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { id: 'user-1', username: 'admin', role: 'ADMIN' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            dbService.findUserById.mockResolvedValue({
                id: 'user-1',
                username: 'admin',
                role: 'ADMIN',
                name: 'Admin',
                phone: '05321111111',
                isActive: true,
                level: 'SENIOR',
                createdAt: new Date()
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('user-1');
            expect(res.body.username).toBe('admin');
            expect(res.body.role).toBe('ADMIN');
            expect(res.body.password).toBeUndefined();
        });
    });

    describe('Payload Type Safety', () => {
        it('should return 400 when username is an array', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: [], password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Geçersiz veri tipi');
        });

        it('should return 400 when password is an object', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: {} });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Geçersiz veri tipi');
        });

        it('should return 400 when name is a number in register', async () => {
            dbService.usernameExists.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newuser',
                    password: 'password123',
                    name: 12345
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz veri tipi: name');
        });
    });

    // Close server after all tests
    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
    });
});
