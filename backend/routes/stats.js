const express = require('express');
const { body } = require('express-validator');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/stats/summary (LIBRARIAN/ADMIN only)
router.get('/summary', authenticate, authorize('LIBRARIAN', 'ADMIN'), async (req, res) => {
    try {
        const [
            totalBooks,
            totalBorrowed,
            totalUsers,
            totalLibrarians,
            activeLoans,
            overdueLoans
        ] = await Promise.all([
            Book.countDocuments({ status: 'ACTIVE' }),
            Loan.countDocuments({ status: { $in: ['OPEN', 'PARTIAL_RETURN'] } }),
            User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
            User.countDocuments({ role: { $in: ['LIBRARIAN', 'ADMIN'] }, status: 'ACTIVE' }),
            Loan.countDocuments({ status: 'OPEN' }),
            Loan.countDocuments({ status: 'OPEN', dueDate: { $lt: new Date() } })
        ]);

        res.json({
            success: true,
            data: {
                totalBooks,
                totalBorrowed,
                totalUsers,
                totalLibrarians,
                activeLoans,
                overdueLoans
            }
        });
    } catch (error) {
        console.error('Get summary stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get summary statistics'
            }
        });
    }
});

// GET /api/stats/books-by-category (LIBRARIAN/ADMIN only)
router.get('/books-by-category', authenticate, authorize('LIBRARIAN', 'ADMIN'), async (req, res) => {
    try {
        const Category = require('../models/Category');

        const booksByCategory = await Book.aggregate([
            { $match: { status: 'ACTIVE' } },
            {
                $group: {
                    _id: '$categoryId',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantityTotal' },
                    availableQuantity: { $sum: '$quantityAvailable' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $project: {
                    categoryName: '$category.name',
                    categorySlug: '$category.slug',
                    count: 1,
                    totalQuantity: 1,
                    availableQuantity: 1
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: booksByCategory
        });
    } catch (error) {
        console.error('Get books by category stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get books by category statistics'
            }
        });
    }
});

// GET /api/stats/borrows-monthly (LIBRARIAN/ADMIN only)
router.get('/borrows-monthly', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('year').optional().isInt({ min: 2000, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        const monthlyBorrows = await Loan.aggregate([
            {
                $match: {
                    loanDate: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$loanDate' },
                        month: { $month: '$loanDate' }
                    },
                    totalLoans: { $sum: 1 },
                    totalItems: { $sum: { $sum: '$items.qty' } }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Fill in missing months with 0 values
        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const existingData = monthlyBorrows.find(item => item._id.month === month);
            monthlyData.push({
                year: parseInt(year),
                month,
                totalLoans: existingData ? existingData.totalLoans : 0,
                totalItems: existingData ? existingData.totalItems : 0
            });
        }

        res.json({
            success: true,
            data: monthlyData
        });
    } catch (error) {
        console.error('Get monthly borrows stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get monthly borrows statistics'
            }
        });
    }
});

// GET /api/stats/top-books (LIBRARIAN/ADMIN only)
router.get('/top-books', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const topBooks = await Book.aggregate([
            { $match: { status: 'ACTIVE' } },
            {
                $lookup: {
                    from: 'loans',
                    localField: '_id',
                    foreignField: 'items.bookId',
                    as: 'loans'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    borrowCount: {
                        $sum: {
                            $map: {
                                input: '$loans',
                                as: 'loan',
                                in: {
                                    $sum: {
                                        $map: {
                                            input: '$$loan.items',
                                            as: 'item',
                                            in: {
                                                $cond: [
                                                    { $eq: ['$$item.bookId', '$_id'] },
                                                    '$$item.qty',
                                                    0
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    author: 1,
                    isbn: 1,
                    categoryName: '$category.name',
                    categorySlug: '$category.slug',
                    borrowCount: 1,
                    quantityTotal: 1,
                    quantityAvailable: 1,
                    views: 1
                }
            },
            {
                $sort: { borrowCount: -1, views: -1 }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        res.json({
            success: true,
            data: topBooks
        });
    } catch (error) {
        console.error('Get top books stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get top books statistics'
            }
        });
    }
});

// GET /api/stats/user-registrations (LIBRARIAN/ADMIN only)
router.get('/user-registrations', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('year').optional().isInt({ min: 2000, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        const monthlyRegistrations = await User.aggregate([
            {
                $match: {
                    role: 'USER',
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Fill in missing months with 0 values
        const monthlyData = [];
        for (let month = 1; month <= 12; month++) {
            const existingData = monthlyRegistrations.find(item => item._id.month === month);
            monthlyData.push({
                year: parseInt(year),
                month,
                totalUsers: existingData ? existingData.totalUsers : 0
            });
        }

        // Get total users and new users this month
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const [totalUsers, newUsersThisMonth] = await Promise.all([
            User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
            User.countDocuments({
                role: 'USER',
                status: 'ACTIVE',
                createdAt: {
                    $gte: new Date(`${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`),
                    $lt: new Date(`${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                monthlyData,
                totalUsers,
                newUsersThisMonth
            }
        });
    } catch (error) {
        console.error('Get user registrations stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user registrations statistics'
            }
        });
    }
});

module.exports = router;
