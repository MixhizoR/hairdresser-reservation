const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Settings Controller', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==================== GET SETTINGS ====================
    describe('GET /api/settings', () => {
        it('should return settings as key-value object', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'salonName', value: '"My Salon"' },
                { key: 'contactPhone', value: '05321234567' }
            ]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.salonName).toBe('My Salon');
            expect(res.body.contactPhone).toBe('05321234567');
        });

        it('should parse JSON values when possible', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'operatingHours', value: '{"monday":{"open":"09:00","close":"18:00"}}' }
            ]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.operatingHours).toEqual({ monday: { open: '09:00', close: '18:00' } });
        });

        it('should return raw string when JSON parsing fails', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'plainValue', value: 'just-a-string' }
            ]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.plainValue).toBe('just-a-string');
        });

        it('should return empty object when no settings exist', async () => {
            dbService.getAllSettings.mockResolvedValue([]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({});
        });

        it('should be accessible without authentication', async () => {
            dbService.getAllSettings.mockResolvedValue([]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
        });
    });

    // ==================== UPDATE SETTINGS ====================
    describe('PUT /api/settings', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .put('/api/settings')
                .send({ salonName: 'New Name' });

            expect(res.status).toBe(401);
        });

        it('should return 403 if non-admin tries to update', async () => {
            const barberToken = jwt.sign({ id: 'barber-1', role: 'BARBER' }, JWT_SECRET);

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ shopName: 'New Name' });

            expect(res.status).toBe(403);
        });

        it('should return 400 if body is not an object', async () => {
            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send('not-an-object');

            expect(res.status).toBe(400);
        });

        it('should return 200 and upsert settings on success', async () => {
            dbService.upsertSetting.mockResolvedValue({ key: 'shopName', value: 'New Salon' });

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ shopName: 'New Salon', shopPhone: '05329876543' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.settings.shopName).toBe('New Salon');
            expect(res.body.settings.shopPhone).toBe('05329876543');
        });

        it('should JSON-stringify object values', async () => {
            dbService.upsertSetting.mockResolvedValue({ key: 'operatingHours', value: '{}' });

            await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ operatingHours: { monday: { open: '09:00' } } });

            expect(dbService.upsertSetting).toHaveBeenCalledWith('operatingHours', '{"monday":{"open":"09:00"}}');
        });

        it('should convert non-object values to strings', async () => {
            dbService.upsertSetting.mockResolvedValue({ key: 'maxAdvanceBookingDays', value: '10' });

            await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ maxAdvanceBookingDays: 10 });

            expect(dbService.upsertSetting).toHaveBeenCalledWith('maxAdvanceBookingDays', '10');
        });
    });
});
