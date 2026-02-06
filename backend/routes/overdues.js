const express = require('express');
const Loan = require('../models/Loan');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/overdues (LIBRARIAN/ADMIN only)
router.get('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Find overdue loans
        const query = {
            status: 'OPEN',
            dueDate: { $lt: new Date() }
        };

        // Get overdue loans with pagination
        const [overdueLoans, total] = await Promise.all([
            Loan.find(query)
                .populate('readerUserId', 'fullName email')
                .populate('librarianId', 'fullName email')
                .populate('items.bookId', 'title isbn authors')
                .sort({ dueDate: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Loan.countDocuments(query)
        ]);

        // Calculate overdue days for each loan
        const overdueLoansWithDays = overdueLoans.map(loan => {
            const today = new Date();
            const dueDate = new Date(loan.dueDate);
            const overdueDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

            return {
                ...loan.toObject(),
                overdueDays
            };
        });

        res.json({
            success: true,
            data: overdueLoansWithDays,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get overdues error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get overdue loans'
            }
        });
    }
});

module.exports = router;
