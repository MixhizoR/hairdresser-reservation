const express = require('express');
const router = express.Router({ mergeParams: true });

const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const { appointmentLimiter, trackLimiter } = require('../middlewares/rateLimit.middleware');
const db = require('../services/db.service');
const { log } = require('../config/logger');

router.get('/availability', function (req, res, next) {
    appointmentController.getAvailability(req, res, next);
});

router.get('/track', trackLimiter, function (req, res, next) {
    appointmentController.trackAppointments(req, res, next);
});

router.get('/', authMiddleware, function (req, res, next) {
    appointmentController.getAppointments(req, res, next);
});

router.get('/:id', authMiddleware, function (req, res, next) {
    appointmentController.getAppointment(req, res, next);
});

router.post('/', appointmentLimiter, function (req, res, next) {
    appointmentController.createAppointment(req, res, next);
});

router.post('/cancel', appointmentLimiter, function (req, res, next) {
    appointmentController.cancelAppointment(req, res, next);
});

router.patch('/:id', authMiddleware, function (req, res, next) {
    appointmentController.updateAppointment(req, res, next);
});

router.delete('/:id', authMiddleware, requireRole('ADMIN'), function (req, res, next) {
    appointmentController.deleteAppointment(req, res, next);
});

module.exports = router;
