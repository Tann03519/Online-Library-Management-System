const mongoose = require('mongoose');

const loanItemSchema = new mongoose.Schema({
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
    returnedQty: {
        type: Number,
        default: 0
    },
    condition: {
        type: String,
        enum: ['GOOD', 'DAMAGED', 'LOST'],
        default: 'GOOD'
    },
    damageLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    returnNotes: {
        type: String,
        trim: true
    }
}, { _id: false });

const loanSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    readerUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    librarianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdByRole: {
        type: String,
        enum: ['USER', 'LIBRARIAN'],
        required: true
    },
    loanDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    items: [loanItemSchema],
    status: {
        type: String,
        enum: ['PENDING', 'BORROWED', 'PARTIAL_RETURN', 'RETURNED', 'OVERDUE', 'CANCELLED'],
        default: 'PENDING'
    },
    notes: {
        type: String,
        trim: true
    },
    returnDate: {
        type: Date
    },
    returnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    returnNotes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
loanSchema.index({ code: 1 });
loanSchema.index({ readerUserId: 1 });
loanSchema.index({ librarianId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ loanDate: 1 });
loanSchema.index({ dueDate: 1 });

// Auto-generate loan code
loanSchema.pre('save', function (next) {
    if (!this.code) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.code = `LOAN-${timestamp}-${random}`;
    }
    next();
});

// Virtual for checking if loan is overdue
loanSchema.virtual('isOverdue').get(function () {
    return this.status === 'OPEN' && new Date() > this.dueDate;
});

// Virtual for total items quantity
loanSchema.virtual('totalItems').get(function () {
    return this.items.reduce((total, item) => total + item.qty, 0);
});

module.exports = mongoose.model('Loan', loanSchema);
