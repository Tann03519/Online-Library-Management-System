const express = require('express');
const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const Fine = require('../models/Fine');
const LoanExtension = require('../models/LoanExtension');
const FinePolicy = require('../models/FinePolicy');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');
const { notifyLoanApproved, notifyLoanRejected, notifyFineIssued, notifyFinePaid, notifyFineWaived } = require('../utils/notificationHelper');

const router = express.Router();

// GET /api/loans/pending - Get pending loans (for admin/librarian)
router.get('/admin/pending', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        console.log('GET /api/loans/pending - User:', req.user?.email, 'Role:', req.user?.role);
        console.log('Query params:', req.query);
        console.log('Route handler reached successfully!');

        const { page = 1, limit = 10, status = 'PENDING' } = req.query;
        const skip = (page - 1) * limit;

        const loans = await Loan.find({ status })
            .populate('readerUserId', 'fullName email studentId')
            .populate('items.bookId', 'title isbn authors coverImageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Loan.countDocuments({ status });

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
        console.error('Get pending loans error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get pending loans',
                details: error.message
            }
        });
    }
});

// PUT /api/loans/:id/approve - Approve loan request
router.put('/:id/approve', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        console.log('Starting loan approval process for loan:', id);

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        if (loan.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Loan is not in pending status'
                }
            });
        }

        console.log('Loan found:', loan.code, 'Status:', loan.status);

        // Check if books are available
        for (const item of loan.items) {
            const book = await Book.findById(item.bookId);
            console.log(`Checking book ${item.bookId}: available=${book?.quantityAvailable}, requested=${item.qty}`);

            if (!book || book.quantityAvailable < item.qty) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_STOCK_400',
                        message: `Insufficient stock for book: ${book?.title || 'Unknown'}`
                    }
                });
            }
        }

        // Update book quantities with error handling
        console.log('Updating book quantities for loan approval:', loan._id);
        const updatedBooks = [];

        try {
            for (const item of loan.items) {
                console.log(`Updating book ${item.bookId} quantity by -${item.qty}`);
                const updatedBook = await Book.findByIdAndUpdate(
                    item.bookId,
                    { $inc: { quantityAvailable: -item.qty } },
                    { new: true }
                );
                updatedBooks.push({ bookId: item.bookId, newQuantity: updatedBook.quantityAvailable });
                console.log(`Book ${item.bookId} quantity updated. New available: ${updatedBook.quantityAvailable}`);
            }

            // Update loan status to BORROWED (approved and ready to borrow)
            loan.status = 'BORROWED';
            loan.loanDate = new Date();
            loan.librarianId = req.user.id;
            if (notes) loan.notes = notes;
            await loan.save();

            console.log('Loan status updated to BORROWED');
        } catch (updateError) {
            console.error('Error during book quantity update, attempting rollback:', updateError);

            // Rollback book quantities if loan update fails
            for (const updatedBook of updatedBooks) {
                try {
                    await Book.findByIdAndUpdate(
                        updatedBook.bookId,
                        { $inc: { quantityAvailable: +loan.items.find(item => item.bookId.toString() === updatedBook.bookId.toString())?.qty || 0 } }
                    );
                    console.log(`Rolled back book ${updatedBook.bookId} quantity`);
                } catch (rollbackError) {
                    console.error(`Failed to rollback book ${updatedBook.bookId}:`, rollbackError);
                }
            }

            throw updateError;
        }

        // Create notification for user
        await notifyLoanApproved(loan._id);

        res.json({
            success: true,
            data: loan,
            message: 'Loan approved and marked as borrowed successfully'
        });
    } catch (error) {
        console.error('Approve loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: error.message || 'Failed to approve loan'
            }
        });
    }
});

// PUT /api/loans/:id/reject - Reject loan request
router.put('/:id/reject', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        if (loan.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Loan is not in pending status'
                }
            });
        }

        loan.status = 'CANCELLED';
        loan.librarianId = req.user.id;
        if (reason) loan.notes = reason;
        await loan.save();

        // Create notification for user
        await notifyLoanRejected(loan._id, reason);

        res.json({
            success: true,
            data: loan,
            message: 'Loan rejected successfully'
        });
    } catch (error) {
        console.error('Reject loan error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to reject loan'
            }
        });
    }
});

// PUT /api/loans/:id/borrow - Mark loan as borrowed
router.put('/:id/borrow', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        if (loan.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Loan must be approved before borrowing'
                }
            });
        }

        loan.status = 'BORROWED';
        loan.loanDate = new Date();
        await loan.save();

        res.json({
            success: true,
            data: loan,
            message: 'Loan marked as borrowed successfully'
        });
    } catch (error) {
        console.error('Mark loan as borrowed error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to mark loan as borrowed'
            }
        });
    }
});

