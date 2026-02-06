const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { authValidations } = require('../middleware/validation');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );

    return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', authValidations.register, async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

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

        // Hash password manually
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            email,
            passwordHash,
            fullName,
            role: 'USER' // Default role
        });

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Registration failed'
            }
        });
    }
});

// POST /api/auth/login
router.post('/login', authValidations.login, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid email or password'
                }
            });
        }

        // Check if account is active
        if (user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Account is not active'
                }
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid email or password'
                }
            });
        }

        // Update last login time
        await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Login failed'
            }
        });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Refresh token is required'
                }
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid refresh token'
                }
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user._id);

        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid refresh token'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Token refresh failed'
            }
        });
    }
});

// GET /api/auth/me
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
                message: 'Failed to get user info'
            }
        });
    }
});

module.exports = router;
