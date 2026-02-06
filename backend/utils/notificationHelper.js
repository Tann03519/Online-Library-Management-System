const Notification = require('../models/Notification');
const User = require('../models/User');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const Review = require('../models/Review');

/**
 * Create notification for a user
 */
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
        console.log(`✅ Created notification for user ${userId}: ${type}`);
        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return null;
    }
};

/**
 * Create notification for multiple users
 */
const createBulkNotifications = async (userIds, type, title, message, data = {}, priority = 'MEDIUM', expiresAt = null) => {
    try {
        const notifications = userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            data,
            priority,
            expiresAt
        }));

        await Notification.insertMany(notifications);
        console.log(`✅ Created ${notifications.length} notifications for type: ${type}`);
        return notifications;
    } catch (error) {
        console.error('❌ Error creating bulk notifications:', error);
        return null;
    }
};

/**
 * Notification triggers for different events
 */

// Loan-related notifications
const notifyLoanApproved = async (loanId) => {
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) return;

        // Get book details separately
        const book = await Book.findById(loan.items[0]?.bookId);
        const bookTitle = book ? book.title : 'Sách';

        await createNotification(
            loan.readerUserId,
            'LOAN_APPROVED',
            'Yêu cầu mượn sách được duyệt',
            `Yêu cầu mượn sách "${bookTitle}" đã được duyệt. Bạn có thể đến thư viện để nhận sách.`,
            {
                loanId: loan._id,
                bookId: loan.items[0]?.bookId,
                bookTitle: bookTitle,
                approvedAt: new Date()
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating loan approved notification:', error);
    }
};

const notifyLoanRejected = async (loanId, reason = 'Không đủ điều kiện') => {
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) return;

        // Get book details separately
        const book = await Book.findById(loan.items[0]?.bookId);
        const bookTitle = book ? book.title : 'Sách';

        await createNotification(
            loan.readerUserId,
            'LOAN_REJECTED',
            'Yêu cầu mượn sách bị từ chối',
            `Yêu cầu mượn sách "${bookTitle}" đã bị từ chối. Lý do: ${reason}`,
            {
                loanId: loan._id,
                bookId: loan.items[0]?.bookId,
                bookTitle: bookTitle,
                reason,
                rejectedAt: new Date()
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating loan rejected notification:', error);
    }
};

const notifyLoanOverdue = async (loanId) => {
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) return;

        // Get book details separately
        const book = await Book.findById(loan.items[0]?.bookId);
        const bookTitle = book ? book.title : 'Sách';

        await createNotification(
            loan.readerUserId,
            'LOAN_OVERDUE',
            'Sách quá hạn trả',
            `Sách "${bookTitle}" đã quá hạn trả. Vui lòng trả sách sớm để tránh phạt.`,
            {
                loanId: loan._id,
                bookId: loan.items[0]?.bookId,
                bookTitle: bookTitle,
                dueDate: loan.dueDate,
                overdueDays: Math.ceil((new Date() - loan.dueDate) / (1000 * 60 * 60 * 24))
            },
            'HIGH'
        );
    } catch (error) {
        console.error('Error creating loan overdue notification:', error);
    }
};

const notifyLoanDueSoon = async (loanId) => {
    try {
        const loan = await Loan.findById(loanId);
        if (!loan) return;

        // Get book details separately
        const book = await Book.findById(loan.items[0]?.bookId);
        const bookTitle = book ? book.title : 'Sách';

        await createNotification(
            loan.readerUserId,
            'LOAN_DUE_SOON',
            'Sắp đến hạn trả sách',
            `Sách "${bookTitle}" sắp đến hạn trả. Vui lòng chuẩn bị trả sách.`,
            {
                loanId: loan._id,
                bookId: loan.items[0]?.bookId,
                bookTitle: bookTitle,
                dueDate: loan.dueDate,
                daysRemaining: Math.ceil((loan.dueDate - new Date()) / (1000 * 60 * 60 * 24))
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating loan due soon notification:', error);
    }
};

// Book-related notifications
const notifyBookAvailable = async (bookId, userIds = []) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return;

        // If specific users provided, notify them
        if (userIds.length > 0) {
            await createBulkNotifications(
                userIds,
                'BOOK_AVAILABLE',
                'Sách có sẵn',
                `Sách "${book.title}" mà bạn đang chờ đã có sẵn. Bạn có thể đến thư viện để mượn.`,
                {
                    bookId: book._id,
                    bookTitle: book.title,
                    availableAt: new Date()
                },
                'LOW'
            );
        } else {
            // Notify all users who have this book in their favorites
            const favoriteUsers = await User.find({
                favorites: bookId,
                role: 'USER'
            }).select('_id');

            if (favoriteUsers.length > 0) {
                const userIds = favoriteUsers.map(user => user._id);
                await createBulkNotifications(
                    userIds,
                    'BOOK_AVAILABLE',
                    'Sách có sẵn',
                    `Sách "${book.title}" trong danh sách yêu thích đã có sẵn. Bạn có thể đến thư viện để mượn.`,
                    {
                        bookId: book._id,
                        bookTitle: book.title,
                        availableAt: new Date()
                    },
                    'LOW'
                );
            }
        }
    } catch (error) {
        console.error('Error creating book available notification:', error);
    }
};

