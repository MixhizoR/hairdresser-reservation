const express = require('express');
const router = express.Router();

const notificationSoundController = require('../controllers/notificationSound.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { soundUpload } = require('../middlewares/upload.middleware');

// Get current user's notification sound preference
router.get('/', authMiddleware, (req, res, next) => {
    notificationSoundController.getNotificationSound(req, res, next);
});

// Save/update notification sound preference
router.post('/', authMiddleware, (req, res, next) => {
    notificationSoundController.saveNotificationSound(req, res, next);
});

// Upload new sound file
router.post('/upload', authMiddleware, soundUpload.single('sound'), (req, res, next) => {
    notificationSoundController.uploadNotificationSound(req, res, next);
});

// Update notification sound preference only
router.put('/', authMiddleware, (req, res, next) => {
    notificationSoundController.updateNotificationSound(req, res, next);
});

// Delete uploaded sound
router.delete('/:filename', authMiddleware, (req, res, next) => {
    notificationSoundController.deleteNotificationSound(req, res, next);
});

module.exports = router;
