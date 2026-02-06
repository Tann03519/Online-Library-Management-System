const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Publisher = require('../models/Publisher');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { commonValidations, bookValidations, handleValidationErrors } = require('../middleware/validation');
const { notifyNewBookAdded } = require('../utils/notificationHelper');

const router = express.Router();

// Configure multer for book cover upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/books');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `book-${uniqueSuffix}${path.extname(file.originalname)}`);
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

// POST /api/books/upload-cover
router.post('/upload-cover', authenticate, authorize(['ADMIN', 'LIBRARIAN']), upload.single('coverImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Cover image file is required'
                }
            });
        }

        // Return the file URL
        const coverImageUrl = `/uploads/books/${req.file.filename}`;

        res.json({
            success: true,
            data: {
                coverImageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload book cover error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads/books', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to upload book cover'
            }
        });
    }
});

// GET /api/books (Public - Guest/User)
router.get('/', optionalAuth, [
    commonValidations.pagination,
    handleValidationErrors
], async (req, res) => {
    try {
        const {
            q,
            categoryId,
            publisherId,
            facultyId,
            departmentId,
            year,
            page = 1,
            limit = 10
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query
        const query = { status: 'ACTIVE' };

        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { authors: { $regex: q, $options: 'i' } },
                { keywords: { $regex: q, $options: 'i' } }
            ];
        }

        if (categoryId) query.categoryId = categoryId;
        if (publisherId) query.publisherId = publisherId;
        if (facultyId) query.facultyId = facultyId;
        if (departmentId) query.departmentId = departmentId;
        if (year) query.year = parseInt(year);

        // Get books with pagination
        const [books, total] = await Promise.all([
            Book.find(query)
                .populate('categoryId', 'name slug')
                .populate('publisherId', 'name slug')
                .populate('facultyId', 'name code')
                .populate('departmentId', 'name code')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Book.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: books,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get books'
            }
        });
    }
});

// GET /api/books/:id (Public - Guest/User)
router.get('/:id', optionalAuth, [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findById(id)
            .populate('categoryId', 'name slug')
            .populate('publisherId', 'name slug')
            .populate('facultyId', 'name code')
            .populate('departmentId', 'name code');

        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Book not found'
                }
            });
        }

        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get book'
            }
        });
    }
});

