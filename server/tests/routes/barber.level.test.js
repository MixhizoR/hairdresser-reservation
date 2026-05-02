const request = require('supertest');
const app = require('../../src/app');
const dbService = require('../../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');

jest.mock('../../src/services/db.service');

describe('Barber Level Validation', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should accept all valid Prisma Level enum values', async () => {
        const validLevels = ['JUNIOR', 'SENIOR', 'MASTER', 'DIRECTOR'];
        
        for (const level of validLevels) {
            dbService.usernameExists.mockResolvedValue(false);
            dbService.createUser.mockResolvedValue({
                id: 'new-barber',
                username: `barber_${level}`,
                role: 'BARBER',
                level: level
            });

            const res = await request(app)
                .post('/api/barbers')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ 
                    username: `barber_${level}`, 
                    password: 'password123',
                    level: level 
                });

            expect(res.status).toBe(201);
            expect(res.body.barber.level).toBe(level);
        }
    });

    it('should reject invalid levels', async () => {
        const res = await request(app)
            .post('/api/barbers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ 
                username: 'invalid_barber', 
                password: 'password123',
                level: 'INVALID_LEVEL' 
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Geçersiz seviye');
    });

    it('should use SENIOR as default if no level provided', async () => {
        dbService.usernameExists.mockResolvedValue(false);
        dbService.createUser.mockResolvedValue({
            id: 'new-barber',
            username: 'default_barber',
            role: 'BARBER',
            level: 'SENIOR'
        });

        const res = await request(app)
            .post('/api/barbers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ 
                username: 'default_barber', 
                password: 'password123'
            });

        expect(res.status).toBe(201);
        expect(res.body.barber.level).toBe('SENIOR');
    });
});
