const Booking = require('../models/Booking');
const Loan = require('../models/Loan');
const Musician = require('../models/Musician');
const getPagination = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');
const handleError = require('../utils/handleError');
const Room = require('../models/Room');
const Band = require('../models/Band');
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');


// Lanza un error con su código HTTP (se usa dentro de la transacción)
function throwError(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}


// Revisa las reglas de negocio de una reserva.
// Si hay un error devuelve { status, error }, si todo está bien devuelve null.
// bookingId solo se manda al editar, para que la reserva no choque consigo misma.
async function validateBooking(data, bookingId, session) {
    const { room, band, date, startHour, endHour } = data;

    // Datos obligatorios
    if (!room || !band || !date || startHour === undefined || endHour === undefined) {
        return { status: 400, error: 'room, band, date, startHour y endHour son obligatorios' };
    }

    // Horas
    if (endHour <= startHour) {
        return { status: 400, error: 'endHour debe ser mayor que startHour' };
    }
    if (endHour - startHour > 3) {
        return { status: 400, error: 'La reserva puede durar máximo 3 horas' };
    }

    // Fecha: hoy o después
    const bookingDate = new Date(date);
    if (isNaN(bookingDate)) {
        return { status: 400, error: 'La fecha no es válida' };
    }

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (bookingDate < today) {
        return { status: 400, error: 'La fecha debe ser hoy o un día posterior' };
    }

    // Sala: existe y está disponible
    const foundRoom = await Room.findById(room).session(session);
    if (!foundRoom) {
        return { status: 404, error: 'Sala no encontrada' };
    }
    if (foundRoom.status !== 'disponible') {
        return { status: 409, error: 'La sala está en mantenimiento' };
    }

    // Banda: existe y está activa
    const foundBand = await Band.findById(band).session(session);
    if (!foundBand) {
        return { status: 404, error: 'Banda no encontrada' };
    }
    if (!foundBand.active) {
        return { status: 409, error: 'La banda no está activa' };
    }

    // Músicos activos: al menos uno y que quepan en la sala
    const activeMusicians = await Musician.countDocuments({ band, active: true }).session(session);
    if (activeMusicians === 0) {
        return { status: 409, error: 'La banda no tiene músicos activos' };
    }
    if (activeMusicians > foundRoom.capacity) {
        return { status: 409, error: 'La banda no cabe en la sala' };
    }

    // Traslape con otra reserva activa de la misma sala y fecha
    const overlapFilter = {
        room,
        date: bookingDate,
        status: { $in: ['apartada', 'confirmada'] },
        startHour: { $lt: endHour },
        endHour: { $gt: startHour }
    };

    // Al editar, no comparar la reserva consigo misma
    if (bookingId) {
        overlapFilter._id = { $ne: bookingId };
    }

    const overlap = await Booking.findOne(overlapFilter).session(session);
    if (overlap) {
        return { status: 409, error: 'La sala ya está reservada en ese horario' };
    }

    return null;
}

// GET /api/bookings
async function getBookings(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['date', 'startHour', 'createdAt'],
            'date'
        );

        // Si no mandan sort, se ordena por fecha y luego por hora
        let sort = { [sortField]: sortOrder };
        if (!req.query.sort) {
            sort = { date: 1, startHour: 1 };
        }

        const filter = {};

        // Búsqueda por notes
        if (req.query.search) {
            filter.notes = { $regex: escapeRegex(req.query.search), $options: 'i' };
        }

        // Filtros
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.room) {
            filter.room = req.query.room;
        }
        if (req.query.band) {
            filter.band = req.query.band;
        }

        // Fecha exacta o rango (from / to)
        if (req.query.date) {
            filter.date = new Date(req.query.date);
        } else if (req.query.from || req.query.to) {
            filter.date = {};
            if (req.query.from) {
                filter.date.$gte = new Date(req.query.from);
            }
            if (req.query.to) {
                filter.date.$lte = new Date(req.query.to);
            }
        }

        const total = await Booking.countDocuments(filter);

        const bookings = await Booking.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: bookings,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
}

// GET /api/bookings/:id
async function getBookingById(req, res) {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('room', 'name capacity status')
            .populate('band', 'name genre');

        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        // Préstamos de la reserva, cada uno con su equipo
        const loans = await Loan.find({ booking: booking._id }).populate('equipment');

        const data = booking.toJSON();
        data.loans = loans;

        // Músicos activos de la banda
        if (booking.band) {
            data.band.musicians = await Musician.find({ band: booking.band._id, active: true });
        }

        res.json({ data });
    } catch (error) {
        handleError(res, error);
    }
}

