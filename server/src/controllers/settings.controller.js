const db = require('../services/db.service');
const { log } = require('../config/logger');

// GET /api/settings — public
const getSettings = async (req, res) => {
    try {
        const settings = await db.getAllSettings();
        const result = {};
        for (const s of settings) {
            try {
                result[s.key] = JSON.parse(s.value);
            } catch {
                result[s.key] = s.value;
            }
        }
        res.json(result);
    } catch (err) {
        log('error', 'GET /api/settings failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// PUT /api/settings — admin only
const updateSettings = async (req, res) => {
    const updates = req.body;

    if (!updates || typeof updates !== 'object')
        return res.status(400).json({ error: 'Geçersiz veri.' });

    try {
        const results = {};
        for (const [key, value] of Object.entries(updates)) {
            const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
            await db.upsertSetting(key, stored);
            results[key] = value;
        }
        res.json({ success: true, settings: results });
    } catch (err) {
        log('error', 'PUT /api/settings failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
