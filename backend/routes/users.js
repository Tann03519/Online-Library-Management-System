const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const User = require('../models/User');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const LoanExtension = require('../models/LoanExtension');
const { authenticate, authorize } = require('../middleware/auth');
const { commonValidations, authValidations, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Configure multer for avatar upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user profile'
            }
        });
    }
});

// GET /api/users/loans
router.get('/loans', authenticate, [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { status, q, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Build query
        const query = { readerUserId: userId };
        if (status) {
            // Map frontend status to backend status
            if (status === 'RETURNED') {
                query.status = 'CLOSED';
            } else {
                query.status = status;
            }
        }
        if (q) {
            query.$or = [
                { code: { $regex: q, $options: 'i' } },
                { 'items.bookId.title': { $regex: q, $options: 'i' } },
                { 'items.bookId.authors': { $regex: q, $options: 'i' } }
            ];
        }

        // Get loans with pagination
        const [loans, total] = await Promise.all([
            Loan.find(query)
                .populate('items.bookId', 'title isbn authors coverImageUrl')
                .populate('readerUserId', 'fullName email')
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
        console.error('Get user loans error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user loans'
            }
        });
    }
});

// GET /api/users/me/extensions - Get user's extension requests
router.get('/me/extensions', authenticate, [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Build query
        const query = { userId };
        if (status) {
            query.status = status;
        }

        const extensions = await LoanExtension.find(query)
            .populate('loanId', 'code dueDate status')
            .populate('requestedBy', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await LoanExtension.countDocuments(query);

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
        console.error('Get user extensions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user extensions'
            }
        });
    }
});

// PUT /api/users/me
router.put('/me', authenticate, [
    commonValidations.name('fullName'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('email').optional().normalizeEmail(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const updates = { fullName };

        // Check if email is being changed
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Email already exists'
                    }
                });
            }
            updates.email = email;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update profile'
            }
        });
    }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, [
    commonValidations.name('fullName'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('email').optional().normalizeEmail(),
    handleValidationErrors
], async (req, res) => {
    try {
        const { fullName, email } = req.body;
        const updates = {};

        if (fullName) updates.fullName = fullName;
        if (email && email !== req.user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Email already exists'
                    }
                });
            }
            updates.email = email;
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update profile'
            }
        });
    }
});

// GET /api/users/my-stats - User's personal stats
router.get('/my-stats', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;

        const [
            totalLoans,
            activeLoans,
            returnedLoans,
            overdueLoans,
            totalFines,
            paidFines
        ] = await Promise.all([
            Loan.countDocuments({ readerUserId: userId }),
            Loan.countDocuments({ readerUserId: userId, status: 'BORROWED' }),
            Loan.countDocuments({ readerUserId: userId, status: 'RETURNED' }),
            Loan.countDocuments({ readerUserId: userId, status: 'OVERDUE' }),
            Loan.countDocuments({ readerUserId: userId, status: 'OVERDUE' }),
            Loan.countDocuments({ readerUserId: userId, status: 'RETURNED' })
        ]);

        res.json({
            success: true,
            data: {
                totalLoans,
                activeLoans,
                returnedLoans,
                overdueLoans,
                totalFines,
                paidFines
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user statistics'
            }
        });
    }
});

// GET /api/stats - Admin/Librarian stats
router.get('/admin-stats', authenticate, authorize(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [
            totalBooks,
            monthlyLoans,
            activeUsers,
            overdueBooks
        ] = await Promise.all([
            Book.countDocuments(),
            Loan.countDocuments({
                loanDate: { $gte: startOfMonth }
            }),
            User.countDocuments({
                status: 'ACTIVE',
                lastLoginAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }),
            Loan.countDocuments({
                status: 'OPEN',
                dueDate: { $lt: now }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalBooks,
                monthlyLoans,
                activeUsers,
                overdueBooks
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get statistics'
            }
        });
    }
});

// PUT /api/users/me/password
router.put('/me/password', authenticate, authValidations.changePassword, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const user = await User.findById(req.user._id);
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Current password is incorrect'
                }
            });
        }

        // Hash password directly
        const salt = await bcrypt.genSalt(12);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        console.log('Old passwordHash:', user.passwordHash.substring(0, 20));
        console.log('New passwordHash:', newPasswordHash.substring(0, 20));
        user.passwordHash = newPasswordHash;
        await user.save();
        console.log('Password updated in database');

        res.json({
            success: true,
            data: {
                message: 'Password updated successfully'
            }
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to change password'
            }
        });
    }
});

