const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

    try {
        const admin = await db.findAdmin(username);
        const DUMMY = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TUaudr/LQ/r/dJP5CbMDz7yK3HQm';
        const match = await bcrypt.compare(password, admin ? admin.password : DUMMY);

        if (!admin || !match)
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, token, username: admin.username });
    } catch (err) {
        log('error', 'POST /api/admin/login failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });

        const hash = await bcrypt.hash(password, 12);
        const admin = await db.createAdmin(username, hash);
        res.status(201).json({ success: true, username: admin.username });
    } catch (err) {
        log('error', 'POST /api/admin/register failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    login,
    register,
};
