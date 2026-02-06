const express = require('express');
const { body } = require('express-validator');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/departments (Public)
router.get('/', [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { q, facultyId, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (facultyId) query.facultyId = facultyId;
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { code: { $regex: q, $options: 'i' } }
            ];
        }

        // Get departments with pagination
        const [departments, total] = await Promise.all([
            Department.find(query)
                .populate('facultyId', 'name code')
                .sort({ name: 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Department.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: departments,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get departments'
            }
        });
    }
});

// GET /api/departments/:id (Public)
router.get('/:id', [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const department = await Department.findById(id).populate('facultyId', 'name code');
        if (!department) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Department not found'
                }
            });
        }

        res.json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Get department error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get department'
            }
        });
    }
});

// POST /api/departments (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('code').trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
    body('facultyId').isMongoId().withMessage('Invalid faculty ID'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { name, code, facultyId } = req.body;

        // Check if faculty exists
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Faculty not found'
                }
            });
        }

        // Check if department already exists within the faculty
        const existingDepartment = await Department.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } }, // Same name
                { code: { $regex: new RegExp(`^${code}$`, 'i') } }  // Same code
            ],
            facultyId
        });

        if (existingDepartment) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Department with this name or code already exists in this faculty'
                }
            });
        }

        const department = new Department({ name, code, facultyId });
        await department.save();

        // Populate faculty info
        await department.populate('facultyId', 'name code');

        res.status(201).json({
            success: true,
            data: department
        });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create department'
            }
        });
    }
});

// PUT /api/departments/:id (LIBRARIAN/ADMIN only)
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters'),
    body('facultyId').optional().isMongoId().withMessage('Invalid faculty ID'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, facultyId } = req.body;

        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Department not found'
                }
            });
        }

        // Check if faculty exists (if being changed)
        if (facultyId && facultyId !== department.facultyId.toString()) {
            const faculty = await Faculty.findById(facultyId);
            if (!faculty) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND_404',
                        message: 'Faculty not found'
                    }
                });
            }
        }

        // Check if name or code is being changed and if it already exists
        if (name || code) {
            const existingDepartment = await Department.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }] : []),
                    ...(code ? [{ code: { $regex: new RegExp(`^${code}$`, 'i') } }] : [])
                ],
                facultyId: facultyId || department.facultyId
            });

            if (existingDepartment) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Department with this name or code already exists in this faculty'
                    }
                });
            }
        }

        const updates = {};
        if (name) updates.name = name;
        if (code) updates.code = code;
        if (facultyId) updates.facultyId = facultyId;

        const updatedDepartment = await Department.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).populate('facultyId', 'name code');

        res.json({
            success: true,
            data: updatedDepartment
        });
    } catch (error) {
        console.error('Update department error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update department'
            }
        });
    }
});

// DELETE /api/departments/:id (LIBRARIAN/ADMIN only)
router.delete('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if department is being used by any books
        const Book = require('../models/Book');
        const booksUsingDepartment = await Book.countDocuments({ departmentId: id });

        if (booksUsingDepartment > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: `Cannot delete department. It is being used by ${booksUsingDepartment} book(s)`
                }
            });
        }

        const department = await Department.findByIdAndDelete(id);
        if (!department) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Department not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Department deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete department'
            }
        });
    }
});

module.exports = router;
