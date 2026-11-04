const Band = require('../models/Band');
const Musician = require('../models/Musician');
const Booking = require('../models/Booking');
const getPagination = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');
const handleError = require('../utils/handleError');

async function createBand(req, res) {
    try {
        const band = await Band.create(req.body);
        res.status(201).json({ data: band });
    } catch (error) {
        handleError(res, error);
    }
}

async function getBands(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['name', 'createdAt'],
            'name'
        );

        const filter = {};
        if (req.query.search) {
            filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
        }

        const total = await Band.countDocuments(filter);

        const bands = await Band.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: bands,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
}

// Detalle de la banda con sus músicos (populate del virtual)
async function getBandById(req, res) {
    try {
        const band = await Band.findById(req.params.id).populate('musicians');

        if (!band) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        res.json({ data: band });
    } catch (error) {
        handleError(res, error);
    }
}

async function updateBand(req, res) {
    try {
        const band = await Band.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!band) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        res.json({ data: band });
    } catch (error) {
        handleError(res, error);
    }
}

async function deleteBand(req, res) {
    try {
        const band = await Band.findById(req.params.id);

        if (!band) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        const musician = await Musician.findOne({ band: band._id });
        if (musician) {
            return res.status(409).json({
                error: 'No se puede eliminar una banda que tiene músicos'
            });
        }

        const activeBooking = await Booking.findOne({
            band: band._id,
            status: { $in: ['apartada', 'confirmada'] }
        });
        if (activeBooking) {
            return res.status(409).json({
                error: 'No se puede eliminar una banda con reservas activas'
            });
        }

        await band.deleteOne();

        res.json({ data: band });
    } catch (error) {
        handleError(res, error);
    }
}

async function getBandMusicians(req, res) {
    try {
        const band = await Band.findById(req.params.id);

        if (!band) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        const musicians = await Musician.find({ band: band._id }).sort({ name: 1 });

        res.json({ data: musicians });
    } catch (error) {
        handleError(res, error);
    }
}

// Reservas de la banda, con la sala poblada
async function getBandBookings(req, res) {
    try {
        const band = await Band.findById(req.params.id);

        if (!band) {
            return res.status(404).json({ error: 'Banda no encontrada' });
        }

        const bookings = await Booking.find({ band: band._id })
            .sort({ date: 1, startHour: 1 })
            .populate('room');

        res.json({ data: bookings });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    createBand,
    getBands,
    getBandById,
    updateBand,
    deleteBand,
    getBandMusicians,
    getBandBookings
};