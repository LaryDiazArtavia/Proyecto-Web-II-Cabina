const mongoose = require('mongoose');
const Musician = require('../models/Musician');
const Band = require('../models/Band');
const getPagination = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');
const handleError = require('../utils/handleError');

// Devuelve true si el id de banda es válido y existe
async function bandExists(bandId) {
    if (!mongoose.isValidObjectId(bandId)) {
        return false;
    }
    return (await Band.exists({ _id: bandId })) !== null;
}

async function createMusician(req, res) {
    try {
        if (req.body.band && !(await bandExists(req.body.band))) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        const musician = await Musician.create(req.body);
        res.status(201).json({ data: musician });
    } catch (error) {
        handleError(res, error);
    }
}

async function getMusicians(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['name', 'instrument', 'createdAt'],
            'name'
        );

        const filter = {};

        if (req.query.band) {
            filter.band = req.query.band;
        }

        if (req.query.active !== undefined) {
            if (!['true', 'false'].includes(req.query.active)) {
                return res.status(400).json({ error: 'active debe ser true o false' });
            }
            filter.active = req.query.active === 'true';
        }

        if (req.query.search) {
            const regex = { $regex: escapeRegex(req.query.search), $options: 'i' };
            filter.$or = [{ name: regex }, { email: regex }];
        }

        const total = await Musician.countDocuments(filter);

        const musicians = await Musician.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: musicians,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
}

// Detalle del músico con su banda
async function getMusicianById(req, res) {
    try {
        const musician = await Musician.findById(req.params.id).populate('band');

        if (!musician) {
            return res.status(404).json({ error: 'Músico no encontrado' });
        }

        res.json({ data: musician });
    } catch (error) {
        handleError(res, error);
    }
}

async function updateMusician(req, res) {
    try {
        if (req.body.band && !(await bandExists(req.body.band))) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        const musician = await Musician.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!musician) {
            return res.status(404).json({ error: 'Músico no encontrado' });
        }

        res.json({ data: musician });
    } catch (error) {
        handleError(res, error);
    }
}

async function deleteMusician(req, res) {
    try {
        const musician = await Musician.findByIdAndDelete(req.params.id);

        if (!musician) {
            return res.status(404).json({ error: 'Músico no encontrado' });
        }

        res.json({ data: musician });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    createMusician,
    getMusicians,
    getMusicianById,
    updateMusician,
    deleteMusician
};