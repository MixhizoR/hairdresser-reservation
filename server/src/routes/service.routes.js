const express = require('express');
const router = express.Router();

const serviceController = require('../controllers/service.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

// Public: get active services
router.get('/', (req, res, next) => {
    serviceController.getServices(req, res, next);
});

// Admin: create service
router.post('/', authMiddleware, requireRole('ADMIN'), (req, res, next) => {
    serviceController.createService(req, res, next);
});

// Admin: update service
router.patch('/:id', authMiddleware, requireRole('ADMIN'), (req, res, next) => {
    serviceController.updateService(req, res, next);
});

// Admin: delete (deactivate) service
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req, res, next) => {
    serviceController.deleteService(req, res, next);
});

module.exports = router;
