const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { startCronJobs } = require('./utils/cronJobs');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting removed for development

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/userLoans'));
app.use('/api/books', require('./routes/books'));
app.use('/api/books', require('./routes/bookStats'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/faculties', require('./routes/faculties'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/loans', require('./routes/loanManagement'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/overdues', require('./routes/overdues'));
app.use('/api/fine-policy', require('./routes/finePolicy'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/stats', require('./routes/stats'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND_404',
            message: 'Route not found'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_400',
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            }
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_400',
                message: 'Invalid ID format'
            }
        });
    }

    res.status(500).json({
        success: false,
        error: {
            code: 'SERVER_500',
            message: 'Internal server error'
        }
    });
});

const PORT = process.env.PORT || 2409;

// Only start server if not in test environment or if this file is run directly
if (process.env.NODE_ENV !== 'test' || require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📚 Library Management System API`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

        // Start cron jobs
        startCronJobs();
    });
}

module.exports = app;
