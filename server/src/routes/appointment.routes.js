const express = require('express');
const router = express.Router({ mergeParams: true });

const appointmentController = require('../controllers/appointment.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

router.get('/availability', function (req, res, next) {
    appointmentController.getAvailability(req, res, next);
});

router.get('/', authMiddleware, function (req, res, next) {
    appointmentController.getAppointments(req, res, next);
});

router.get('/:id', authMiddleware, function (req, res, next) {
    appointmentController.getAppointment(req, res, next);
});

router.post('/', function (req, res, next) {
    appointmentController.createAppointment(req, res, next);
});

router.patch('/:id', authMiddleware, function (req, res, next) {
    appointmentController.updateAppointment(req, res, next);
});

router.delete('/:id', authMiddleware, requireRole('ADMIN'), function (req, res, next) {
    appointmentController.deleteAppointment(req, res, next);
});

module.exports = router;
