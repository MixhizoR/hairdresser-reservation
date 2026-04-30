const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Barber Routes (Integration)', () => {
    let adminToken;
    let barberToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
        barberToken = jwt.sign({ id: 'barber-1', username: 'barber1', role: 'BARBER' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== GET /api/barbers (public) ====================
    describe('GET /api/barbers', () => {
        it('should return active barbers without authentication', async () => {
            dbService.getAllBarbers.mockResolvedValue([
                { id: 'barber-1', username: 'barber1', name: 'Barber One', phone: '05321111111', isActive: true, createdAt: new Date() },
                { id: 'barber-2', username: 'barber2', name: 'Barber Two', phone: '05322222222', isActive: true, createdAt: new Date() }
            ]);

            const res = await request(app).get('/api/barbers');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].id).toBe('barber-1');
            expect(res.body[0].name).toBe('Barber One');
            expect(res.body[0].password).toBeUndefined();
        });

        it('should return empty array when no barbers exist', async () => {
            dbService.getAllBarbers.mockResolvedValue([]);

            const res = await request(app).get('/api/barbers');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('should not expose password field', async () => {
            dbService.getAllBarbers.mockResolvedValue([
                { id: 'barber-1', username: 'barber1', name: 'Barber One', phone: '05321111111', isActive: true, password: 'hashed', createdAt: new Date() }
            ]);

            const res = await request(app).get('/api/barbers');

            expect(res.body[0].password).toBeUndefined();
        });
    });

    // ==================== GET /api/barbers/all (admin) ====================
    describe('GET /api/barbers/all', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/barbers/all');
            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to access', async () => {
            const res = await request(app)
                .get('/api/barbers/all')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
        });

        it('should return all barbers including inactive for admin', async () => {
            dbService.getAllUsers.mockResolvedValue([
                { id: 'barber-1', username: 'barber1', role: 'BARBER', name: 'Active', isActive: true, createdAt: new Date() },
                { id: 'barber-2', username: 'barber2', role: 'BARBER', name: 'Inactive', isActive: false, createdAt: new Date() },
                { id: 'admin-1', username: 'admin', role: 'ADMIN', name: 'Admin', isActive: true, createdAt: new Date() }
            ]);

            const res = await request(app)
                .get('/api/barbers/all')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body.find(b => b.name === 'Inactive')).toBeDefined();
        });
    });

    // ==================== GET /api/barbers/:id ====================
    describe('GET /api/barbers/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).get('/api/barbers/barber-1');
            expect(res.status).toBe(401);
        });

        it('should return 404 if barber not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/barbers/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Berber bulunamadı.');
        });

        it('should return 404 if user exists but is not a barber', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'admin-1',
                role: 'ADMIN',
                username: 'admin'
            });

            const res = await request(app)
                .get('/api/barbers/admin-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Berber bulunamadı.');
        });

        it('should return 403 if barber tries to view another barber', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-2',
                role: 'BARBER',
                username: 'barber2',
                isActive: true
            });

            const res = await request(app)
                .get('/api/barbers/barber-2')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Yetkiniz yok.');
        });

        it('should allow barber to view own profile', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                username: 'barber1',
                name: 'Barber One',
                isActive: true,
                createdAt: new Date()
            });

            const res = await request(app)
                .get('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('barber-1');
            expect(res.body.password).toBeUndefined();
        });

        it('should allow admin to view any barber', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                username: 'barber1',
                name: 'Barber One',
                isActive: true,
                createdAt: new Date()
            });

            const res = await request(app)
                .get('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe('barber-1');
        });
    });

    // ==================== POST /api/barbers ====================
    describe('POST /api/barbers', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .send({ username: 'newbarber', password: 'testpass123' });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to create', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ username: 'newbarber', password: 'testpass123' });

            expect(res.status).toBe(403);
        });

        it('should return 400 if username is missing', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newbarber' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı ve şifre gerekli.');
        });

        it('should return 400 if username is too short', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'ab', password: 'testpass123' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kullanıcı adı 3-30 karakter arasında.');
        });

        it('should return 400 if password is too short', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newbarber', password: 'short' });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Şifre en az 8 karakter.');
        });

        it('should return 409 if username already exists', async () => {
            dbService.usernameExists.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'existingbarber', password: 'testpass123' });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe('Bu kullanıcı adı zaten var.');
        });

        it('should return 201 on successful creation', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-barber',
                username: 'newbarber',
                name: 'New Barber',
                phone: '05321234567',
                isActive: true,
                role: 'BARBER'
            });

            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newbarber', password: 'testpass123', name: 'New Barber', phone: '05321234567' });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.barber.username).toBe('newbarber');
            expect(res.body.barber.name).toBe('New Barber');
            expect(res.body.barber.password).toBeUndefined();
        });

        it('should hash password before storing', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-barber',
                username: 'newbarber',
                isActive: true,
                role: 'BARBER'
            });

            await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'newbarber', password: 'plaintext123' });

            const createCall = dbService.createUser.mock.calls[0][0];
            expect(createCall.password).not.toBe('plaintext123');
            expect(createCall.password).toMatch(/^\$2b\$12\$/);
            expect(createCall.role).toBe('BARBER');
        });
    });

    // ==================== Validation Tests ====================
    describe('Validation', () => {
        it('should sanitize phone number (remove spaces) before saving', async () => {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({ id: 'v-1', username: 'v1', isActive: true, role: 'BARBER' });

            await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'valid_barber_1', password: 'password123', phone: '0532 444 55 66' });

            const createCall = dbService.createUser.mock.calls[0][0];
            expect(createCall.phone).toBe('05324445566');
        });

        it('should return 400 if phone is not 11 digits', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'valid_barber_2', password: 'password123', phone: '0532123456' }); // 10 digits

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('11 haneli');
        });

        it('should return 400 if phone does not start with 05', async () => {
            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'valid_barber_3', password: 'password123', phone: '15321234567' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('05 ile başlamalıdır');
        });
    });

    // ==================== DELETE /api/barbers/:id ====================
    describe('DELETE /api/barbers/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).delete('/api/barbers/barber-1');
            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to delete', async () => {
            const res = await request(app)
                .delete('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 if barber not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/barbers/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Berber bulunamadı.');
        });

        it('should return 400 if admin tries to delete own account', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'admin-1',
                role: 'BARBER'
            });

            const res = await request(app)
                .delete('/api/barbers/admin-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kendi hesabınızı silemezsiniz.');
        });

        it('should return 200 and soft-delete on success', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({ id: 'barber-1', isActive: false });

            const res = await request(app)
                .delete('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Berber pasif hale getirildi.');
            expect(dbService.updateUser).toHaveBeenCalledWith('barber-1', { isActive: false });
        });
    });

    // ==================== PATCH /api/barbers/:id/toggle ====================
    describe('PATCH /api/barbers/:id/toggle', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .patch('/api/barbers/barber-1/toggle')
                .send({});

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to toggle', async () => {
            const res = await request(app)
                .patch('/api/barbers/barber-1/toggle')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({});

            expect(res.status).toBe(403);
        });

        it('should return 404 if barber not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/barbers/nonexistent/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Berber bulunamadı.');
        });

        it('should return 400 if admin tries to toggle own account', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'admin-1',
                role: 'BARBER',
                isActive: true
            });

            const res = await request(app)
                .patch('/api/barbers/admin-1/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Kendi durumunuzu değiştiremezsiniz.');
        });

        it('should toggle active status on success', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                name: 'Barber One',
                isActive: false
            });

            const res = await request(app)
                .patch('/api/barbers/barber-1/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.barber.isActive).toBe(false);
            expect(dbService.updateUser).toHaveBeenCalledWith('barber-1', { isActive: false });
        });

        it('should toggle from inactive to active', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: false
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                name: 'Barber One',
                isActive: true
            });

            const res = await request(app)
                .patch('/api/barbers/barber-1/toggle')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.barber.isActive).toBe(true);
            expect(dbService.updateUser).toHaveBeenCalledWith('barber-1', { isActive: true });
        });
    });

    // ==================== PUT /api/barbers/:id ====================
    describe('PUT /api/barbers/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .put('/api/barbers/barber-1')
                .send({ name: 'Updated' });

            expect(res.status).toBe(401);
        });

        it('should return 404 if barber not found', async () => {
            dbService.findUserById.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/barbers/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Berber bulunamadı.');
        });

        it('should return 403 if barber tries to update another barber', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-2',
                role: 'BARBER',
                isActive: true
            });

            const res = await request(app)
                .put('/api/barbers/barber-2')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ name: 'Hacked' });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe('Yetkiniz yok.');
        });

        it('should allow barber to update own profile', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                name: 'Updated Name',
                isActive: true
            });

            const res = await request(app)
                .put('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ name: 'Updated Name' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.barber.name).toBe('Updated Name');
        });

        it('should allow admin to update any barber', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                name: 'Admin Updated',
                phone: '05329999999',
                isActive: true
            });

            const res = await request(app)
                .put('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Admin Updated', phone: '05329999999' });

            expect(res.status).toBe(200);
            expect(res.body.barber.name).toBe('Admin Updated');
        });

        it('should hash password when updating', async () => {
            dbService.findUserById.mockResolvedValue({
                id: 'barber-1',
                role: 'BARBER',
                isActive: true
            });
            dbService.updateUser.mockResolvedValue({
                id: 'barber-1',
                username: 'barber1',
                isActive: true
            });

            await request(app)
                .put('/api/barbers/barber-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ password: 'newpassword123' });

            const updateCall = dbService.updateUser.mock.calls[0][1];
            expect(updateCall.password).not.toBe('newpassword123');
            expect(updateCall.password).toMatch(/^\$2b\$12\$/);
        });
    });
});
