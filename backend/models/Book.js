const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    authors: [{
        type: String,
        required: true,
        trim: true
    }],
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    publisherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publisher',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        default: null
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null
    },
    year: {
        type: Number,
        min: 1000,
        max: new Date().getFullYear() + 1
    },
    pages: {
        type: Number,
        min: 1
    },
    description: {
        type: String,
        trim: true
    },
    coverImageUrl: {
        type: String,
        default: null
    },
    quantityTotal: {
        type: Number,
        required: true,
        min: 0
    },
    quantityAvailable: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 100000 // Default price in VND
    },
    location: {
        type: String,
        trim: true
    },
    keywords: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'LOST', 'DAMAGED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Indexes for better performance
bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 'text', authors: 'text', keywords: 'text' });
bookSchema.index({ categoryId: 1 });
bookSchema.index({ publisherId: 1 });
bookSchema.index({ facultyId: 1 });
bookSchema.index({ departmentId: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ quantityAvailable: 1 });

// Virtual for checking if book is available
bookSchema.virtual('isAvailable').get(function () {
    return this.quantityAvailable > 0 && this.status === 'ACTIVE';
});

// Ensure quantityAvailable doesn't exceed quantityTotal
bookSchema.pre('save', function (next) {
    if (this.quantityAvailable > this.quantityTotal) {
        this.quantityAvailable = this.quantityTotal;
    }
    next();
});

module.exports = mongoose.model('Book', bookSchema);
