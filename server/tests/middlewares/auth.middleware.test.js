const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../src/config/env');
const { authMiddleware, requireRole, requireOwnerOrAdmin } = require('../../src/middlewares/auth.middleware');

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    // ==================== authMiddleware ====================
    describe('authMiddleware', () => {
        it('should return 401 if no authorization header', () => {
            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Yetkilendirme gerekli.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header does not start with Bearer', () => {
            req.headers.authorization = 'Basic sometoken';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Yetkilendirme gerekli.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', () => {
            req.headers.authorization = 'Bearer invalid-token';

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Geçersiz veya süresi dolmuş token.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is expired', () => {
            const expiredToken = jwt.sign(
                { id: 'user-1', role: 'ADMIN' },
                JWT_SECRET,
                { expiresIn: '-1s' }
            );
            req.headers.authorization = `Bearer ${expiredToken}`;

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Geçersiz veya süresi dolmuş token.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should set req.user and call next for valid token', () => {
            const token = jwt.sign(
                { id: 'user-1', username: 'admin', role: 'ADMIN' },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.id).toBe('user-1');
            expect(req.user.username).toBe('admin');
            expect(req.user.role).toBe('ADMIN');
        });

        it('should return 401 if token is signed with wrong secret', () => {
            const token = jwt.sign(
                { id: 'user-1', role: 'ADMIN' },
                'wrong-secret',
                { expiresIn: '1h' }
            );
            req.headers.authorization = `Bearer ${token}`;

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    // ==================== requireRole ====================
    describe('requireRole', () => {
        it('should return 401 if req.user is not set', () => {
            const middleware = requireRole('ADMIN');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Yetkilendirme gerekli.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 if user role is not in allowed roles', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            const middleware = requireRole('ADMIN');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Bu işlem için yetkiniz yok.',
                required: ['ADMIN'],
                current: 'BARBER'
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next if user role matches', () => {
            req.user = { id: 'admin-1', role: 'ADMIN' };
            const middleware = requireRole('ADMIN');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should allow multiple roles', () => {
            req.user = { id: 'barber-1', role: 'BARBER' };
            const middleware = requireRole('ADMIN', 'BARBER');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should reject if role not in multiple allowed roles', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            const middleware = requireRole('ADMIN', 'SUPERVISOR');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });

    // ==================== requireOwnerOrAdmin ====================
    describe('requireOwnerOrAdmin', () => {
        it('should return 401 if req.user is not set', () => {
            req.body = {};
            req.params = {};
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next for admin regardless of resource ownership', () => {
            req.user = { id: 'admin-1', role: 'ADMIN' };
            req.body = { userId: 'other-user' };
            req.params = {};
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should call next if user owns the resource (from body)', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            req.body = { userId: 'user-1' };
            req.params = {};
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should call next if user owns the resource (from params)', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            req.body = {};
            req.params = { userId: 'user-1' };
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user does not own the resource', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            req.body = { userId: 'other-user' };
            req.params = {};
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Bu işlem için yetkiniz yok.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next if resource field is not present (no restriction)', () => {
            req.user = { id: 'user-1', role: 'BARBER' };
            req.body = {};
            req.params = {};
            const middleware = requireOwnerOrAdmin('userId');

            middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
