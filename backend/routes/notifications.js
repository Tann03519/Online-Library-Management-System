const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const Review = require('../models/Review');

// Get user notifications
router.get('/', authenticate, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn([
        'BOOK_APPROVED', 'BOOK_REJECTED', 'LOAN_OVERDUE', 'LOAN_DUE_SOON',
        'PAYMENT_RECEIVED', 'REVIEW_HIDDEN', 'REVIEW_SHOWN', 'LOAN_APPROVED',
        'LOAN_REJECTED', 'BOOK_AVAILABLE'
    ]),
    query('isRead').optional().isBoolean(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isRead } = req.query;
        const userId = req.user._id;

        const filter = { userId };
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('userId', 'fullName email')
            .lean();

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_NOTIFICATIONS_ERROR',
                message: 'Lỗi khi lấy danh sách thông báo'
            }
        });
    }
});

// Get unread notification count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ userId, isRead: false });

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'FETCH_UNREAD_COUNT_ERROR',
                message: 'Lỗi khi lấy số thông báo chưa đọc'
            }
        });
    }
});

// Mark notification as read
router.put('/:id/read', authenticate, [
    param('id').isMongoId(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Không tìm thấy thông báo'
                }
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'MARK_READ_ERROR',
                message: 'Lỗi khi đánh dấu thông báo đã đọc'
            }
        });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'MARK_ALL_READ_ERROR',
                message: 'Lỗi khi đánh dấu tất cả thông báo đã đọc'
            }
        });
    }
});

// Delete notification
router.delete('/:id', authenticate, [
    param('id').isMongoId(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Không tìm thấy thông báo'
                }
            });
        }

        res.json({
            success: true,
            message: 'Đã xóa thông báo'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_NOTIFICATION_ERROR',
                message: 'Lỗi khi xóa thông báo'
            }
        });
    }
});

// Helper function to create notification
const createNotification = async (userId, type, title, message, data = {}, priority = 'MEDIUM', expiresAt = null) => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            data,
            priority,
            expiresAt
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Export the helper function for use in other routes
module.exports = { router, createNotification };
