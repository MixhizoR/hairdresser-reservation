const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../services/db.service');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

// Get all active barbers (public)
router.get('/', async (req, res) => {
    try {
        console.log('[DEBUG] GET /api/barbers called');
        const barbers = await db.getAllBarbers();
        console.log('[DEBUG] Barbers from DB:', barbers, 'Count:', barbers?.length);
        // Don't return password
        const safeBarbers = barbers.map(b => ({
            id: b.id,
            username: b.username,
            name: b.name,
            phone: b.phone,
            isActive: b.isActive,
            createdAt: b.createdAt
        }));
        console.log('[DEBUG] Sending safeBarbers:', safeBarbers);
        res.json(safeBarbers);
    } catch (err) {
        console.error('[DEBUG] Error in GET /api/barbers:', err);
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
            isActive: b.isActive,
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
            isActive: barber.isActive,
            createdAt: barber.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Create new barber (admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
    const { username, password, name, phone } = req.body;

    if (!username || !password)
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli.' });
    if (username.length < 3 || username.length > 30)
        return res.status(400).json({ error: 'Kullanıcı adı 3-30 karakter arasında.' });
    if (password.length < 8)
        return res.status(400).json({ error: 'Şifre en az 8 karakter.' });

    try {
        if (await db.usernameExists(username))
            return res.status(409).json({ error: 'Bu kullanıcı adı zaten var.' });

        const hash = await bcrypt.hash(password, 12);
        const barber = await db.createUser({
            username,
            password: hash,
            role: 'BARBER',
            name: name || null,
            phone: phone || null,
            isActive: true
        });

        res.status(201).json({
            success: true,
            barber: {
                id: barber.id,
                username: barber.username,
                name: barber.name,
                phone: barber.phone,
                isActive: barber.isActive
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// Update barber (admin or self)
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, phone, password } = req.body;

    try {
        const barber = await db.findUserById(id);
        if (!barber || barber.role !== 'BARBER')
            return res.status(404).json({ error: 'Berber bulunamadı.' });

        // Only admin or self can update
        if (req.user.role !== 'ADMIN' && req.user.id !== id)
            return res.status(403).json({ error: 'Yetkiniz yok.' });

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (password) updateData.password = await bcrypt.hash(password, 12);

        const updated = await db.updateUser(id, updateData);

        res.json({
            success: true,
            barber: {
                id: updated.id,
                username: updated.username,
                name: updated.name,
                phone: updated.phone,
                isActive: updated.isActive
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
