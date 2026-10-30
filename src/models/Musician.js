const mongoose = require('mongoose');

const musicianSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    instrument: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'El email no es válido']
    },
    band: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Band',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Para listar/filtrar los músicos de una banda
musicianSchema.index({ band: 1 });

module.exports = mongoose.model('Musician', musicianSchema);