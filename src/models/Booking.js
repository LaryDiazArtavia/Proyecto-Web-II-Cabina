const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    band: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Band',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startHour: {
        type: Number,
        required: true,
        min: 8,
        max: 21,
        validate: Number.isInteger
    },
    endHour: {
        type: Number,
        required: true,
        min: 9,
        max: 22,
        validate: Number.isInteger
    },
    status: {
        type: String,
        enum: ['apartada', 'confirmada', 'cancelada'],
        default: 'apartada'
    },
    notes: {
        type: String,
        maxlength: 200
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Duración en horas (sale en el JSON)
bookingSchema.virtual('durationHours').get(function () {
    return this.endHour - this.startHour;
});

// Índice para el horario de una sala en un día
bookingSchema.index({ room: 1, date: 1, startHour: 1 });

module.exports = mongoose.model('Booking', bookingSchema);