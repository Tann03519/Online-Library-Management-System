const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    },
    condition: {
        type: String,
        enum: ['OK', 'DAMAGED', 'LOST'],
        required: true
    },
    damagePercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    lateDays: {
        type: Number,
        default: 0,
        min: 0
    },
    lateFee: {
        type: Number,
        default: 0,
        min: 0
    },
    damageFee: {
        type: Number,
        default: 0,
        min: 0
    },
    otherFee: {
        type: Number,
        default: 0,
        min: 0
    },
    totalFee: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const returnSchema = new mongoose.Schema({
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true
    },
    librarianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    returnDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    items: [returnItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Indexes for better performance
returnSchema.index({ loanId: 1 });
returnSchema.index({ librarianId: 1 });
returnSchema.index({ returnDate: 1 });

// Calculate total amount before saving
returnSchema.pre('save', function (next) {
    this.totalAmount = this.items.reduce((total, item) => total + item.totalFee, 0);
    next();
});

module.exports = mongoose.model('Return', returnSchema);
