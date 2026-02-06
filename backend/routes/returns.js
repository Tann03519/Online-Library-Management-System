const express = require('express');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const Return = require('../models/Return');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const FinePolicy = require('../models/FinePolicy');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, returnValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/returns (LIBRARIAN/ADMIN only)
router.get('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const {
            loanId,
            librarianId,
            from,
            to,
            page = 1,
            limit = 10
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        if (loanId) query.loanId = loanId;
        if (librarianId) query.librarianId = librarianId;

        if (from || to) {
            query.returnDate = {};
            if (from) query.returnDate.$gte = new Date(from);
            if (to) query.returnDate.$lte = new Date(to);
        }

        // Get returns with pagination
        const [returns, total] = await Promise.all([
            Return.find(query)
                .populate('loanId', 'code readerUserId dueDate')
                .populate('loanId.readerUserId', 'fullName email')
                .populate('librarianId', 'fullName email')
                .populate('items.bookId', 'title isbn authors')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Return.countDocuments(query)
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
        console.error('Get returns error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get returns'
            }
        });
    }
});

// GET /api/returns/:id (LIBRARIAN/ADMIN only)
router.get('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const returnRecord = await Return.findById(id)
            .populate('loanId', 'code readerUserId dueDate')
            .populate('loanId.readerUserId', 'fullName email')
            .populate('librarianId', 'fullName email')
            .populate('items.bookId', 'title isbn authors coverImageUrl');

        if (!returnRecord) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Return record not found'
                }
            });
        }

        res.json({
            success: true,
            data: returnRecord
        });
    } catch (error) {
        console.error('Get return error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get return record'
            }
        });
    }
});

// POST /api/returns (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), returnValidations.create, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const { loanId, items } = req.body;
            const librarianId = req.user._id;

            // Get loan details
            const loan = await Loan.findById(loanId).populate('items.bookId');
            if (!loan) {
                throw new Error('Loan not found');
            }

            if (loan.status === 'CLOSED') {
                throw new Error('Loan is already closed');
            }

            // Get fine policy
            const finePolicy = await FinePolicy.getCurrent();

            // Validate return items
            const loanItemsMap = new Map();
            loan.items.forEach(item => {
                loanItemsMap.set(item.bookId.toString(), item.qty);
            });

            const returnedItemsMap = new Map();
            for (const item of items) {
                const bookId = item.bookId.toString();
                const loanQty = loanItemsMap.get(bookId);

                if (!loanQty) {
                    throw new Error(`Book ${item.bookId} is not in this loan`);
                }

                const currentReturned = returnedItemsMap.get(bookId) || 0;
                const newTotal = currentReturned + item.qty;

                if (newTotal > loanQty) {
                    throw new Error(`Cannot return more than borrowed for book ${item.bookId}. Borrowed: ${loanQty}, Returning: ${newTotal}`);
                }

                returnedItemsMap.set(bookId, newTotal);
            }

            // Calculate fees for each item
            const returnItems = [];
            let totalAmount = 0;

            for (const item of items) {
                const book = await Book.findById(item.bookId);
                if (!book) {
                    throw new Error(`Book ${item.bookId} not found`);
                }

                // Calculate late days
                const today = new Date();
                const dueDate = new Date(loan.dueDate);
                const lateDays = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));

                // Calculate fees
                const lateFee = lateDays * finePolicy.lateFeePerDay * item.qty;
                const damageFee = item.condition === 'DAMAGED'
                    ? (item.damagePercent / 100) * finePolicy.damageFeeRate * book.quantityTotal * item.qty
                    : 0;
                const otherFee = item.otherFee || 0;
                const itemTotalFee = lateFee + damageFee + otherFee;

                const returnItem = {
                    bookId: item.bookId,
                    qty: item.qty,
                    condition: item.condition,
                    damagePercent: item.damagePercent || 0,
                    lateDays,
                    lateFee,
                    damageFee,
                    otherFee,
                    totalFee: itemTotalFee
                };

                returnItems.push(returnItem);
                totalAmount += itemTotalFee;
            }

            // Create return record
            const returnRecord = new Return({
                loanId,
                librarianId,
                items: returnItems,
                totalAmount
            });

            await returnRecord.save({ session });

            // Update book quantities (add back to available stock)
            for (const item of items) {
                await Book.findByIdAndUpdate(
                    item.bookId,
                    { $inc: { quantityAvailable: item.qty } },
                    { session }
                );
            }

            // Update loan status
            const allReturned = Array.from(returnedItemsMap.entries()).every(([bookId, returnedQty]) => {
                const loanQty = loanItemsMap.get(bookId);
                return returnedQty === loanQty;
            });

            const newLoanStatus = allReturned ? 'CLOSED' : 'PARTIAL_RETURN';
            await Loan.findByIdAndUpdate(
                loanId,
                { status: newLoanStatus },
                { session }
            );

            // Populate return data
            await returnRecord.populate([
                { path: 'loanId', select: 'code readerUserId dueDate' },
                { path: 'loanId.readerUserId', select: 'fullName email' },
                { path: 'librarianId', select: 'fullName email' },
                { path: 'items.bookId', select: 'title isbn authors' }
            ]);

            res.status(201).json({
                success: true,
                data: {
                    return: returnRecord,
                    loanStatus: newLoanStatus,
                    finePolicy: {
                        lateFeePerDay: finePolicy.lateFeePerDay,
                        damageFeeRate: finePolicy.damageFeeRate,
                        currency: finePolicy.currency
                    }
                }
            });
        });
    } catch (error) {
        console.error('Create return error:', error);

        if (error.message.includes('not found') ||
            error.message.includes('already closed') ||
            error.message.includes('not in this loan') ||
            error.message.includes('Cannot return more')) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: error.message
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to process return'
            }
        });
    } finally {
        await session.endSession();
    }
});

// POST /api/returns/:id/print (LIBRARIAN/ADMIN only)
router.post('/:id/print', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const returnRecord = await Return.findById(id)
            .populate('loanId', 'code readerUserId dueDate')
            .populate('loanId.readerUserId', 'fullName email')
            .populate('librarianId', 'fullName email')
            .populate('items.bookId', 'title isbn authors');

        if (!returnRecord) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Return record not found'
                }
            });
        }

        // TODO: Implement PDF generation using puppeteer
        // For now, return return data for frontend to generate PDF
        res.json({
            success: true,
            data: {
                return: returnRecord,
                printData: {
                    type: 'RETURN',
                    title: 'Phiếu Trả Sách',
                    generatedAt: new Date().toISOString(),
                    generatedBy: req.user.fullName
                }
            }
        });
    } catch (error) {
        console.error('Print return error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to generate return print'
            }
        });
    }
});

module.exports = router;