// POST /api/books (LIBRARIAN/ADMIN only)
router.post('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), upload.single('coverImage'), bookValidations.create, async (req, res) => {
    try {
        const bookData = req.body;

        // Auto-generate ISBN if not provided
        if (!bookData.isbn || bookData.isbn.trim() === '') {
            const generateISBN = () => {
                // ISBN-13 format: 978-XXX-XXXXX-X-X
                const prefix = '978';
                const group = Math.floor(Math.random() * 900) + 100; // 100-999
                const publisher = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
                const title = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
                const checkDigit = Math.floor(Math.random() * 10); // 0-9

                return `${prefix}${group}${publisher}${title}${checkDigit}`;
            };

            // Generate unique ISBN
            let isbn;
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 10) {
                isbn = generateISBN();
                const existingBook = await Book.findOne({ isbn });
                if (!existingBook) {
                    isUnique = true;
                }
                attempts++;
            }

            if (!isUnique) {
                // Fallback: use timestamp-based ISBN
                isbn = `978${Date.now().toString().slice(-10)}`;
            }

            bookData.isbn = isbn;
            console.log('Auto-generated ISBN:', isbn);
        } else {
            // Check if ISBN already exists
            const existingBook = await Book.findOne({ isbn: bookData.isbn });
            if (existingBook) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Book with this ISBN already exists'
                    }
                });
            }
        }

        // Handle faculty creation/retrieval
        let facultyId = bookData.facultyId;
        if (!facultyId && bookData.facultyName) {
            // Check if faculty exists by name
            let faculty = await Faculty.findOne({ name: { $regex: new RegExp(`^${bookData.facultyName}$`, 'i') } });
            if (!faculty) {
                // Create new faculty
                const facultyCode = bookData.facultyName.replace(/\s+/g, '').toUpperCase().substring(0, 10);
                faculty = new Faculty({
                    name: bookData.facultyName,
                    code: facultyCode,
                    slug: bookData.facultyName.toLowerCase().replace(/\s+/g, '-'),
                    description: `Khoa ${bookData.facultyName}`
                });
                await faculty.save();
                console.log('Created new faculty:', faculty.name);
            }
            facultyId = faculty._id;
        }

        // Handle department creation/retrieval
        let departmentId = bookData.departmentId;
        if (!departmentId && bookData.departmentName && facultyId) {
            // Check if department exists by name within the faculty
            let department = await Department.findOne({
                name: { $regex: new RegExp(`^${bookData.departmentName}$`, 'i') },
                facultyId: facultyId
            });
            if (!department) {
                // Create new department
                const departmentCode = bookData.departmentName.replace(/\s+/g, '').toUpperCase().substring(0, 10);
                department = new Department({
                    name: bookData.departmentName,
                    code: departmentCode,
                    facultyId: facultyId
                });
                await department.save();
                console.log('Created new department:', department.name);
            }
            departmentId = department._id;
        }

        // Handle publisher creation/retrieval
        let publisherId = bookData.publisherId;
        if (!publisherId && bookData.publisherName) {
            // Check if publisher exists by name
            let publisher = await Publisher.findOne({ name: { $regex: new RegExp(`^${bookData.publisherName}$`, 'i') } });
            if (!publisher) {
                // Create new publisher
                const publisherSlug = bookData.publisherName.toLowerCase().replace(/\s+/g, '-');
                publisher = new Publisher({
                    name: bookData.publisherName,
                    slug: publisherSlug,
                    address: 'Chưa cập nhật',
                    phone: 'Chưa cập nhật'
                });
                await publisher.save();
                console.log('Created new publisher:', publisher.name);
            }
            publisherId = publisher._id;
        }

        // Add cover image URL if uploaded
        if (req.file) {
            bookData.coverImageUrl = `/uploads/books/${req.file.filename}`;
        }

        // Ensure quantityAvailable doesn't exceed quantityTotal
        if (bookData.quantityAvailable > bookData.quantityTotal) {
            bookData.quantityAvailable = bookData.quantityTotal;
        }

        // Prepare final book data
        const finalBookData = {
            ...bookData,
            facultyId: facultyId,
            departmentId: departmentId,
            publisherId: publisherId
        };

        // Remove name fields as they're not part of Book schema
        delete finalBookData.facultyName;
        delete finalBookData.departmentName;
        delete finalBookData.publisherName;

        const book = new Book(finalBookData);
        await book.save();

        // Populate references
        await book.populate([
            { path: 'categoryId', select: 'name slug' },
            { path: 'publisherId', select: 'name slug' },
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' }
        ]);

        // Send notification to all users about new book
        try {
            await notifyNewBookAdded(book._id);
            console.log('New book notification sent for:', book.title);
        } catch (notificationError) {
            console.error('Error sending new book notification:', notificationError);
            // Don't fail the request if notification fails
        }

        res.status(201).json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error('Create book error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads/books', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to create book'
            }
        });
    }
});

