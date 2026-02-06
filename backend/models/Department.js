const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    }
}, {
    timestamps: true
});

// Compound index for unique code within faculty
departmentSchema.index({ code: 1, facultyId: 1 }, { unique: true });

// Index for better performance
departmentSchema.index({ facultyId: 1 });

module.exports = mongoose.model('Department', departmentSchema);
