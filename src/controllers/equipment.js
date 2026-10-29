
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const getPagination = require('../utils/pagination');

async function createEquipment(req, res) {
    try {
        if (req.body.availableUnits !== undefined) {
            return res.status(400).json({
                error: 'Las unidades disponibles se asignan automáticamente'
            });
        }

        const equipment = await Equipment.create(req.body);
        res.status(201).json({ data: equipment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getEquipment(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['name', 'availableUnits', 'createdAt'],
            'name'
        );

        const search = req.query.search || '';

        const filter = {
            name: { $regex: search, $options: 'i' }
        };

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.available === 'true') {
            filter.availableUnits = { $gt: 0 };
        }

        const total = await Equipment.countDocuments(filter);

        const equipment = await Equipment.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: equipment,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getEquipmentStats(req, res) {
    try {
        const stats = await Equipment.aggregate([
            {
                $group: {
                    _id: '$category',
                    totalUnits: { $sum: '$totalUnits' },
                    availableUnits: { $sum: '$availableUnits' }
                }
            }
        ]);

        res.json({ data: stats });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getEquipmentById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        res.json({ data: equipment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function updateEquipment(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        if (req.body.availableUnits !== undefined) {
            return res.status(400).json({
                error: 'No se pueden modificar directamente las unidades disponibles'
            });
        }

        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        const borrowedUnits = equipment.totalUnits - equipment.availableUnits;

        if (req.body.totalUnits !== undefined) {
            if (!Number.isInteger(req.body.totalUnits) || req.body.totalUnits < 1) {
                return res.status(400).json({ error: 'Cantidad total inválida' });
            }

            if (req.body.totalUnits < borrowedUnits) {
                return res.status(409).json({
                    error: 'El total no puede ser menor que las unidades prestadas'
                });
            }

            equipment.availableUnits += req.body.totalUnits - equipment.totalUnits;
            equipment.totalUnits = req.body.totalUnits;
        }

        if (req.body.name !== undefined) {
            equipment.name = req.body.name;
        }

        if (req.body.category !== undefined) {
            equipment.category = req.body.category;
        }

        await equipment.save();
        res.json({ data: equipment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function deleteEquipment(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        if (equipment.availableUnits < equipment.totalUnits) {
            return res.status(409).json({
                error: 'No se puede eliminar un equipo con unidades prestadas'
            });
        }

        await equipment.deleteOne();
        res.json({ data: equipment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    createEquipment,
    getEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    getEquipmentStats
};
