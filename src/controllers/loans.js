const Loan = require('../models/Loan');
const getPagination = require('../utils/pagination');
const escapeRegex = require('../utils/escapeRegex');
const handleError = require('../utils/handleError');

// GET /api/loans
async function getLoans(req, res) {
    try {
        const { page, limit, sortField, sortOrder } = getPagination(
            req.query,
            ['units', 'createdAt'],
            'createdAt'
        );

        const filter = {};

        // Búsqueda por estado
        if (req.query.search) {
            filter.status = { $regex: escapeRegex(req.query.search), $options: 'i' };
        }

        // Filtros
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.booking) {
            filter.booking = req.query.booking;
        }
        if (req.query.equipment) {
            filter.equipment = req.query.equipment;
        }

        const total = await Loan.countDocuments(filter);

        const loans = await Loan.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: loans,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        handleError(res, error);
    }
}

// GET /api/loans/:id
async function getLoanById(req, res) {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('booking')
            .populate('equipment');

        if (!loan) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        res.json({ data: loan });
    } catch (error) {
        handleError(res, error);
    }
}

module.exports = {
    getLoans,
    getLoanById
};