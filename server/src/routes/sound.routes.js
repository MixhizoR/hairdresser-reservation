const express = require('express');
const router = express.Router();

const soundController = require('../controllers/sound.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');
const { soundUpload } = require('../middlewares/upload.middleware');

// Public: list sounds
router.get('/', (req, res, next) => {
    soundController.getSounds(req, res, next);
});

// Admin: upload sound
router.post('/upload', authMiddleware, requireRole('ADMIN'), soundUpload.single('sound'), (req, res, next) => {
    soundController.uploadSound(req, res, next);
});

// Admin: delete sound
router.delete('/:filename', authMiddleware, requireRole('ADMIN'), (req, res, next) => {
    soundController.deleteSound(req, res, next);
});

module.exports = router;
