const express = require('express');
const router = express.Router();

const appointmentRoutes = require('./appointment.routes');
const adminRoutes = require('./admin.routes');
const systemRoutes = require('./system.routes');

router.use('/appointments', appointmentRoutes);
router.use('/admin', adminRoutes);
router.use('/', systemRoutes); // Mounts /sounds

module.exports = router;
