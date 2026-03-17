const express = require('express');
const router = express.Router();

const appointmentRoutes = require('./appointment.routes');
const adminRoutes = require('./admin.routes');
const barberRoutes = require('./barber.routes');
const systemRoutes = require('./system.routes');

router.use('/appointments', appointmentRoutes);
router.use('/auth', adminRoutes);        // /api/auth/* (login, register, me)
router.use('/barbers', barberRoutes);    // /api/barbers/*
router.use('/', systemRoutes);            // Mounts /sounds

module.exports = router;
