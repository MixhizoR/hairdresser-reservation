const db = require('../services/db.service');
const { log } = require('../config/logger');

// GET /api/services — public (active only) or admin (all)
const getServices = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'ADMIN';
        const services = isAdmin
            ? await db.getAllServices()
            : await db.getActiveServices();
        res.json(services);
    } catch (err) {
        log('error', 'GET /api/services failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// POST /api/services — admin only
const createService = async (req, res) => {
    const { name, description, price, duration, category, isActive } = req.body;

    // Check for missing fields first
    if (!name || price == null || !duration)
        return res.status(400).json({ error: 'İsim, fiyat ve süre zorunludur.' });

    // Type checks
    if (typeof name !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: name' });
    if (description && typeof description !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: description' });

    if (typeof price !== 'number' || price < 0)
        return res.status(400).json({ error: 'Geçersiz fiyat.' });

    if (typeof duration !== 'number' || duration < 15 || duration % 15 !== 0)
        return res.status(400).json({ error: 'Süre 15 dakikanın katları olmalıdır.' });

    try {
        const service = await db.createService({
            name: name.trim(),
            description: description ? description.trim() : null,
            price,
            duration,
            category: category || 'BARBERING',
            isActive: isActive !== undefined ? isActive : true,
        });
        res.status(201).json({ success: true, service });
    } catch (err) {
        log('error', 'POST /api/services failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// PATCH /api/services/:id — admin only
const updateService = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    // Type checks
    if (name !== undefined && typeof name !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: name' });
    if (description !== undefined && typeof description !== 'string')
        return res.status(400).json({ error: 'Geçersiz veri tipi: description' });

    try {
        const existing = await db.getServiceById(id);
        if (!existing)
            return res.status(404).json({ error: 'Hizmet bulunamadı.' });

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description ? description.trim() : null;
        if (price !== undefined) updateData.price = price;
        if (duration !== undefined) updateData.duration = duration;
        if (category !== undefined) updateData.category = category;
        if (isActive !== undefined) updateData.isActive = isActive;

        const service = await db.updateService(id, updateData);
        res.json({ success: true, service });
    } catch (err) {
        log('error', 'PATCH /api/services/:id failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

// DELETE /api/services/:id — admin only (soft delete)
const deleteService = async (req, res) => {
    const { id } = req.params;

    try {
        const existing = await db.getServiceById(id);
        if (!existing)
            return res.status(404).json({ error: 'Hizmet bulunamadı.' });

        await db.updateService(id, { isActive: false });
        res.json({ success: true, message: 'Hizmet pasif hale getirildi.' });
    } catch (err) {
        log('error', 'DELETE /api/services/:id failed', { err: err.message });
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService,
};