// PUT /api/loans/:id/return - Return books
router.put('/:id/return', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { returnedItems, condition = 'GOOD' } = req.body;

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        if (!['BORROWED', 'PARTIAL_RETURN'].includes(loan.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Loan is not in borrowed status'
                }
            });
        }

        // Update book quantities
        for (const item of returnedItems) {
            const book = await Book.findById(item.bookId);
            if (book) {
                await Book.findByIdAndUpdate(
                    item.bookId,
                    { $inc: { quantityAvailable: item.qty } }
                );
            }
        }

        // Check if all items are returned
        const totalReturned = returnedItems.reduce((sum, item) => sum + item.qty, 0);
        const totalItems = loan.items.reduce((sum, item) => sum + item.qty, 0);

        if (totalReturned >= totalItems) {
            loan.status = 'RETURNED';
        } else {
            loan.status = 'PARTIAL_RETURN';
        }

        await loan.save();

        // Check for fines if overdue
        if (new Date() > loan.dueDate) {
            const policy = await FinePolicy.getCurrent();
            const overdueDays = Math.ceil((new Date() - loan.dueDate) / (1000 * 60 * 60 * 24));
            const fineAmount = overdueDays * policy.lateFeePerDay;

            await Fine.create({
                loanId: loan._id,
                userId: loan.readerUserId,
                type: 'LATE_RETURN',
                amount: fineAmount,
                currency: policy.currency,
                description: `Late return fine for ${overdueDays} days`
            });
        }

        // Check for damage/lost book fines
        const policy = await FinePolicy.getCurrent();
        console.log('Fine policy:', policy);

        for (const item of returnedItems) {
            console.log('Processing item:', item);

            if (item.condition === 'DAMAGED' && item.damageLevel > 0) {
                // Get book price (assuming book has a price field)
                const book = await Book.findById(item.bookId);
                console.log('Book for damage fine:', book);

                if (!book) {
                    console.warn(`Book ${item.bookId} not found for damage fine calculation`);
                    continue;
                }

                if (!book.price || book.price <= 0) {
                    console.warn(`Book ${book.title} has no valid price for damage fine calculation`);
                    continue;
                }

                const damagePercentage = item.damageLevel / 100;
                const fineAmount = Math.round(book.price * policy.damageFeeRate * damagePercentage);
                console.log('Creating damage fine:', fineAmount);

                const fine = await Fine.create({
                    loanId: loan._id,
                    userId: loan.readerUserId,
                    type: 'DAMAGE',
                    amount: fineAmount,
                    currency: policy.currency,
                    description: `Book damage fine: ${item.damageLevel}% damage - ${book.title} (${fineAmount.toLocaleString('vi-VN')} ${policy.currency})`
                });
                console.log('Damage fine created:', fine);

                // Send notification to user
                await notifyFineIssued(fine._id);
            } else if (item.condition === 'LOST') {
                // Get book price for lost book
                const book = await Book.findById(item.bookId);
                console.log('Book for lost fine:', book);

                if (!book) {
                    console.warn(`Book ${item.bookId} not found for lost book fine calculation`);
                    continue;
                }

                if (!book.price || book.price <= 0) {
                    console.warn(`Book ${book.title} has no valid price for lost book fine calculation`);
                    continue;
                }

                const fineAmount = Math.round(book.price * policy.lostBookFeeRate);
                console.log('Creating lost book fine:', fineAmount);

                const fine = await Fine.create({
                    loanId: loan._id,
                    userId: loan.readerUserId,
                    type: 'LOSS',
                    amount: fineAmount,
                    currency: policy.currency,
                    description: `Lost book fine: ${book.title} (${fineAmount.toLocaleString('vi-VN')} ${policy.currency})`
                });
                console.log('Lost book fine created:', fine);

                // Send notification to user
                await notifyFineIssued(fine._id);
            }
        }

        res.json({
            success: true,
            data: loan,
            message: 'Books returned successfully'
        });
    } catch (error) {
        console.error('Return books error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to return books'
            }
        });
    }
});

// POST /api/loans/:id/extend - Request loan extension
router.post('/:id/extend', [
    authenticate,
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { extensionDays, reason } = req.body;

        const loan = await Loan.findById(id);
        if (!loan) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Loan not found'
                }
            });
        }

        if (!['BORROWED', 'PARTIAL_RETURN'].includes(loan.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Loan is not in borrowed status'
                }
            });
        }

        // Check if user already has a pending extension
        const existingExtension = await LoanExtension.findOne({
            loanId: loan._id,
            status: 'PENDING'
        });

        if (existingExtension) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'DUPLICATE_EXTENSION_400',
                    message: 'Extension request already pending'
                }
            });
        }

        const newDueDate = new Date(loan.dueDate);
        newDueDate.setDate(newDueDate.getDate() + extensionDays);

        const extension = await LoanExtension.create({
            loanId: loan._id,
            userId: loan.readerUserId,
            requestedBy: req.user.id,
            currentDueDate: loan.dueDate,
            newDueDate,
            extensionDays,
            reason
        });

        res.json({
            success: true,
            data: extension,
            message: 'Extension request submitted successfully'
        });
    } catch (error) {
        console.error('Request extension error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to request extension'
            }
        });
    }
});