// POST /api/bookings
async function createBooking(req, res) {
    const { room, band, date, startHour, endHour, notes } = req.body;
    const equipment = req.body.equipment || [];

    // Revisar que la lista de equipo venga bien
    if (!Array.isArray(equipment)) {
        return res.status(400).json({ error: 'equipment debe ser una lista' });
    }

    const ids = [];
    for (const item of equipment) {
        if (!item.equipmentId || !Number.isInteger(item.units) || item.units < 1) {
            return res.status(400).json({ error: 'Cada equipo necesita equipmentId y units entero mayor que 0' });
        }
        if (ids.includes(String(item.equipmentId))) {
            return res.status(400).json({ error: 'No se puede pedir el mismo equipo dos veces' });
        }
        ids.push(String(item.equipmentId));
    }

    const session = await mongoose.startSession();

    try {
        let booking;

        await session.withTransaction(async () => {
            // 1. Reglas de negocio (incluye el traslape)
            const validation = await validateBooking(req.body, null, session);
            if (validation) {
                throwError(validation.status, validation.error);
            }

            // 2. Crear la reserva
            const created = await Booking.create(
                [{ room, band, date, startHour, endHour, notes }],
                { session }
            );
            booking = created[0];

            // 3. Por cada equipo: revisar inventario, descontar y crear el préstamo
            for (const item of equipment) {
                const foundEquipment = await Equipment.findById(item.equipmentId).session(session);

                if (!foundEquipment) {
                    throwError(404, 'Equipo no encontrado');
                }
                if (foundEquipment.availableUnits < item.units) {
                    throwError(409, `No hay suficientes unidades de ${foundEquipment.name}`);
                }

                await Equipment.updateOne(
                    { _id: foundEquipment._id },
                    { $inc: { availableUnits: -item.units } },
                    { session }
                );

                await Loan.create(
                    [{ booking: booking._id, equipment: foundEquipment._id, units: item.units, status: 'prestado' }],
                    { session }
                );
            }
        });

        res.status(201).json({ data: booking });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        handleError(res, error);
    } finally {
        session.endSession();
    }
}

// PATCH /api/bookings/:id/cancel
async function cancelBooking(req, res) {
    const session = await mongoose.startSession();

    try {
        let booking;

        await session.withTransaction(async () => {
            booking = await Booking.findById(req.params.id).session(session);

            if (!booking) {
                throwError(404, 'Reserva no encontrada');
            }
            if (booking.status === 'cancelada') {
                throwError(409, 'La reserva ya está cancelada');
            }

            // 1. La reserva pasa a cancelada
            booking.status = 'cancelada';
            await booking.save({ session });

            // 2. Sus préstamos pasan a devuelto y las unidades regresan al inventario
            const loans = await Loan.find({ booking: booking._id, status: 'prestado' }).session(session);

            for (const loan of loans) {
                await Equipment.updateOne(
                    { _id: loan.equipment },
                    { $inc: { availableUnits: loan.units } },
                    { session }
                );

                loan.status = 'devuelto';
                await loan.save({ session });
            }
        });

        res.json({ data: booking });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        handleError(res, error);
    } finally {
        session.endSession();
    }
}

// PUT /api/bookings/:id
async function updateBooking(req, res) {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        if (booking.status === 'cancelada') {
            return res.status(409).json({ error: 'No se puede modificar una reserva cancelada' });
        }

        if (req.body.equipment !== undefined) {
            return res.status(400).json({ error: 'El equipo de una reserva no se puede cambiar' });
        }

        // Cambio de estado
        const newStatus = req.body.status;

        if (newStatus && newStatus !== booking.status) {
            if (newStatus === 'cancelada') {
                return res.status(400).json({ error: 'Para cancelar use PATCH /api/bookings/:id/cancel' });
            }

            // Permitido: apartada -> confirmada
            if (!(booking.status === 'apartada' && newStatus === 'confirmada')) {
                return res.status(409).json({ error: `No se puede pasar de ${booking.status} a ${newStatus}` });
            }
        }

        // Datos nuevos: lo que viene en el body o lo que ya tenía la reserva
        const data = {
            room: req.body.room || booking.room,
            band: req.body.band || booking.band,
            date: req.body.date || booking.date,
            startHour: req.body.startHour || booking.startHour,
            endHour: req.body.endHour || booking.endHour
        };

        // Si cambia horario, sala o banda, se vuelven a revisar las reglas
        if (req.body.room || req.body.band || req.body.date || req.body.startHour || req.body.endHour) {
            const validation = await validateBooking(data, booking._id, null);
            if (validation) {
                return res.status(validation.status).json({ error: validation.error });
            }
        }

        booking.room = data.room;
        booking.band = data.band;
        booking.date = data.date;
        booking.startHour = data.startHour;
        booking.endHour = data.endHour;

        if (req.body.notes !== undefined) {
            booking.notes = req.body.notes;
        }
        if (newStatus) {
            booking.status = newStatus;
        }

        await booking.save();

        res.json({ data: booking });
    } catch (error) {
        handleError(res, error);
    }
}

// GET /api/bookings/stats
async function getBookingStats(req, res) {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    total: { $sum: 1 }
                }
            }
        ]);

        res.json({ data: stats });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    getBookings,
    getBookingById,
    createBooking,
    cancelBooking,
    updateBooking,
    getBookingStats  
};
