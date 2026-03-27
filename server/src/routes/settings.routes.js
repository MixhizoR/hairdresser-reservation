const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settings.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

// Public: get settings
router.get('/', (req, res, next) => {
    settingsController.getSettings(req, res, next);
});

// Admin: update settings
router.put('/', authMiddleware, requireRole('ADMIN'), (req, res, next) => {
    settingsController.updateSettings(req, res, next);
});

module.exports = router;
