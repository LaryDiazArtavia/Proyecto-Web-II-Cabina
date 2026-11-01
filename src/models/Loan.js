const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    units: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
    },
    status: {
        type: String,
        enum: ['prestado', 'devuelto'],
        default: 'prestado'
    }
}, { timestamps: true });

// Para buscar los préstamos de una reserva
loanSchema.index({ booking: 1 });

// Para buscar préstamos de un equipo por estado
loanSchema.index({ equipment: 1, status: 1 });

module.exports = mongoose.model('Loan', loanSchema);