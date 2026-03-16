const express = require('express');
const router = express.Router();

const { login, register } = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/login', loginLimiter, login);
router.post('/register', authMiddleware, register);

module.exports = router;
