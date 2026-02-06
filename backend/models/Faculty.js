const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    }
}, {
    timestamps: true
});

// Index for better performance
facultySchema.index({ code: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
