const express = require('express');
const router = express.Router();

const { getAvailability, getAppointments, createAppointment, updateAppointment } = require('../controllers/appointment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { appointmentLimiter } = require('../middlewares/rateLimit.middleware');

router.get('/availability', getAvailability);
router.get('/', authMiddleware, getAppointments);
router.post('/', appointmentLimiter, createAppointment);
router.patch('/:id', authMiddleware, updateAppointment);

module.exports = router;
