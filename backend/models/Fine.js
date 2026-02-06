const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
    loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['LATE_RETURN', 'DAMAGE', 'LOSS'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'WAIVED'],
        default: 'PENDING'
    },
    paidAt: {
        type: Date
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waivedAt: {
        type: Date
    },
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waivedReason: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
fineSchema.index({ loanId: 1 });
fineSchema.index({ userId: 1 });
fineSchema.index({ status: 1 });
fineSchema.index({ type: 1 });

// Virtual for checking if fine is overdue
fineSchema.virtual('isOverdue').get(function () {
    return this.status === 'PENDING' && new Date() > this.createdAt;
});

module.exports = mongoose.model('Fine', fineSchema);
