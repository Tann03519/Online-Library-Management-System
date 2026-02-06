const express = require('express');
const { body } = require('express-validator');
const Faculty = require('../models/Faculty');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/faculties (Public)
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
                { code: { $regex: q, $options: 'i' } }
            ];
        }

        // Get faculties with pagination
        const [faculties, total] = await Promise.all([
            Faculty.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Faculty.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: faculties,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get faculties error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get faculties'
            }
        });
    }
});

// GET /api/faculties/:id (Public)
router.get('/:id', [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Faculty not found'
                }
            });
        }

        res.json({
            success: true,
            data: faculty
        });
    } catch (error) {
        console.error('Get faculty error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get faculty'
            }
        });
    }
});

// POST /api/faculties (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { name, code } = req.body;

        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { code: { $regex: new RegExp(`^${code}$`, 'i') } }
            ]
        });

        if (existingFaculty) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Faculty with this name or code already exists'
                }
            });
        }

        const faculty = new Faculty({ name, code });
        await faculty.save();

        res.status(201).json({
            success: true,
            data: faculty
        });
    } catch (error) {
        console.error('Create faculty error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create faculty'
            }
        });
    }
});

// PUT /api/faculties/:id (LIBRARIAN/ADMIN only)
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;

        const faculty = await Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Faculty not found'
                }
            });
        }

        // Check if name or code is being changed and if it already exists
        if (name || code) {
            const existingFaculty = await Faculty.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
                    ...(code ? [{ code: { $regex: new RegExp(`^${code}$`, 'i') } }] : [])
                ]
            });

            if (existingFaculty) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Faculty with this name or code already exists'
                    }
                });
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (code) updates.code = code;

        const updatedFaculty = await Faculty.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedFaculty
        });
    } catch (error) {
        console.error('Update faculty error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update faculty'
            }
        });
    }
});

// DELETE /api/faculties/:id (LIBRARIAN/ADMIN only)
router.delete('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if faculty is being used by any books or departments
        const Book = require('../models/Book');
        const Department = require('../models/Department');

        const [booksUsingFaculty, departmentsUsingFaculty] = await Promise.all([
            Book.countDocuments({ facultyId: id }),
            Department.countDocuments({ facultyId: id })
        ]);

        if (booksUsingFaculty > 0 || departmentsUsingFaculty > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: `Cannot delete faculty. It is being used by ${booksUsingFaculty} book(s) and ${departmentsUsingFaculty} department(s)`
                }
            });
        }

        const faculty = await Faculty.findByIdAndDelete(id);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Faculty not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Faculty deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete faculty error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete faculty'
            }
        });
    }
});

module.exports = router;
