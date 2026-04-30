const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Service Controller', () => {
    let adminToken;
    let barberToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
        barberToken = jwt.sign({ id: 'barber-1', username: 'barber1', role: 'BARBER' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== GET SERVICES ====================
    describe('GET /api/services', () => {
        it('should return active services for public users', async () => {
            dbService.getActiveServices.mockResolvedValue([
                { id: 'svc-1', name: 'Saç Kesimi', price: 100, duration: 30, isActive: true },
                { id: 'svc-2', name: 'Sakal Kesimi', price: 50, duration: 15, isActive: true }
            ]);

            const res = await request(app).get('/api/services');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(dbService.getActiveServices).toHaveBeenCalled();
            expect(dbService.getAllServices).not.toHaveBeenCalled();
        });

        it('should return active services (GET is always public, admin uses different endpoint)', async () => {
            dbService.getActiveServices.mockResolvedValue([
                { id: 'svc-1', name: 'Saç Kesimi', price: 100, duration: 30, isActive: true },
                { id: 'svc-2', name: 'Sakal Kesimi', price: 50, duration: 15, isActive: false }
            ]);

            const res = await request(app)
                .get('/api/services')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            // GET route has no authMiddleware, so it always returns active services
            expect(dbService.getActiveServices).toHaveBeenCalled();
        });

        it('should return empty array when no services exist', async () => {
            dbService.getActiveServices.mockResolvedValue([]);

            const res = await request(app).get('/api/services');

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    // ==================== CREATE SERVICE ====================
    describe('POST /api/services', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/services')
                .send({ name: 'New Service', price: 100, duration: 30 });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to create', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ name: 'New Service', price: 100, duration: 30 });

            expect(res.status).toBe(403);
        });

        it('should return 400 if name is missing', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 100, duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('İsim, fiyat ve süre zorunludur.');
        });

        it('should return 400 if price is missing', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('İsim, fiyat ve süre zorunludur.');
        });

        it('should return 400 if duration is missing', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: 100 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('İsim, fiyat ve süre zorunludur.');
        });

        it('should return 400 if price is negative', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: -10, duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz fiyat.');
        });

        it('should return 400 if price is not a number', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: 'free', duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz fiyat.');
        });

        it('should return 400 if duration is less than 15', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: 100, duration: 10 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Süre 15 dakikanın katları olmalıdır.');
        });

        it('should return 400 if duration is not a multiple of 15', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: 100, duration: 20 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Süre 15 dakikanın katları olmalıdır.');
        });

        it('should return 201 on successful creation', async () => {
            dbService.createService.mockResolvedValue({
                id: 'svc-new',
                name: 'New Service',
                description: null,
                price: 100,
                duration: 30,
                category: 'BARBERING',
                isActive: true
            });

            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'New Service', price: 100, duration: 30 });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.service.name).toBe('New Service');
            expect(res.body.service.price).toBe(100);
            expect(res.body.service.duration).toBe(30);
        });

        it('should accept price of zero', async () => {
            dbService.createService.mockResolvedValue({
                id: 'svc-free',
                name: 'Free Service',
                price: 0,
                duration: 15,
                isActive: true
            });

            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Free Service', price: 0, duration: 15 });

            expect(res.status).toBe(201);
        });

        it('should trim service name', async () => {
            dbService.createService.mockResolvedValue({
                id: 'svc-1',
                name: 'Trimmed',
                price: 50,
                duration: 15,
                isActive: true
            });

            await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: '  Trimmed  ', price: 50, duration: 15 });

            expect(dbService.createService).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Trimmed'
            }));
        });
    });

    // ==================== UPDATE SERVICE ====================
    describe('PATCH /api/services/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .patch('/api/services/svc-1')
                .send({ name: 'Updated' });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to update', async () => {
            const res = await request(app)
                .patch('/api/services/svc-1')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ name: 'Updated' });

            expect(res.status).toBe(403);
        });

        it('should return 404 if service not found', async () => {
            dbService.getServiceById.mockResolvedValue(null);

            const res = await request(app)
                .patch('/api/services/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated' });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Hizmet bulunamadı.');
        });

        it('should return 200 on successful update', async () => {
            dbService.getServiceById.mockResolvedValue({ id: 'svc-1', name: 'Old Name' });
            dbService.updateService.mockResolvedValue({
                id: 'svc-1',
                name: 'Updated Name',
                price: 150,
                duration: 30,
                isActive: true
            });

            const res = await request(app)
                .patch('/api/services/svc-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name', price: 150 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.service.name).toBe('Updated Name');
        });

        it('should allow partial updates', async () => {
            dbService.getServiceById.mockResolvedValue({ id: 'svc-1', name: 'Old Name' });
            dbService.updateService.mockResolvedValue({
                id: 'svc-1',
                name: 'Old Name',
                price: 200,
                isActive: true
            });

            const res = await request(app)
                .patch('/api/services/svc-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 200 });

            expect(res.status).toBe(200);
            expect(dbService.updateService).toHaveBeenCalledWith('svc-1', expect.objectContaining({
                price: 200
            }));
        });
    });

    // ==================== TYPE SAFETY ====================
    describe('Payload Type Safety', () => {
        it('should return 400 when name is an array in POST', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: [], price: 100, duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz veri tipi: name');
        });

        it('should return 400 when description is an object in POST', async () => {
            const res = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Service', description: {}, price: 100, duration: 30 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz veri tipi: description');
        });

        it('should return 400 when name is a number in PATCH', async () => {
            dbService.getServiceById.mockResolvedValue({ id: 'svc-1', name: 'Old Name' });

            const res = await request(app)
                .patch('/api/services/svc-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 12345 });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz veri tipi: name');
        });

        it('should return 400 when description is null in PATCH', async () => {
            dbService.getServiceById.mockResolvedValue({ id: 'svc-1', name: 'Old Name' });

            const res = await request(app)
                .patch('/api/services/svc-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: null });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Geçersiz veri tipi: description');
        });
    });

    // ==================== DELETE SERVICE ====================
    describe('DELETE /api/services/:id', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app).delete('/api/services/svc-1');
            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to delete', async () => {
            const res = await request(app)
                .delete('/api/services/svc-1')
                .set('Authorization', `Bearer ${barberToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 if service not found', async () => {
            dbService.getServiceById.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/services/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Hizmet bulunamadı.');
        });

        it('should return 200 and soft-delete on success', async () => {
            dbService.getServiceById.mockResolvedValue({ id: 'svc-1', name: 'Service', isActive: true });
            dbService.updateService.mockResolvedValue({ id: 'svc-1', isActive: false });

            const res = await request(app)
                .delete('/api/services/svc-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Hizmet pasif hale getirildi.');
            expect(dbService.updateService).toHaveBeenCalledWith('svc-1', { isActive: false });
        });
    });
});
