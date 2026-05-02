const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');
const { log } = require('../config/logger');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { sanitizePhone } = require('../utils/validators');

// Login - Tüm kullanıcılar için (admin ve berber)
const login = async (req, res) => {
    const { username, password } = req.body;

    // Check for missing fields first
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

    // Type checks
    if (typeof username !== 'string' || typeof password !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: username/password' });

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
    const { username, password, role, name, phone, level } = req.body;

    // Check for missing fields first
    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });

    // Type checks
    if (typeof username !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: username' });
    if (typeof password !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: password' });
    if (name && typeof name !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: name' });

    const cleanPhone = phone ? sanitizePhone(String(phone)) : null;
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında olmalıdır.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter olmalıdır.' });
    if (cleanPhone && cleanPhone.length !== 11)
        return res.status(400).json({ error: 'Telefon numarası 11 haneli olmalıdır.' });
    if (cleanPhone && !cleanPhone.startsWith('05'))
        return res.status(400).json({ error: 'Telefon numarası 05 ile başlamalıdır.' });

    // Validate role
    const allowedRoles = ['ADMIN', 'BARBER'];
    if (role && !allowedRoles.includes(role))
        return res.status(400).json({ error: 'Geçersiz rol. ADMIN veya BARBER olmalıdır.' });

    // Validate level
    const allowedLevels = Object.values(db.Level);
    if (level && !allowedLevels.includes(level))
        return res.status(400).json({ error: `Geçersiz seviye. İzin verilenler: ${allowedLevels.join(', ')}` });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });

        const hash = await bcrypt.hash(password, 12);
        const user = await db.createUser({
            username,
            password: hash,
            role: role || 'BARBER',
            name: name || null,
            phone: cleanPhone,
            level: level || 'SENIOR',
            isActive: true
        });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                level: user.level
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
            level: user.level,
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
    const cleanPhone = phone ? sanitizePhone(String(phone)) : undefined;

    if (cleanPhone && cleanPhone.length !== 11)
        return res.status(400).json({ error: 'Telefon numarası 11 haneli olmalıdır.' });
    if (cleanPhone && !cleanPhone.startsWith('05'))
        return res.status(400).json({ error: 'Telefon numarası 05 ile başlamalıdır.' });

    try {
        const updatePayload = {};
        if (name) updatePayload.name = name;
        if (phone !== undefined) updatePayload.phone = cleanPhone ?? null;

        const user = await db.updateUser(req.user.id, updatePayload);

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

    if (typeof isActive !== 'boolean')
        return res.status(400).json({ error: 'isActive alanı boolean olmalıdır.' });

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
