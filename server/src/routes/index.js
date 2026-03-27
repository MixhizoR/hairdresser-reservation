const express = require('express');
const router = express.Router();

const appointmentRoutes = require('./appointment.routes');
const adminRoutes = require('./admin.routes');
const barberRoutes = require('./barber.routes');
const serviceRoutes = require('./service.routes');
const settingsRoutes = require('./settings.routes');
const soundRoutes = require('./sound.routes');

router.use('/appointments', appointmentRoutes);
router.use('/auth', adminRoutes);        // /api/auth/* (login, register, me)
router.use('/barbers', barberRoutes);    // /api/barbers/*
router.use('/services', serviceRoutes);  // /api/services/*
router.use('/settings', settingsRoutes); // /api/settings/*
router.use('/sounds', soundRoutes);      // /api/sounds/*

module.exports = router;
