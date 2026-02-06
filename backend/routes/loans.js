const express = require('express');
const { body } = require('express-validator');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, loanValidations, handleValidationErrors } = require('../middleware/validation');
const { notifyLoanApproved, notifyLoanRejected } = require('../utils/notificationHelper');

const router = express.Router();

// GET /api/loans (LIBRARIAN/ADMIN only)
router.get('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const {
            status,
            readerUserId,
            overdueOnly,
            from,
            to,
            page = 1,
            limit = 10
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        if (status) query.status = status;
        if (readerUserId) query.readerUserId = readerUserId;

        if (overdueOnly === 'true') {
            query.status = 'OPEN';
            query.dueDate = { $lt: new Date() };
        }

        if (from || to) {
            query.loanDate = {};
            if (from) query.loanDate.$gte = new Date(from);
            if (to) query.loanDate.$lte = new Date(to);
        }

        // Get loans with pagination
        const [loans, total] = await Promise.all([
            Loan.find(query)
                .populate('readerUserId', 'fullName email')
                .populate('librarianId', 'fullName email')
                .populate('items.bookId', 'title isbn authors')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Loan.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: loans,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get loans error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get loans'
            }
        });
    }
});

// GET /api/loans/:id (LIBRARIAN/ADMIN only)
router.get('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const loan = await Loan.findById(id)
            .populate('readerUserId', 'fullName email')
            .populate('librarianId', 'fullName email')
            .populate('items.bookId', 'title isbn authors coverImageUrl');

        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        res.json({
            success: true,
            data: loan
        });
    } catch (error) {
        console.error('Get loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get loan'
            }
        });
    }
});

// POST /api/loans/self (USER only - self loan)
router.post('/self', authenticate, authorize('USER'), loanValidations.createForUser, async (req, res) => {
    try {
        const { dueDate, items } = req.body;
        const readerUserId = req.user._id;

        // Validate due date is in the future
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STOCK_409',
                    message: 'Due date must be in the future'
                }
            });
        }

        // Check stock availability for all books
        const bookIds = items.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        if (books.length !== bookIds.length) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STOCK_409',
                    message: 'One or more books not found'
                }
            });
        }

        // Check stock and validate quantities
        for (const item of items) {
            const book = books.find(b => b._id.toString() === item.bookId);
            if (!book) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Book ${item.bookId} not found`
                    }
                });
            }

            if (book.status !== 'ACTIVE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Book ${book.title} is not available`
                    }
                });
            }

            if (book.quantityAvailable < item.qty) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Insufficient stock for book ${book.title}. Available: ${book.quantityAvailable}, Requested: ${item.qty}`
                    }
                });
            }
        }

        // Generate loan code
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const loanCode = `LOAN-${timestamp}-${random}`;

        // Create loan with PENDING status
        const loan = new Loan({
            code: loanCode,
            readerUserId,
            createdByRole: 'USER',
            dueDate: new Date(dueDate),
            items,
            status: 'PENDING',
            notes: 'Yêu cầu mượn sách chờ duyệt'
        });

        await loan.save();

        // Don't update book quantities yet - wait for approval

        // Populate loan data
        await loan.populate([
            { path: 'readerUserId', select: 'fullName email' },
            { path: 'items.bookId', select: 'title isbn authors' }
        ]);

        res.status(201).json({
            success: true,
            data: loan
        });
    } catch (error) {
        console.error('Create self loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create loan'
            }
        });
    }
});

// POST /api/loans (LIBRARIAN/ADMIN only - loan for any user)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), loanValidations.create, async (req, res) => {
    try {
        const { readerUserId, dueDate, items, notes } = req.body;
        const librarianId = req.user._id;

        // Validate due date is in the future
        if (new Date(dueDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STOCK_409',
                    message: 'Due date must be in the future'
                }
            });
        }

        // Check if reader exists
        const reader = await User.findById(readerUserId);
        if (!reader) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Reader not found'
                }
            });
        }

        if (reader.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STOCK_409',
                    message: 'Reader account is not active'
                }
            });
        }

        // Check stock availability for all books
        const bookIds = items.map(item => item.bookId);
        const books = await Book.find({ _id: { $in: bookIds } });

        if (books.length !== bookIds.length) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STOCK_409',
                    message: 'One or more books not found'
                }
            });
        }

        // Check stock and validate quantities
        for (const item of items) {
            const book = books.find(b => b._id.toString() === item.bookId);
            if (!book) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Book ${item.bookId} not found`
                    }
                });
            }

            if (book.status !== 'ACTIVE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Book ${book.title} is not available`
                    }
                });
            }

            if (book.quantityAvailable < item.qty) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'STOCK_409',
                        message: `Insufficient stock for book ${book.title}. Available: ${book.quantityAvailable}, Requested: ${item.qty}`
                    }
                });
            }
        }

        // Generate loan code
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const loanCode = `LOAN-${timestamp}-${random}`;

        // Create loan
        const loan = new Loan({
            code: loanCode,
            readerUserId,
            librarianId,
            createdByRole: 'LIBRARIAN',
            dueDate: new Date(dueDate),
            items,
            notes
        });

        await loan.save();

        // Update book quantities
        for (const item of items) {
            await Book.findByIdAndUpdate(
                item.bookId,
                { $inc: { quantityAvailable: -item.qty } }
            );
        }

        // Populate loan data
        await loan.populate([
            { path: 'readerUserId', select: 'fullName email' },
            { path: 'librarianId', select: 'fullName email' },
            { path: 'items.bookId', select: 'title isbn authors' }
        ]);

        res.status(201).json({
            success: true,
            data: loan
        });
    } catch (error) {
        console.error('Create loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create loan'
            }
        });
    }
});

// POST /api/loans/:id/print (LIBRARIAN/ADMIN only)
router.post('/:id/print', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const loan = await Loan.findById(id)
            .populate('readerUserId', 'fullName email')
            .populate('librarianId', 'fullName email')
            .populate('items.bookId', 'title isbn authors');

        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        // TODO: Implement PDF generation using puppeteer
        // For now, return loan data for frontend to generate PDF
        res.json({
            success: true,
            data: {
                loan,
                printData: {
                    type: 'LOAN',
                    title: 'Phiếu Mượn Sách',
                    generatedAt: new Date().toISOString(),
                    generatedBy: req.user.fullName
                }
            }
        });
    } catch (error) {
        console.error('Print loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to generate loan print'
            }
        });
    }
});

module.exports = router;