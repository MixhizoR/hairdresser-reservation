const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        // decoded will now have: { id, username, role, iat, exp }
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
};

// Role-based access control middleware
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Bu işlem için yetkiniz yok.',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
};

// Check if user is owner of resource or admin
const requireOwnerOrAdmin = (resourceUserIdField) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
        }

        // Admin can do anything
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
        if (resourceUserId && resourceUserId !== req.user.id) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    requireRole,
    requireOwnerOrAdmin
};
