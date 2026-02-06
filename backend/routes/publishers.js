const express = require('express');
const { body } = require('express-validator');
const Publisher = require('../models/Publisher');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/publishers (Public)
router.get('/', [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { slug: { $regex: q, $options: 'i' } }
            ];
        }

        // Get publishers with pagination
        const [publishers, total] = await Promise.all([
            Publisher.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Publisher.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: publishers,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get publishers error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get publishers'
            }
        });
    }
});

// GET /api/publishers/:id (Public)
router.get('/:id', [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const publisher = await Publisher.findById(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Publisher not found'
                }
            });
        }

        res.json({
            success: true,
            data: publisher
        });
    } catch (error) {
        console.error('Get publisher error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get publisher'
            }
        });
    }
});

// POST /api/publishers (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { name, slug } = req.body;

        // Check if publisher already exists
        const existingPublisher = await Publisher.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                ...(slug ? [{ slug }] : [])
            ]
        });

        if (existingPublisher) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Publisher with this name or slug already exists'
                }
            });
        }

        const publisher = new Publisher({ name, slug });
        await publisher.save();

        res.status(201).json({
            success: true,
            data: publisher
        });
    } catch (error) {
        console.error('Create publisher error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create publisher'
            }
        });
    }
});

// PUT /api/publishers/:id (LIBRARIAN/ADMIN only)
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug } = req.body;

        const publisher = await Publisher.findById(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Publisher not found'
                }
            });
        }

        // Check if name or slug is being changed and if it already exists
        if (name || slug) {
            const existingPublisher = await Publisher.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
                    ...(slug ? [{ slug }] : [])
                ]
            });

            if (existingPublisher) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Publisher with this name or slug already exists'
                    }
                });
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (slug) updates.slug = slug;

        const updatedPublisher = await Publisher.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedPublisher
        });
    } catch (error) {
        console.error('Update publisher error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update publisher'
            }
        });
    }
});

// DELETE /api/publishers/:id (LIBRARIAN/ADMIN only)
router.delete('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if publisher is being used by any books
        const Book = require('../models/Book');
        const booksUsingPublisher = await Book.countDocuments({ publisherId: id });

        if (booksUsingPublisher > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: `Cannot delete publisher. It is being used by ${booksUsingPublisher} book(s)`
                }
            });
        }

        const publisher = await Publisher.findByIdAndDelete(id);
        if (!publisher) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Publisher not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Publisher deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete publisher error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete publisher'
            }
        });
    }
});

module.exports = router;
