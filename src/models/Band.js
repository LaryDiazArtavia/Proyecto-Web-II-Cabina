const mongoose = require('mongoose');

const bandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    genre: {
        type: String,
        enum: ['rock', 'jazz', 'coral', 'otro'],
        default: 'otro'
    },
    active: {
        type: Boolean,
        default: true
    },
    contactName: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para poder hacer populate('musicians') desde Band
bandSchema.virtual('musicians', {
    ref: 'Musician',
    localField: '_id',
    foreignField: 'band'
});

module.exports = mongoose.model('Band', bandSchema);