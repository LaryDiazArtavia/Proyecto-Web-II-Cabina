
const express = require('express');
const router = express.Router();

const {
    createEquipment,
    getEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment,
    getEquipmentStats
} = require('../controllers/equipment');

router.post('/', createEquipment);
router.get('/', getEquipment);
router.get('/stats', getEquipmentStats);
router.get('/:id', getEquipmentById);
router.put('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

module.exports = router;
