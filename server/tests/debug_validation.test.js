const request = require('supertest');
const app = require('../src/app');
const dbService = require('../src/services/db.service');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');

jest.mock('../src/services/db.service');

describe('Debug Phone Validation', () => {
    let adminToken;

    beforeAll(() => {
        adminToken = jwt.sign({ id: 'admin-1', username: 'admin', role: 'ADMIN' }, JWT_SECRET);
    });

    it('should debug why phone sanitization fails', async () => {
        dbService.usernameExists.mockResolvedValue(false);
        dbService.createUser.mockResolvedValue({ id: 'v-1', username: 'validusername', isActive: true });

        const res = await request(app)
            .post('/api/barbers')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ username: 'validusername', password: 'password123', phone: '0532 444 55 66' });

        console.log('Response Status:', res.status);
        console.log('Response Body:', res.body);

        expect(res.status).toBe(201);
        expect(dbService.createUser).toHaveBeenCalled();
        const createCall = dbService.createUser.mock.calls[0][0];
        expect(createCall.phone).toBe('05324445566');
    });
});