// PUT /api/books/:id (LIBRARIAN/ADMIN only)
router.put('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), upload.single('coverImage'), bookValidations.update, async (req, res) => {
    try {
        const { id } = req.params;
        const bookData = req.body;

        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Book not found'
                }
            });
        }

        // Check if ISBN is being changed and if it already exists
        if (bookData.isbn && bookData.isbn !== book.isbn) {
            const existingBook = await Book.findOne({ isbn: bookData.isbn });
            if (existingBook) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_400',
                        message: 'Book with this ISBN already exists'
                    }
                });
            }
        }

        // Handle faculty creation/retrieval
        let facultyId = bookData.facultyId;
        if (!facultyId && bookData.facultyName) {
            // Check if faculty exists by name
            let faculty = await Faculty.findOne({ name: { $regex: new RegExp(`^${bookData.facultyName}$`, 'i') } });
            if (!faculty) {
                // Create new faculty
                const facultyCode = bookData.facultyName.replace(/\s+/g, '').toUpperCase().substring(0, 10);
                faculty = new Faculty({
                    name: bookData.facultyName,
                    code: facultyCode,
                    slug: bookData.facultyName.toLowerCase().replace(/\s+/g, '-'),
                    description: `Khoa ${bookData.facultyName}`
                });
                await faculty.save();
                console.log('Created new faculty:', faculty.name);
            }
            facultyId = faculty._id;
        }

        // Handle department creation/retrieval
        let departmentId = bookData.departmentId;
        if (!departmentId && bookData.departmentName && facultyId) {
            // Check if department exists by name within the faculty
            let department = await Department.findOne({
                name: { $regex: new RegExp(`^${bookData.departmentName}$`, 'i') },
                facultyId: facultyId
            });
            if (!department) {
                // Create new department
                const departmentCode = bookData.departmentName.replace(/\s+/g, '').toUpperCase().substring(0, 10);
                department = new Department({
                    name: bookData.departmentName,
                    code: departmentCode,
                    facultyId: facultyId
                });
                await department.save();
                console.log('Created new department:', department.name);
            }
            departmentId = department._id;
        }

        // Handle publisher creation/retrieval
        let publisherId = bookData.publisherId;
        if (!publisherId && bookData.publisherName) {
            // Check if publisher exists by name
            let publisher = await Publisher.findOne({ name: { $regex: new RegExp(`^${bookData.publisherName}$`, 'i') } });
            if (!publisher) {
                // Create new publisher
                const publisherSlug = bookData.publisherName.toLowerCase().replace(/\s+/g, '-');
                publisher = new Publisher({
                    name: bookData.publisherName,
                    slug: publisherSlug,
                    address: 'Chưa cập nhật',
                    phone: 'Chưa cập nhật'
                });
                await publisher.save();
                console.log('Created new publisher:', publisher.name);
            }
            publisherId = publisher._id;
        }

        // Handle cover image update
        if (req.file) {
            // Delete old cover image if exists
            if (book.coverImageUrl) {
                const oldImagePath = path.join(__dirname, '../uploads/books', path.basename(book.coverImageUrl));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            bookData.coverImageUrl = `/uploads/books/${req.file.filename}`;
        }

        // Ensure quantityAvailable doesn't exceed quantityTotal
        if (bookData.quantityTotal && bookData.quantityAvailable > bookData.quantityTotal) {
            bookData.quantityAvailable = bookData.quantityTotal;
        }

        // Prepare final book data
        const finalBookData = {
            ...bookData,
            facultyId: facultyId,
            departmentId: departmentId,
            publisherId: publisherId
        };

        // Remove name fields as they're not part of Book schema
        delete finalBookData.facultyName;
        delete finalBookData.departmentName;
        delete finalBookData.publisherName;

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            finalBookData,
            { new: true, runValidators: true }
        );

        // Populate references
        await updatedBook.populate([
            { path: 'categoryId', select: 'name slug' },
            { path: 'publisherId', select: 'name slug' },
            { path: 'facultyId', select: 'name code' },
            { path: 'departmentId', select: 'name code' }
        ]);

        res.json({
            success: true,
            data: updatedBook
        });
    } catch (error) {
        console.error('Update book error:', error);

        // Clean up uploaded file if error occurs
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads/books', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update book'
            }
        });
    }
});

// DELETE /api/books/:id (LIBRARIAN/ADMIN only)
router.delete('/:id', authenticate, authorize('LIBRARIAN', 'ADMIN'), [
    commonValidations.objectId('id'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findByIdAndDelete(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Book not found'
                }
            });
        }

        // Delete cover image if exists
        if (book.coverImageUrl) {
            const imagePath = path.join(__dirname, '../uploads/books', path.basename(book.coverImageUrl));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({
            success: true,
            data: {
                message: 'Book deleted successfully'
            }
        });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to delete book'
            }
        });
    }
});

// PATCH /api/books/:id/adjust-stock (ADMIN only)
router.patch('/:id/adjust-stock', authenticate, authorize('ADMIN'), [
    commonValidations.objectId('id'),
    body('delta').isInt().withMessage('Delta must be an integer'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const { delta } = req.body;

        const book = await Book.findById(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND_404',
                    message: 'Book not found'
                }
            });
        }

        // Calculate new quantities
        const newQuantityTotal = book.quantityTotal + delta;
        const newQuantityAvailable = book.quantityAvailable + delta;

        // Validate new quantities
        if (newQuantityTotal < 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Total quantity cannot be negative'
                }
            });
        }

        if (newQuantityAvailable < 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_400',
                    message: 'Available quantity cannot be negative'
                }
            });
        }

        // Update book
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            {
                quantityTotal: newQuantityTotal,
                quantityAvailable: newQuantityAvailable
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                book: updatedBook,
                delta,
                newQuantityTotal,
                newQuantityAvailable
            }
        });
    } catch (error) {
        console.error('Adjust stock error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to adjust stock'
            }
        });
    }
});

module.exports = router;