// PATCH /api/users/notifications - Update notification settings
router.patch('/notifications', authenticate, async (req, res) => {
    try {
        const { email, push, sms, loanReminders, fineAlerts, newBooks } = req.body;

        const notificationSettings = {
            email: email || false,
            push: push || false,
            sms: sms || false,
            loanReminders: loanReminders || false,
            fineAlerts: fineAlerts || false,
            newBooks: newBooks || false
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { notificationSettings },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update notification settings'
            }
        });
    }
});

// POST /api/users/me/avatar
router.post('/me/avatar', authenticate, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Avatar file is required'
                }
            });
        }

        // Delete old avatar if exists
        if (req.user.avatarUrl) {
            const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(req.user.avatarUrl));
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Update user avatar URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatarUrl },
            { new: true }
        );

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                avatarUrl
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to upload avatar'
            }
        });
    }
});

// GET /api/users (ADMIN only)
router.get('/', authenticate, authorize('ADMIN'), [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const { role, q, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (role) query.role = role;
        if (q) {
            query.$or = [
                { fullName: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ];
        }

        // Get users with pagination
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-passwordHash')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Get loan statistics for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const [totalLoans, activeLoans, overdueLoans] = await Promise.all([
                    Loan.countDocuments({ readerUserId: user._id }),
                    Loan.countDocuments({ readerUserId: user._id, status: 'OPEN' }),
                    Loan.countDocuments({ readerUserId: user._id, status: 'OPEN', dueDate: { $lt: new Date() } })
                ]);

                return {
                    ...user.toJSON(),
                    totalLoans,
                    activeLoans,
                    overdueLoans
                };
            })
        );

        res.json({
            success: true,
            data: usersWithStats,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get users'
            }
        });
    }
});

// POST /api/users (ADMIN only)
router.post('/', authenticate, authorize('ADMIN'), [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name('fullName'),
    body('role').isIn(['ADMIN', 'LIBRARIAN', 'USER']).withMessage('Invalid role'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, password, fullName, role, status = 'ACTIVE' } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'User with this email already exists'
                }
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            fullName,
            role,
            status
        });

        await user.save();

        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create user'
            }
        });
    }
});

// PUT /api/users/:id (ADMIN only)
router.put('/:id', authenticate, authorize('ADMIN'), [
    commonValidations.objectId('id'),
    body('fullName').optional().isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('email').optional().normalizeEmail(),
    body('role').optional().isIn(['ADMIN', 'LIBRARIAN', 'USER']).withMessage('Invalid role'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Invalid status'),
    handleValidationErrors
], async (req, res) => {
    try {
        console.log('PUT /users/:id - Request body:', req.body);
        console.log('PUT /users/:id - Request params:', req.params);
        const { id } = req.params;
        const { fullName, email, role, status } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'User not found'
                }
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Email already exists'
                    }
                });
            }
        }

        const updates = {};
        if (fullName) updates.fullName = fullName;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (status) updates.status = status;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                user: updatedUser.toJSON()
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update user'
            }
        });
    }
});

// DELETE /api/users/:id (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Cannot delete your own account'
                }
            });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'User deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete user'
            }
        });
    }
});

// PATCH /api/users/:id/role (ADMIN only)
router.patch('/:id/role', authenticate, authorize('ADMIN'), [
    commonValidations.objectId('id'),
    body('role').isIn(['ADMIN', 'LIBRARIAN', 'USER']).withMessage('Invalid role'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Prevent admin from changing their own role
        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Cannot change your own role'
                }
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to change user role'
            }
        });
    }
});

// GET /api/users/:id/stats (ADMIN/LIBRARIAN only) - Get detailed user statistics
router.get('/:id/stats', authenticate, authorize('ADMIN', 'LIBRARIAN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'User not found'
                }
            });
        }

        // Get user's loan statistics
        const [
            totalLoans,
            activeLoans,
            returnedLoans,
            overdueLoans,
            totalFines,
            paidFines
        ] = await Promise.all([
            Loan.countDocuments({ readerUserId: id }),
            Loan.countDocuments({ readerUserId: id, status: 'OPEN' }),
            Loan.countDocuments({ readerUserId: id, status: 'CLOSED' }),
            Loan.countDocuments({ readerUserId: id, status: 'OPEN', dueDate: { $lt: new Date() } }),
            Loan.countDocuments({ readerUserId: id, status: 'OPEN', dueDate: { $lt: new Date() } }),
            Loan.countDocuments({ readerUserId: id, status: 'CLOSED' })
        ]);

        res.json({
            success: true,
            data: {
                totalLoans,
                activeLoans,
                returnedLoans,
                overdueLoans,
                totalFines,
                paidFines
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get user statistics'
            }
        });
    }
});

module.exports = router;
