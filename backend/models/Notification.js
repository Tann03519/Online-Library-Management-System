const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'BOOK_APPROVED',      // Sách được duyệt
            'BOOK_REJECTED',      // Sách bị từ chối
            'LOAN_OVERDUE',       // Hạn trả sách
            'LOAN_DUE_SOON',      // Sắp đến hạn trả
            'PAYMENT_RECEIVED',    // Đã thanh toán
            'REVIEW_HIDDEN',      // Review bị ẩn
            'REVIEW_SHOWN',       // Review được hiện lại
            'LOAN_APPROVED',      // Mượn sách được duyệt
            'LOAN_REJECTED',      // Mượn sách bị từ chối
            'BOOK_AVAILABLE',     // Sách có sẵn
            'FINE_ISSUED',        // Phạt mới
            'FINE_OVERDUE',       // Phạt quá hạn
            'FINE_PAID',          // Đã thanh toán phạt
            'FINE_WAIVED'         // Phạt được miễn
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
