const express = require('express');
const Favorite = require('../models/Favorite');
const Book = require('../models/Book');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/favorites (USER only)
router.get('/', authenticate, authorize('USER'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Get user's favorites with book details
        const [favorites, total] = await Promise.all([
            Favorite.find({ userId })
                .populate('bookId', 'title authors coverImageUrl isbn year categoryId publisherId quantityAvailable')
                .populate('bookId.categoryId', 'name')
                .populate('bookId.publisherId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Favorite.countDocuments({ userId })
        ]);

        res.json({
            success: true,
            data: favorites,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get favorites'
            }
        });
    }
});

// POST /api/favorites (USER only)
router.post('/', authenticate, authorize('USER'), async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user._id;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Book not found'
                }
            });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ userId, bookId });
        if (existingFavorite) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT_409',
                    message: 'Book already in favorites'
                }
            });
        }

        // Create favorite
        const favorite = new Favorite({ userId, bookId });
        await favorite.save();

        // Populate book details
        await favorite.populate('bookId', 'title authors coverImageUrl isbn year categoryId publisherId quantityAvailable');
        await favorite.populate('bookId.categoryId', 'name');
        await favorite.populate('bookId.publisherId', 'name');

        res.status(201).json({
            success: true,
            data: favorite
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to add favorite'
            }
        });
    }
});

// DELETE /api/favorites/:bookId (USER only)
router.delete('/:bookId', authenticate, authorize('USER'), async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const favorite = await Favorite.findOneAndDelete({ userId, bookId });
        if (!favorite) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Favorite not found'
                }
            });
        }

        res.json({
            success: true,
            message: 'Favorite removed successfully'
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to remove favorite'
            }
        });
    }
});

// GET /api/favorites/check/:bookId (USER only)
router.get('/check/:bookId', authenticate, authorize('USER'), async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const favorite = await Favorite.findOne({ userId, bookId });

        res.json({
            success: true,
            data: {
                isFavorited: !!favorite
            }
        });
    } catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to check favorite status'
            }
        });
    }
});

module.exports = router;
