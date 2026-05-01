const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Settings Routes (Integration)', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/settings', () => {
        it('should return settings object without authentication', async () => {
            dbService.getAllSettings.mockResolvedValue([
                { key: 'salonName', value: '"Test Salon"' },
                { key: 'contactPhone', value: '05321234567' },
                { key: 'workingHours', value: '{"open":"09:00","close":"18:00"}' }
            ]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.salonName).toBe('Test Salon');
            expect(res.body.contactPhone).toBe('05321234567');
            expect(res.body.workingHours).toEqual({ open: '09:00', close: '18:00' });
        });

        it('should return empty object when no settings configured', async () => {
            dbService.getAllSettings.mockResolvedValue([]);

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({});
        });
    });

    describe('PUT /api/settings', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .put('/api/settings')
                .send({ salonName: 'New Name' });

            expect(res.status).toBe(401);
        });

        it('should return 403 for non-admin users', async () => {
            const barberToken = jwt.sign({ id: 'barber-1', role: 'BARBER' }, JWT_SECRET);

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${barberToken}`)
                .send({ shopName: 'New Name' });

            expect(res.status).toBe(403);
        });

        it('should upsert settings for admin', async () => {
            dbService.upsertSetting.mockResolvedValue({ key: 'shopName', value: 'Updated Salon' });

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ shopName: 'Updated Salon' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.settings.shopName).toBe('Updated Salon');
        });

        it('should handle multiple settings at once', async () => {
            dbService.upsertSetting.mockResolvedValue({ key: 'test', value: 'value' });

            const res = await request(app)
                .put('/api/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    shopName: 'Multi Update',
                    shopPhone: '05321234567',
                    appointmentDuration: '30'
                });

            expect(res.status).toBe(200);
            expect(dbService.upsertSetting).toHaveBeenCalledTimes(3);
        });
    });
});
