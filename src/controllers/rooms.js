
const Room = require('../models/Room');
const getPagination = require('../utils/pagination');
const Booking = require('../models/Booking');

async function createRoom(req, res) {
    try {
        const room = await Room.create(req.body);
        res.status(201).json({ data: room });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getRooms(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['name', 'capacity', 'floor', 'createdAt'],
            'name'
        );

        const search = req.query.search || '';

        const filter = {
            name: { $regex: search, $options: 'i' }
        };

        const total = await Room.countDocuments(filter);

        const rooms = await Room.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: rooms,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getRoomById(req, res) {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Sala no encontrada' });
        }

        res.json({ data: room });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getRoomSchedule(req, res) {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Sala no encontrada' });
        }

        const date = req.query.date;

        if (!date) {
            return res.status(400).json({ error: 'La fecha es obligatoria' });
        }

        const bookings = await Booking.find({
            room: req.params.id,
            date: date
        })
        .sort({ startHour: 1 })
        .populate('band');

        res.json({ data: bookings });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function getRoomStats(req, res) {
    try {
        const stats = await Booking.aggregate([
            {
                $match: {
                    status: { $in: ['apartada', 'confirmada'] }
                }
            },
            {
                $group: {
                    _id: '$room',
                    totalBookings: { $sum: 1 }
                }
            }
        ]);

        res.json({ data: stats });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function updateRoom(req, res) {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!room) {
            return res.status(404).json({ error: 'Sala no encontrada' });
        }

        res.json({ data: room });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


async function deleteRoom(req, res) {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ error: 'Sala no encontrada' });
        }

        const activeBooking = await Booking.findOne({
            room: req.params.id,
            status: { $in: ['apartada', 'confirmada'] }
        });

        if (activeBooking) {
            return res.status(409).json({
                error: 'No se puede eliminar una sala con reservas activas'
            });
        }

        await room.deleteOne();

        res.json({ data: room });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}


module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    getRoomSchedule,
    getRoomStats
};