// GET /api/loans/extensions - Get extension requests (for admin/librarian)
router.get('/extensions', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'PENDING' } = req.query;
        const skip = (page - 1) * limit;

        const extensions = await LoanExtension.find({ status })
            .populate('loanId', 'code dueDate status')
            .populate('userId', 'fullName email studentId')
            .populate('requestedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LoanExtension.countDocuments({ status });

        res.json({
            success: true,
            data: extensions,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get extensions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get extension requests'
            }
        });
    }
});

// PUT /api/loans/extensions/:id/approve - Approve extension request
router.put('/extensions/:id/approve', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const extension = await LoanExtension.findById(id);
        if (!extension) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Extension request not found'
                }
            });
        }

        if (extension.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Extension request is not pending'
                }
            });
        }

        // Update loan due date
        await Loan.findByIdAndUpdate(extension.loanId, {
            dueDate: extension.newDueDate
        });

        // Update extension status
        extension.status = 'APPROVED';
        extension.reviewedBy = req.user.id;
        extension.reviewedAt = new Date();
        if (reviewNotes) extension.reviewNotes = reviewNotes;
        await extension.save();

        res.json({
            success: true,
            data: extension,
            message: 'Extension approved successfully'
        });
    } catch (error) {
        console.error('Approve extension error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to approve extension'
            }
        });
    }
});

// PUT /api/loans/extensions/:id/reject - Reject extension request
router.put('/extensions/:id/reject', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const extension = await LoanExtension.findById(id);
        if (!extension) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Extension request not found'
                }
            });
        }

        if (extension.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Extension request is not pending'
                }
            });
        }

        extension.status = 'REJECTED';
        extension.reviewedBy = req.user.id;
        extension.reviewedAt = new Date();
        if (reviewNotes) extension.reviewNotes = reviewNotes;
        await extension.save();

        res.json({
            success: true,
            data: extension,
            message: 'Extension rejected successfully'
        });
    } catch (error) {
        console.error('Reject extension error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to reject extension'
            }
        });
    }
});

// GET /api/loans/fines - Get fines
router.get('/fines', [
    authenticate,
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10, status = 'PENDING' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.user.role === 'USER') {
            query.userId = req.user.id;
        }
        if (status) {
            query.status = status;
        }

        console.log('Fines query:', query);
        console.log('User role:', req.user.role);

        const fines = await Fine.find(query)
            .populate('userId', 'fullName email')
            .populate('loanId', 'code status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        console.log('Fines with populated data:', JSON.stringify(fines, null, 2));

        const total = await Fine.countDocuments(query);

        res.json({
            success: true,
            data: fines,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get fines error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get fines'
            }
        });
    }
});

// PUT /api/loans/fines/:id/pay - Pay fine
router.put('/fines/:id/pay', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const fine = await Fine.findById(id);
        if (!fine) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Fine not found'
                }
            });
        }

        if (fine.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Fine is not pending'
                }
            });
        }

        fine.status = 'PAID';
        fine.paidAt = new Date();
        fine.paidBy = req.user.id;
        await fine.save();

        // Send notification to user
        await notifyFinePaid(fine._id);

        res.json({
            success: true,
            data: fine,
            message: 'Fine paid successfully'
        });
    } catch (error) {
        console.error('Pay fine error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to pay fine'
            }
        });
    }
});

// PUT /api/loans/fines/:id/waive - Waive fine
router.put('/fines/:id/waive', [
    authenticate,
    authorize(['ADMIN', 'LIBRARIAN']),
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const fine = await Fine.findById(id);
        if (!fine) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Fine not found'
                }
            });
        }

        if (fine.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS_400',
                    message: 'Fine is not pending'
                }
            });
        }

        fine.status = 'WAIVED';
        fine.waivedAt = new Date();
        fine.waivedBy = req.user.id;
        if (reason) fine.waivedReason = reason;
        await fine.save();

        // Send notification to user
        await notifyFineWaived(fine._id, reason);

        res.json({
            success: true,
            data: fine,
            message: 'Fine waived successfully'
        });
    } catch (error) {
        console.error('Waive fine error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to waive fine'
            }
        });
    }
});

module.exports = router;
