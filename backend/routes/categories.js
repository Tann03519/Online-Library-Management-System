const express = require('express');
const { body } = require('express-validator');
const Category = require('../models/Category');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/categories (Public)
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

        // Get categories with book count statistics
        const categories = await Category.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get book count for each category
        const Book = require('../models/Book');
        const categoriesWithStats = await Promise.all(
            categories.map(async (category) => {
                const bookCount = await Book.countDocuments({ categoryId: category._id });
                return {
                    ...category.toObject(),
                    bookCount
                };
            })
        );

        const total = await Category.countDocuments(query);

        res.json({
            success: true,
            data: categoriesWithStats,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get categories'
            }
        });
    }
});

// GET /api/categories/:id (Public)
router.get('/:id', [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Category not found'
                }
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get category'
            }
        });
    }
});

// POST /api/categories (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { name, slug } = req.body;

        // Auto-generate slug if not provided
        const autoSlug = slug || name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Check if category already exists (check both name and final slug)
        const existingCategory = await Category.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { slug: autoSlug }
            ]
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Category with this name or slug already exists'
                }
            });
        }

        const category = new Category({ name, slug: autoSlug });
        await category.save();

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create category'
            }
        });
    }
});

// PUT /api/categories/:id (LIBRARIAN/ADMIN only)
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Category not found'
                }
            });
        }

        // Check if name or slug is being changed and if it already exists
        if (name || slug) {
            const existingCategory = await Category.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
                    ...(slug ? [{ slug }] : [])
                ]
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Category with this name or slug already exists'
                    }
                });
            }
        }

        const updates = {};
        if (name) {
            updates.name = name;
            // Auto-generate slug if name is changed and slug not provided
            if (!slug) {
                updates.slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }
        }
        if (slug) updates.slug = slug;

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedCategory
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update category'
            }
        });
    }
});

// DELETE /api/categories/:id (LIBRARIAN/ADMIN only)
router.delete('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category is being used by any books
        const Book = require('../models/Book');
        const booksUsingCategory = await Book.countDocuments({ categoryId: id });

        if (booksUsingCategory > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: `Cannot delete category. It is being used by ${booksUsingCategory} book(s)`
                }
            });
        }

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Category not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Category deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete category'
            }
        });
    }
});

module.exports = router;
