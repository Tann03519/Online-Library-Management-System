const mongoose = require('mongoose');

const BookViewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Allow anonymous views
    },
    ipAddress: {
        type: String,
        required: false,
    },
    userAgent: {
        type: String,
        required: false,
    },
    viewedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for efficient queries
BookViewSchema.index({ bookId: 1, viewedAt: -1 });
BookViewSchema.index({ bookId: 1, userId: 1 });

module.exports = mongoose.model('BookView', BookViewSchema);
