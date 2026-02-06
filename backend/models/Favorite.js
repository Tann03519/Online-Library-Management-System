const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique user-book combination
favoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ bookId: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
