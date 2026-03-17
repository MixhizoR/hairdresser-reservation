const express = require('express');
const router = express.Router();

const { login, register, getMe, updateProfile, toggleUserStatus } = require('../controllers/admin.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');

// Auth routes
router.post('/login', loginLimiter, login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

// Register new user (admin only)
router.post('/register', authMiddleware, requireRole('ADMIN'), register);

// User management (admin only)
router.patch('/users/:id/toggle', authMiddleware, requireRole('ADMIN'), toggleUserStatus);

// Dashboard stats (admin only)
router.get('/dashboard', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    const db = require('../services/db.service');
    try {
        const stats = await db.getDashboardStats();

        // Get recent appointments
        const appointments = await db.getAppointments();
        const recent = appointments.slice(0, 10);

        // Get all barbers
        const barbers = await db.getAllBarbers();

        res.json({
            stats,
            recentAppointments: recent,
            barbers
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
