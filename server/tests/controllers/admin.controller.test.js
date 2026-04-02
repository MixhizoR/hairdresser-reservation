const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Admin Controller', () => {
    let adminToken;
    let barberToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
        barberToken = jwt.sign({ id: 'barber-1', username: 'barber1', role: 'BARBER' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== LOGIN ====================
    describe('POST /api/auth/login', () => {
        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if both fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(res.status).toBe(400);
        });

        it('should return 401 if user does not exist', async () => {
            dbService.findUserByUsername.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nonexistent', password: 'testpass123' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Kullanıcı adı veya şifre hatalı.');
        });

        it('should return 401 if password is incorrect', async () => {
            const hash = await bcrypt.hash('correctpass', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'user-1',
                username: 'admin',
                password: hash,
                role: 'ADMIN',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpass' });

            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Kullanıcı adı veya şifre hatalı.');
        });

        it('should return 403 if user account is inactive', async () => {
            const hash = await bcrypt.hash('testpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'user-1',
                username: 'admin',
                password: hash,
                role: 'ADMIN',
                isActive: false
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'testpass123' });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.');
        });

        it('should return 200 with token and user data on successful login', async () => {
            const hash = await bcrypt.hash('testpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'admin-1',
                username: 'admin',
                password: hash,
                role: 'ADMIN',
                name: 'Admin User',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'testpass123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.username).toBe('admin');
            expect(res.body.user.role).toBe('ADMIN');
            expect(res.body.user.name).toBe('Admin User');
            expect(res.body.user.id).toBe('admin-1');
        });

        it('should not include password in response', async () => {
            const hash = await bcrypt.hash('testpass123', 12);
            dbService.findUserByUsername.mockResolvedValue({
                id: 'admin-1',
                username: 'admin',
                password: hash,
                role: 'ADMIN',
                name: 'Admin',
                isActive: true
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'testpass123' });

            expect(res.body.user.password).toBeUndefined();
        });
    });

    // ==================== REGISTER ====================
    describe('POST /api/auth/register', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'newuser', password: 'testpass123' });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to register', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ username: 'newuser', password: 'testpass123' });

            expect(res.status).toBe(403);
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if username is too short', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'ab', password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı 3-30 karakter arasında olmalıdır.');
        });

        it('should return 400 if username is too long', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'a'.repeat(31), password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı 3-30 karakter arasında olmalıdır.');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser', password: 'short' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Şifre en az 8 karakter olmalıdır.');
        });

        it('should return 400 if role is invalid', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser', password: 'testpass123', role: 'SUPERADMIN' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz rol. ADMIN veya BARBER olmalıdır.');
        });

        it('should return 409 if username already exists', async () => {
            dbService.usernameExists.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'existinguser', password: 'testpass123' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Bu kullanıcı adı zaten kullanımda.');
        });

        it('should return 201 on successful registration', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-user-1',
                username: 'newuser',
                role: 'BARBER',
                name: null
            });

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser', password: 'testpass123', role: 'BARBER' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user.username).toBe('newuser');
            expect(res.body.user.role).toBe('BARBER');
        });

        it('should default to BARBER role if not specified', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-user-1',
                username: 'newuser',
                role: 'BARBER',
                name: null
            });

            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser', password: 'testpass123' });

            expect(res.status).toBe(201);
            expect(dbService.createUser).toHaveBeenCalledWith(expect.objectContaining({
                role: 'BARBER'
            }));
        });

        it('should hash password before storing', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-user-1',
                username: 'newuser',
                role: 'BARBER',
                name: null
            });

            await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newuser', password: 'plaintextpass' });

            const createCall = dbService.createUser.mock.calls[0][0];
            expect(createCall.password).not.toBe('plaintextpass');
            expect(createCall.password).toMatch(/^\$2b\$12\$/);
        });

        it('should sanitize phone number (remove spaces) before saving', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({ id: 'v-1', username: 'v1', role: 'BARBER' });

            await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'reg_barber_1', password: 'password123', phone: '0532 444 55 66' });

            const createCall = dbService.createUser.mock.calls[0][0];
            expect(createCall.phone).toBe('05324445566');
        });

        it('should return 400 if phone is not 11 digits', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'reg_barber_2', password: 'password123', phone: '0532123456' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('11 haneli');
        });

        it('should return 400 if phone does not start with 05', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'reg_barber_3', password: 'password123', phone: '15321234567' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('05 ile başlamalıdır');
        });
    });

    // ==================== GET ME ====================
    describe('GET /api/auth/me', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('should return 404 if user not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Kullanıcı bulunamadı.');
        });

        it('should return 200 with user data', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'admin-1',
                username: 'admin',
                role: 'ADMIN',
                name: 'Admin User',
                phone: '05321234567',
                isActive: true,
                createdAt: new Date('2026-01-01')
            });

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('admin-1');
            expect(res.body.username).toBe('admin');
            expect(res.body.role).toBe('ADMIN');
            expect(res.body.name).toBe('Admin User');
            expect(res.body.phone).toBe('05321234567');
            expect(res.body.isActive).toBe(true);
        });
    });

    // ==================== UPDATE PROFILE ====================
    describe('PUT /api/auth/profile', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .send({ name: 'New Name' });

            expect(res.status).toBe(401);
        });

        it('should return 200 with updated user data', async () => {
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                role: 'BARBER',
                name: 'Updated Name',
                phone: '05329876543'
            });

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ name: 'Updated Name', phone: '05329876543' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.name).toBe('Updated Name');
            expect(res.body.user.phone).toBe('05329876543');
        });

        it('should sanitize phone number during profile update', async () => {
            dbService.updateUser.mockResolvedValue({ id: 'barber-1', phone: '05329998877' });

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ phone: '0532 999 88 77' });

            expect(res.status).toBe(200);
            const updateCall = dbService.updateUser.mock.calls[0][1];
            expect(updateCall.phone).toBe('05329998877');
        });

        it('should return 400 for invalid phone during profile update', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ phone: '123' });

            expect(res.status).toBe(400);
        });
    });

    // ==================== TOGGLE USER STATUS ====================
    describe('PATCH /api/auth/users/:id/toggle', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .patch('/api/auth/users/barber-1/toggle')
                .send({ isActive: false });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to toggle', async () => {
            const res = await request(app)
                .patch('/api/auth/users/barber-1/toggle')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(403);
        });

        it('should return 404 if user not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/auth/users/nonexistent/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Kullanıcı bulunamadı.');
        });

        it('should return 400 if admin tries to toggle own account', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'admin-1',
                username: 'admin',
                role: 'ADMIN',
                isActive: true
            });

            const res = await request(app)
                .patch('/api/auth/users/admin-1/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kendi hesabınızı pasif yapamazsınız.');
        });

        it('should return 200 on successful toggle', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                role: 'BARBER',
                name: 'Barber One',
                isActive: false
            });

            const res = await request(app)
                .patch('/api/auth/users/barber-1/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: false });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.isActive).toBe(false);
        });
    });
});
