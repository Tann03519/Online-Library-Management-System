const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    console.log('Validation middleware - URL:', req.url);
    console.log('Validation middleware - Query:', req.query);
    console.log('Validation errors:', errors.array());

    if (!errors.isEmpty()) {
        console.log('Validation failed, returning 400');
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_400',
                message: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg,
                    value: err.value
                }))
            }
        });
    }
    console.log('Validation passed, calling next()');
    next();
};

// Common validation rules
const commonValidations = {
    // ObjectId validation
    objectId: (field) => param(field).isMongoId().withMessage(`Invalid ${field} format`),

    // Email validation
    email: body('email')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),

    // Password validation
    password: body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    // Name validation
    name: (field) => body(field)
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage(`${field} must be between 2 and 100 characters`),

    // Pagination validation
    pagination: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],

    // Date validation
    date: (field) => body(field)
        .isISO8601()
        .withMessage(`${field} must be a valid date`),

    // Positive number validation
    positiveNumber: (field) => body(field)
        .isFloat({ min: 0 })
        .withMessage(`${field} must be a positive number`)
};

// Specific validation rules for different endpoints
const authValidations = {
    register: [
        commonValidations.email,
        commonValidations.password,
        commonValidations.name('fullName'),
        handleValidationErrors
    ],

    login: [
        commonValidations.email,
        body('password').notEmpty().withMessage('Password is required'),
        handleValidationErrors
    ],

    changePassword: [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match');
            }
            return true;
        }),
        handleValidationErrors
    ]
};

const bookValidations = {
    create: [
        body('isbn').optional().trim().isLength({ min: 10, max: 20 }).withMessage('ISBN must be between 10 and 20 characters'),
        body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
        body('authors').isArray({ min: 1 }).withMessage('At least one author is required'),
        body('authors.*').trim().isLength({ min: 1 }).withMessage('Author name cannot be empty'),
        body('categoryId').isMongoId().withMessage('Invalid category ID'),
        body('publisherId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid publisher ID'),
        body('publisherName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Publisher name must be between 1 and 100 characters'),
        body('facultyId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid faculty ID'),
        body('facultyName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Faculty name must be between 1 and 100 characters'),
        body('departmentId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid department ID'),
        body('departmentName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Department name must be between 1 and 100 characters'),
        body('year').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const year = parseInt(value);
            return !isNaN(year) && year >= 1000 && year <= new Date().getFullYear() + 1;
        }).withMessage('Invalid year'),
        body('pages').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const num = parseInt(value);
            return !isNaN(num) && num >= 1;
        }).withMessage('Pages must be a positive number'),
        body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
        body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
        body('keywords').optional().isArray().withMessage('Keywords must be an array'),
        body('keywords.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Keyword must be between 1 and 50 characters'),
        body('coverImageUrl').optional().trim().isLength({ max: 500 }).withMessage('Cover image URL must be less than 500 characters'),
        body('quantityTotal').custom((value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1;
        }).withMessage('Total quantity must be at least 1'),
        body('quantityAvailable').custom((value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 0;
        }).withMessage('Available quantity cannot be negative'),
        body('price').custom((value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        }).withMessage('Price is required and must be a positive number'),
        body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'LOST', 'DAMAGED']).withMessage('Invalid status'),
        handleValidationErrors
    ],

    update: [
        commonValidations.objectId('id'),
        body('isbn').optional().trim().isLength({ min: 10, max: 20 }).withMessage('ISBN must be between 10 and 20 characters'),
        body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be less than 200 characters'),
        body('authors').optional().isArray({ min: 1 }).withMessage('At least one author is required'),
        body('authors.*').optional().trim().isLength({ min: 1 }).withMessage('Author name cannot be empty'),
        body('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
        body('publisherId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid publisher ID'),
        body('publisherName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Publisher name must be between 1 and 100 characters'),
        body('facultyId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid faculty ID'),
        body('facultyName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Faculty name must be between 1 and 100 characters'),
        body('departmentId').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            return /^[0-9a-fA-F]{24}$/.test(value);
        }).withMessage('Invalid department ID'),
        body('departmentName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Department name must be between 1 and 100 characters'),
        body('year').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const year = parseInt(value);
            return !isNaN(year) && year >= 1000 && year <= new Date().getFullYear() + 1;
        }).withMessage('Invalid year'),
        body('pages').optional().custom((value) => {
            if (value === null || value === undefined || value === '') return true;
            const num = parseInt(value);
            return !isNaN(num) && num >= 1;
        }).withMessage('Pages must be a positive number'),
        body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
        body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
        body('keywords').optional().isArray().withMessage('Keywords must be an array'),
        body('keywords.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Keyword must be between 1 and 50 characters'),
        body('coverImageUrl').optional().trim().isLength({ max: 500 }).withMessage('Cover image URL must be less than 500 characters'),
        body('quantityTotal').optional().custom((value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1;
        }).withMessage('Total quantity must be at least 1'),
        body('quantityAvailable').optional().custom((value) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 0;
        }).withMessage('Available quantity cannot be negative'),
        body('price').optional().custom((value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        }).withMessage('Price must be a positive number'),
        body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'LOST', 'DAMAGED']).withMessage('Invalid status'),
        handleValidationErrors
    ]
};

const loanValidations = {
    create: [
        body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.bookId').isMongoId().withMessage('Invalid book ID'),
        body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
        handleValidationErrors
    ],

    createForUser: [
        body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.bookId').isMongoId().withMessage('Invalid book ID'),
        body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        handleValidationErrors
    ]
};

const returnValidations = {
    create: [
        body('loanId').isMongoId().withMessage('Invalid loan ID'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.bookId').isMongoId().withMessage('Invalid book ID'),
        body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('items.*.condition').isIn(['OK', 'DAMAGED', 'LOST']).withMessage('Invalid condition'),
        body('items.*.damagePercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Damage percent must be between 0 and 100'),
        handleValidationErrors
    ]
};

module.exports = {
    handleValidationErrors,
    commonValidations,
    authValidations,
    bookValidations,
    loanValidations,
    returnValidations
};
