const mongoose = require('mongoose');

const loanExtensionSchema = new mongoose.Schema({
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
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentDueDate: {
        type: Date,
        required: true
    },
    newDueDate: {
        type: Date,
        required: true
    },
    extensionDays: {
        type: Number,
        required: true,
        min: 1,
        max: 30 // Maximum 30 days extension
    },
    reason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    reviewNotes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
loanExtensionSchema.index({ loanId: 1 });
loanExtensionSchema.index({ userId: 1 });
loanExtensionSchema.index({ status: 1 });
loanExtensionSchema.index({ requestedBy: 1 });

// Virtual for checking if extension is expired
loanExtensionSchema.virtual('isExpired').get(function () {
    return this.status === 'PENDING' && new Date() > new Date(this.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
});

module.exports = mongoose.model('LoanExtension', loanExtensionSchema);