// Review-related notifications
const notifyReviewHidden = async (reviewId) => {
    try {
        const review = await Review.findById(reviewId).populate('userId bookId');
        if (!review) return;

        await createNotification(
            review.userId._id,
            'REVIEW_HIDDEN',
            'Đánh giá bị ẩn',
            `Đánh giá của bạn cho sách "${review.bookId.title}" đã bị ẩn do vi phạm quy định.`,
            {
                reviewId: review._id,
                bookId: review.bookId._id,
                bookTitle: review.bookId.title,
                reason: 'Nội dung không phù hợp',
                hiddenAt: new Date()
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating review hidden notification:', error);
    }
};

const notifyReviewShown = async (reviewId) => {
    try {
        const review = await Review.findById(reviewId).populate('userId bookId');
        if (!review) return;

        await createNotification(
            review.userId._id,
            'REVIEW_SHOWN',
            'Đánh giá được hiện lại',
            `Đánh giá của bạn cho sách "${review.bookId.title}" đã được hiện lại.`,
            {
                reviewId: review._id,
                bookId: review.bookId._id,
                bookTitle: review.bookId.title,
                shownAt: new Date()
            },
            'LOW'
        );
    } catch (error) {
        console.error('Error creating review shown notification:', error);
    }
};

// Payment-related notifications
const notifyPaymentReceived = async (userId, amount, paymentMethod = 'Chuyển khoản') => {
    try {
        await createNotification(
            userId,
            'PAYMENT_RECEIVED',
            'Thanh toán thành công',
            `Thanh toán phạt vi phạm ${amount.toLocaleString('vi-VN')} VNĐ đã được xử lý thành công. Cảm ơn bạn!`,
            {
                amount,
                paymentMethod,
                transactionId: 'TXN' + Date.now(),
                receivedAt: new Date()
            },
            'LOW'
        );
    } catch (error) {
        console.error('Error creating payment received notification:', error);
    }
};

// Book approval/rejection notifications
const notifyBookApproved = async (bookId) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return;

        // Notify all users who have this book in their favorites
        const favoriteUsers = await User.find({
            favorites: bookId,
            role: 'USER'
        }).select('_id');

        if (favoriteUsers.length > 0) {
            const userIds = favoriteUsers.map(user => user._id);
            await createBulkNotifications(
                userIds,
                'BOOK_APPROVED',
                'Sách mới được duyệt',
                `Sách "${book.title}" đã được duyệt và có sẵn để mượn.`,
                {
                    bookId: book._id,
                    bookTitle: book.title,
                    approvedAt: new Date()
                },
                'MEDIUM'
            );
        }
    } catch (error) {
        console.error('Error creating book approved notification:', error);
    }
};

// New book added notification
const notifyNewBookAdded = async (bookId) => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return;

        // Get all users to notify about new book
        const allUsers = await User.find({
            role: 'USER'
        }).select('_id');

        if (allUsers.length > 0) {
            const userIds = allUsers.map(user => user._id);
            await createBulkNotifications(
                userIds,
                'BOOK_AVAILABLE',
                'Sách mới được thêm',
                `Sách mới "${book.title}" đã được thêm vào thư viện. Hãy khám phá ngay!`,
                {
                    bookId: book._id,
                    bookTitle: book.title,
                    author: book.author,
                    category: book.category,
                    addedAt: new Date()
                },
                'LOW'
            );
        }
    } catch (error) {
        console.error('Error creating new book notification:', error);
    }
};

