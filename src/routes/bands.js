const express = require('express');
const router = express.Router();

const {
    createBand,
    getBands,
    getBandById,
    updateBand,
    deleteBand,
    getBandMusicians,
    getBandBookings
} = require('../controllers/bands');

router.post('/', createBand);
router.get('/', getBands);
router.get('/:id/musicians', getBandMusicians);
router.get('/:id/bookings', getBandBookings);
router.get('/:id', getBandById);
router.put('/:id', updateBand);
router.delete('/:id', deleteBand);

module.exports = router;