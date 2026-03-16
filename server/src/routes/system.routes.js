const express = require('express');
const router = express.Router();

const { getSounds } = require('../controllers/system.controller');

router.get('/sounds', getSounds);

module.exports = router;
