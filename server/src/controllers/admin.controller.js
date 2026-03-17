const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

// Login - Tüm kullanıcılar için (admin ve berber)
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

    try {
        const user = await db.findUserByUsername(username);
        const DUMMY = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TUaudr/LQ/r/dJP5CbMDz7yK3HQm';
        const match = await bcrypt.compare(password, user ? user.password : DUMMY);

        if (!user || !match)
            return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });

        // Check if user is active
        if (!user.isActive)
            return res.status(403).json({ error: 'Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (err) {
        log('error', 'POST /api/auth/login failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Register - Sadece admin kullanıcı oluşturabilir
const register = async (req, res) => {
    const { username, password, role, name, phone } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });

    // Validate role
    const allowedRoles = ['ADMIN', 'BARBER'];
    if (role && !allowedRoles.includes(role))
        return res.status(400).json({ error: 'Geçersiz rol. ADMIN veya BARBER olmalıdır.' });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });

        const hash = await bcrypt.hash(password, 12);
        const user = await db.createUser({
            username,
            password: hash,
            role: role || 'BARBER',
            name: name || null,
            phone: phone || null,
            isActive: true
        });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name
            }
        });
    } catch (err) {
        log('error', 'POST /api/auth/register failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Get current user info
const getMe = async (req, res) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user)
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt
        });
    } catch (err) {
        log('error', 'GET /api/auth/me failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Update user profile (for barbers to update their info)
const updateProfile = async (req, res) => {
    const { name, phone } = req.body;

    try {
        const user = await db.updateUser(req.user.id, {
            name: name || undefined,
            phone: phone || undefined
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                phone: user.phone
            }
        });
    } catch (err) {
        log('error', 'PUT /api/auth/profile failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// Toggle user active status (admin only)
const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    try {
        const user = await db.findUserById(id);
        if (!user)
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

        // Cannot deactivate yourself
        if (user.id === req.user.id)
            return res.status(400).json({ error: 'Kendi hesabınızı pasif yapamazsınız.' });

        const updated = await db.updateUser(id, { isActive });

        res.json({
            success: true,
            user: {
                id: updated.id,
                username: updated.username,
                role: updated.role,
                name: updated.name,
                isActive: updated.isActive
            }
        });
    } catch (err) {
        log('error', 'PUT /api/auth/users/:id/toggle failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    login,
    register,
    getMe,
    updateProfile,
    toggleUserStatus
};
