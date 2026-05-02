const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../services/db.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');
const { photoUpload } = require('../middlewares/upload.middleware');
const { sanitizePhone } = require('../utils/validators');

// Get all active barbers (public)
router.get('/', async (req, res) => {
    try {
        const barbers = await db.getActiveBarbers();
        // Don't return password
        const safeBarbers = barbers.map(b => ({
            id: b.id,
            username: b.username,
            name: b.name,
            phone: b.phone,
            photoUrl: b.photoUrl,
            isActive: b.isActive,
            level: b.level,
            createdAt: b.createdAt
        }));
        res.json(safeBarbers);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Get all barbers including inactive (admin only)
router.get('/all', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    try {
        const users = await db.getAllUsers();
        const barbers = users.filter(u => u.role === 'BARBER');
        const safeBarbers = barbers.map(b => ({
            id: b.id,
            username: b.username,
            name: b.name,
            phone: b.phone,
            photoUrl: b.photoUrl,
            isActive: b.isActive,
            level: b.level,
            createdAt: b.createdAt
        }));
        res.json(safeBarbers);
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Get single barber (admin or owner)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const barber = await db.findUserById(req.params.id);
        if (!barber || barber.role !== 'BARBER')
            return res.status(404).json({ error: 'Berber bulunamadı.' });

        // Barber can only view their own profile
        if (req.user.role === 'BARBER' && barber.id !== req.user.id)
            return res.status(403).json({ error: 'Yetkiniz yok.' });

        res.json({
            id: barber.id,
            username: barber.username,
            name: barber.name,
            phone: barber.phone,
            photoUrl: barber.photoUrl,
            isActive: barber.isActive,
            level: barber.level,
            createdAt: barber.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Create new barber (admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), photoUpload.single('photo'), async (req, res) => {
    const { username, password, name, phone, level } = req.body;
    const cleanPhone = phone ? sanitizePhone(String(phone)) : null;

    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter.' });
    if (cleanPhone && cleanPhone.length !== 11)
        return res.status(400).json({ error: 'Telefon numarası 11 haneli olmalıdır.' });
    if (cleanPhone && !cleanPhone.startsWith('05'))
        return res.status(400).json({ error: 'Telefon numarası 05 ile başlamalıdır.' });

    const ALLOWED_LEVELS = Object.values(db.Level);
    if (level !== undefined && !ALLOWED_LEVELS.includes(level))
        return res.status(400).json({ error: `Geçersiz seviye. İzin verilenler: ${ALLOWED_LEVELS.join(', ')}` });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten var.' });

        const hash = await bcrypt.hash(password, 12);
        const barber = await db.createUser({
            username,
            password: hash,
            role: 'BARBER',
            name: name || null,
            phone: cleanPhone,
            photoUrl: req.file ? '/uploads/' + req.file.filename : null,
            level: level || 'SENIOR',
            isActive: true
        });

        res.status(201).json({
            success: true,
            barber: {
                id: barber.id,
                username: barber.username,
                name: barber.name,
                phone: barber.phone,
                photoUrl: barber.photoUrl,
                level: barber.level,
                isActive: barber.isActive
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Update barber (admin or self)
router.put('/:id', authMiddleware, photoUpload.single('photo'), async (req, res) => {
    const { id } = req.params;
    const { name, phone, password, level, username } = req.body;
    const cleanPhone = phone ? sanitizePhone(String(phone)) : undefined;

    if (cleanPhone && cleanPhone.length !== 11)
        return res.status(400).json({ error: 'Telefon numarası 11 haneli olmalıdır.' });
    if (cleanPhone && !cleanPhone.startsWith('05'))
        return res.status(400).json({ error: 'Telefon numarası 05 ile başlamalıdır.' });
    if (password && password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter.' });

    try {
        const barber = await db.findUserById(id);
        if (!barber || barber.role !== 'BARBER')
            return res.status(404).json({ error: 'Berber bulunamadı.' });

        // Only admin or self can update
        if (req.user.role !== 'ADMIN' && req.user.id !== id)
            return res.status(403).json({ error: 'Yetkiniz yok.' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (username !== undefined) {
            if (username !== barber.username && await db.usernameExists(username)) {
                return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda.' });
            }
            updateData.username = username;
        }
        if (phone !== undefined) updateData.phone = cleanPhone;
        if (level !== undefined) {
            const ALLOWED_LEVELS = Object.values(db.Level);
            if (!ALLOWED_LEVELS.includes(level))
                return res.status(400).json({ error: `Geçersiz seviye. İzin verilenler: ${ALLOWED_LEVELS.join(', ')}` });
            updateData.level = level;
        }
        if (password) updateData.password = await bcrypt.hash(password, 12);
        if (req.file) updateData.photoUrl = '/uploads/' + req.file.filename;

        const updated = await db.updateUser(id, updateData);

        res.json({
            success: true,
            barber: {
                id: updated.id,
                username: updated.username,
                name: updated.name,
                phone: updated.phone,
                photoUrl: updated.photoUrl,
                isActive: updated.isActive,
                level: updated.level
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Delete barber (admin only - soft delete)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    const { id } = req.params;

    try {
        const barber = await db.findUserById(id);
        if (!barber || barber.role !== 'BARBER')
            return res.status(404).json({ error: 'Berber bulunamadı.' });

        // Cannot delete yourself
        if (barber.id === req.user.id)
            return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz.' });

        // Soft delete - just deactivate
        await db.updateUser(id, { isActive: false });

        res.json({ success: true, message: 'Berber pasif hale getirildi.' });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Toggle barber active status (admin only)
router.patch('/:id/toggle', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    const { id } = req.params;

    try {
        const barber = await db.findUserById(id);
        if (!barber || barber.role !== 'BARBER')
            return res.status(404).json({ error: 'Berber bulunamadı.' });

        // Cannot toggle yourself
        if (barber.id === req.user.id)
            return res.status(400).json({ error: 'Kendi durumunuzu değiştiremezsiniz.' });

        const updated = await db.updateUser(id, { isActive: !barber.isActive });

        res.json({
            success: true,
            barber: {
                id: updated.id,
                username: updated.username,
                name: updated.name,
                isActive: updated.isActive
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
