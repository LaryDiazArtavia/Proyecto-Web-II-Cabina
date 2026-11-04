
const express = require('express');
const router = express.Router();

const {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    getRoomSchedule,
    getRoomStats
} = require('../controllers/rooms');

router.post('/', createRoom);
router.get('/', getRooms);
router.get('/stats', getRoomStats);
router.get('/:id/schedule', getRoomSchedule);
router.get('/:id', getRoomById);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
