const express = require('express');
const router = express.Router();

const {
    getBookings,
    getBookingById,
    createBooking,
    cancelBooking,
    updateBooking,
    getBookingStats
} = require('../controllers/bookings');

router.get('/', getBookings);
router.get('/stats', getBookingStats);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.patch('/:id/cancel', cancelBooking);
router.put('/:id', updateBooking);

module.exports = router;