
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 40
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 30
    },
    floor: {
        type: Number,
        required: true
    },
    hasDrumKit: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['disponible', 'mantenimiento'],
        default: 'disponible'
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
