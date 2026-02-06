const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'HIDDEN'],
        default: 'ACTIVE'
    },
    helpful: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    isAnonymous: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
reviewSchema.index({ bookId: 1, status: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Unique compound index to ensure one review per user per book
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);