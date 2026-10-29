
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        enum: ['audio', 'cuerdas', 'percusion']
    },
    totalUnits: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
    },
    availableUnits: {
        type: Number,
        min: 0,
        validate: {
            validator: function(value) {
                return Number.isInteger(value) &&
                    value <= this.totalUnits;
            },
            message: 'Las unidades disponibles no pueden superar el total'
        }
    }
}, { timestamps: true });

equipmentSchema.pre('validate', function() {
    if (this.isNew && this.availableUnits === undefined) {
        this.availableUnits = this.totalUnits;
    }
});

module.exports = mongoose.model('Equipment', equipmentSchema);
