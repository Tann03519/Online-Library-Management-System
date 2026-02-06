const express = require('express');
const Loan = require('../models/Loan');
const Return = require('../models/Return');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/users/me/loans (USER only - own loans)
router.get('/me/loans', authenticate, authorize('USER'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { status, q, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Build query
        const query = { readerUserId: userId };
        if (status) {
            // Map frontend status to backend status
            if (status === 'RETURNED') {
                query.status = 'CLOSED';
            } else {
                query.status = status;
            }
        }
        if (q) {
            query.$or = [
                { code: { $regex: q, $options: 'i' } },
                { 'items.bookId.title': { $regex: q, $options: 'i' } },
                { 'items.bookId.authors': { $regex: q, $options: 'i' } }
            ];
        }

        // Get user's loans with pagination
        const [loans, total] = await Promise.all([
            Loan.find(query)
                .populate('librarianId', 'fullName email')
                .populate('items.bookId', 'title isbn authors coverImageUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Loan.countDocuments(query)
        ]);

        // Add overdue information and map status
        const loansWithOverdue = loans.map(loan => {
            const today = new Date();
            const dueDate = new Date(loan.dueDate);
            const isOverdue = ['BORROWED', 'PARTIAL_RETURN'].includes(loan.status) && today > dueDate;
            const overdueDays = isOverdue ? Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;

            // Map status for frontend compatibility
            let mappedStatus = loan.status;
            if (loan.status === 'CLOSED') {
                mappedStatus = 'RETURNED';
            }

            return {
                ...loan.toObject(),
                status: mappedStatus,
                isOverdue,
                overdueDays
            };
        });

        res.json({
            success: true,
            data: loansWithOverdue,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user loans error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user loans'
            }
        });
    }
});

// GET /api/users/me/returns (USER only - own returns)
router.get('/me/returns', authenticate, authorize('USER'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Get user's returns through their loans
        const userLoans = await Loan.find({ readerUserId: userId }).select('_id');
        const loanIds = userLoans.map(loan => loan._id);

        // Get returns for user's loans with pagination
        const [returns, total] = await Promise.all([
            Return.find({ loanId: { $in: loanIds } })
                .populate('loanId', 'code dueDate')
                .populate('librarianId', 'fullName email')
                .populate('items.bookId', 'title isbn authors')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Return.countDocuments({ loanId: { $in: loanIds } })
        ]);

        res.json({
            success: true,
            data: returns,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user returns error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user returns'
            }
        });
    }
});

module.exports = router;
