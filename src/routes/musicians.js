const express = require('express');
const router = express.Router();

const {
    createMusician,
    getMusicians,
    getMusicianById,
    updateMusician,
    deleteMusician
} = require('../controllers/musicians');

router.post('/', createMusician);
router.get('/', getMusicians);
router.get('/:id', getMusicianById);
router.put('/:id', updateMusician);
router.delete('/:id', deleteMusician);

module.exports = router;