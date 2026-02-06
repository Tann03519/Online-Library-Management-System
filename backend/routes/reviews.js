const express = require('express');
const { body, query } = require('express-validator');
const Review = require('../models/Review');
const Book = require('../models/Book');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { notifyReviewHidden, notifyReviewShown } = require('../utils/notificationHelper');

const router = express.Router();

// POST /api/reviews - Create new review (USER only)
router.post('/', authenticate, authorize('USER'), [
    body('bookId').isMongoId().withMessage('Invalid book ID format'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').isString().isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        console.log('Create review request body:', req.body);
        console.log('User ID:', req.user._id);
        const { bookId, rating, comment } = req.body;
        const userId = req.user._id;

        // Convert rating to number if it's a string
        const numericRating = parseInt(rating);

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOK_NOT_FOUND',
                    message: 'Book not found'
                }
            });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ bookId, userId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'REVIEW_EXISTS',
                    message: 'Bạn đã đánh giá cuốn sách này rồi. Mỗi người dùng chỉ được đánh giá 1 lần cho 1 cuốn sách.'
                }
            });
        }

        // Create new review
        const review = new Review({
            bookId,
            userId,
            rating: numericRating,
            comment,
            status: 'ACTIVE' // Reviews are now active by default
        });

        await review.save();

        // Populate the review with user and book data
        await review.populate('userId', 'fullName email');
        await review.populate('bookId', 'title author');

        res.status(201).json({
            success: true,
            data: {
                _id: review._id,
                bookTitle: review.bookId?.title,
                bookAuthor: review.bookId?.author,
                userName: review.userId?.fullName,
                userEmail: review.userId?.email,
                rating: review.rating,
                comment: review.comment,
                status: review.status,
                createdAt: review.createdAt,
                helpful: review.helpful,
                reportCount: review.reportCount,
                isAnonymous: review.isAnonymous
            }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create review'
            }
        });
    }
});

// GET /api/reviews - Get all reviews with filters (ADMIN/LIBRARIAN only)
router.get('/', authenticate, authorize('ADMIN', 'LIBRARIAN'), [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    query('status').optional().isIn(['ACTIVE', 'HIDDEN']).withMessage('Invalid status'),
    handleValidationErrors
], async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            rating = '',
            status = ''
        } = req.query;

        // Build filter object
        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (rating) {
            filter.rating = parseInt(rating);
        }

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { comment: { $regex: search, $options: 'i' } },
                    { 'book.title': { $regex: search, $options: 'i' } },
                    { 'user.fullName': { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get reviews with populated data
        const reviews = await Review.find({ ...filter, ...searchQuery })
            .populate('bookId', 'title author')
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Review.countDocuments({ ...filter, ...searchQuery });

        // Transform data for frontend
        const transformedReviews = reviews.map(review => ({
            _id: review._id,
            bookTitle: review.bookId?.title || 'Sách đã bị xóa',
            bookAuthor: review.bookId?.author || 'Không xác định',
            userName: review.userId?.fullName || 'Người dùng đã bị xóa',
            userEmail: review.userId?.email || 'Không xác định',
            rating: review.rating,
            comment: review.comment,
            status: review.status,
            createdAt: review.createdAt,
            helpful: review.helpful,
            reportCount: review.reportCount,
            isAnonymous: review.isAnonymous
        }));

        res.json({
            success: true,
            data: {
                reviews: transformedReviews,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get reviews'
            }
        });
    }
});

// GET /api/reviews/book/:bookId - Get reviews for a specific book
router.get('/book/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOK_NOT_FOUND',
                    message: 'Book not found'
                }
            });
        }

        // Get reviews for the book (both ACTIVE and HIDDEN for public display)
        const reviews = await Review.find({ bookId })
            .populate('userId', 'fullName email')
            .populate('bookId', 'title author')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get total count (both ACTIVE and HIDDEN)
        const total = await Review.countDocuments({ bookId });

        res.json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    _id: review._id,
                    bookTitle: review.bookId?.title,
                    bookAuthor: review.bookId?.author,
                    userName: review.userId?.fullName,
                    userEmail: review.userId?.email,
                    rating: review.rating,
                    comment: review.comment,
                    status: review.status,
                    createdAt: review.createdAt,
                    helpful: review.helpful,
                    reportCount: review.reportCount,
                    isAnonymous: review.isAnonymous
                })),
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get book reviews error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get book reviews'
            }
        });
    }
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('bookId', 'title author')
            .populate('userId', 'fullName email');

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REVIEW_NOT_FOUND',
                    message: 'Review not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                _id: review._id,
                bookTitle: review.bookId?.title || 'Sách đã bị xóa',
                bookAuthor: review.bookId?.author || 'Không xác định',
                userName: review.userId?.fullName || 'Người dùng đã bị xóa',
                userEmail: review.userId?.email || 'Không xác định',
                rating: review.rating,
                comment: review.comment,
                status: review.status,
                createdAt: review.createdAt,
                helpful: review.helpful,
                reportCount: review.reportCount,
                isAnonymous: review.isAnonymous
            }
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get review'
            }
        });
    }
});

// PUT /api/reviews/:id/hide - Hide review
router.put('/:id/hide', authenticate, authorize('ADMIN', 'LIBRARIAN'), async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status: 'HIDDEN' },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REVIEW_NOT_FOUND',
                    message: 'Review not found'
                }
            });
        }

        // Create notification for user
        await notifyReviewHidden(review._id);

        res.json({
            success: true,
            data: {
                message: 'Review hidden successfully',
                review: {
                    _id: review._id,
                    status: review.status
                }
            }
        });
    } catch (error) {
        console.error('Hide review error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to hide review'
            }
        });
    }
});

// PUT /api/reviews/:id/show - Show review
router.put('/:id/show', authenticate, authorize('ADMIN', 'LIBRARIAN'), async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { status: 'ACTIVE' },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REVIEW_NOT_FOUND',
                    message: 'Review not found'
                }
            });
        }

        // Create notification for user
        await notifyReviewShown(review._id);

        res.json({
            success: true,
            data: {
                message: 'Review shown successfully',
                review: {
                    _id: review._id,
                    status: review.status
                }
            }
        });
    } catch (error) {
        console.error('Show review error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to show review'
            }
        });
    }
});

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', authenticate, authorize('ADMIN', 'LIBRARIAN'), async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'REVIEW_NOT_FOUND',
                    message: 'Review not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Review deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete review'
            }
        });
    }
});

module.exports = router;