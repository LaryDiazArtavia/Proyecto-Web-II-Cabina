const express = require('express');
const router = express.Router();

const { getLoans, getLoanById } = require('../controllers/loans');

router.get('/', getLoans);
router.get('/:id', getLoanById);

module.exports = router;