const notifyBookRejected = async (bookId, reason = 'Không đủ tiêu chuẩn') => {
    try {
        const book = await Book.findById(bookId);
        if (!book) return;

        // Notify all users who have this book in their favorites
        const favoriteUsers = await User.find({
            favorites: bookId,
            role: 'USER'
        }).select('_id');

        if (favoriteUsers.length > 0) {
            const userIds = favoriteUsers.map(user => user._id);
            await createBulkNotifications(
                userIds,
                'BOOK_REJECTED',
                'Sách bị từ chối',
                `Sách "${book.title}" đã bị từ chối. Lý do: ${reason}`,
                {
                    bookId: book._id,
                    bookTitle: book.title,
                    reason,
                    rejectedAt: new Date()
                },
                'MEDIUM'
            );
        }
    } catch (error) {
        console.error('Error creating book rejected notification:', error);
    }
};

// Fine-related notifications
const notifyFineIssued = async (fineId) => {
    try {
        const Fine = require('../models/Fine');
        const fine = await Fine.findById(fineId).populate('userId loanId');
        if (!fine) return;

        const fineTypeLabels = {
            'LATE_RETURN': 'Trả muộn',
            'DAMAGE': 'Hư hỏng sách',
            'LOSS': 'Mất sách'
        };

        await createNotification(
            fine.userId._id,
            'FINE_ISSUED',
            'Phạt mới được tạo',
            `Bạn có phạt mới: ${fineTypeLabels[fine.type] || fine.type} - ${fine.amount.toLocaleString('vi-VN')} ${fine.currency}`,
            {
                fineId: fine._id,
                loanId: fine.loanId?._id,
                type: fine.type,
                amount: fine.amount,
                currency: fine.currency,
                description: fine.description
            },
            'HIGH'
        );
    } catch (error) {
        console.error('Error creating fine issued notification:', error);
    }
};

const notifyFinePaid = async (fineId) => {
    try {
        const Fine = require('../models/Fine');
        const fine = await Fine.findById(fineId).populate('userId');
        if (!fine) return;

        await createNotification(
            fine.userId._id,
            'FINE_PAID',
            'Phạt đã được thanh toán',
            `Phạt ${fine.amount.toLocaleString('vi-VN')} ${fine.currency} đã được thanh toán thành công`,
            {
                fineId: fine._id,
                amount: fine.amount,
                currency: fine.currency,
                paidAt: new Date()
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating fine paid notification:', error);
    }
};

const notifyFineWaived = async (fineId, reason = 'Miễn phạt') => {
    try {
        const Fine = require('../models/Fine');
        const fine = await Fine.findById(fineId).populate('userId');
        if (!fine) return;

        await createNotification(
            fine.userId._id,
            'FINE_WAIVED',
            'Phạt đã được miễn',
            `Phạt ${fine.amount.toLocaleString('vi-VN')} ${fine.currency} đã được miễn. Lý do: ${reason}`,
            {
                fineId: fine._id,
                amount: fine.amount,
                currency: fine.currency,
                reason: reason,
                waivedAt: new Date()
            },
            'MEDIUM'
        );
    } catch (error) {
        console.error('Error creating fine waived notification:', error);
    }
};

const notifyFineOverdue = async (fineId) => {
    try {
        const Fine = require('../models/Fine');
        const fine = await Fine.findById(fineId).populate('userId');
        if (!fine) return;

        await createNotification(
            fine.userId._id,
            'FINE_OVERDUE',
            'Phạt quá hạn thanh toán',
            `Phạt ${fine.amount.toLocaleString('vi-VN')} ${fine.currency} đã quá hạn thanh toán. Vui lòng thanh toán sớm.`,
            {
                fineId: fine._id,
                amount: fine.amount,
                currency: fine.currency,
                overdueAt: new Date()
            },
            'URGENT'
        );
    } catch (error) {
        console.error('Error creating fine overdue notification:', error);
    }
};

module.exports = {
    createNotification,
    createBulkNotifications,
    notifyLoanApproved,
    notifyLoanRejected,
    notifyLoanOverdue,
    notifyLoanDueSoon,
    notifyBookAvailable,
    notifyReviewHidden,
    notifyReviewShown,
    notifyPaymentReceived,
    notifyBookApproved,
    notifyBookRejected,
    notifyNewBookAdded,
    notifyFineIssued,
    notifyFinePaid,
    notifyFineWaived,
    notifyFineOverdue
};
