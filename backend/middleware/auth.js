const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Auth middleware - Token present:', !!token);
        console.log('Auth middleware - URL:', req.url);
        console.log('Auth middleware - Method:', req.method);

        if (!token) {
            console.log('Auth middleware - No token provided');
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Access denied. No token provided.'
                }
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware - Token decoded:', decoded);

        const user = await User.findById(decoded.userId).select('-passwordHash');
        console.log('Auth middleware - User found:', !!user);
        console.log('Auth middleware - User role:', user?.role);
        console.log('Auth middleware - User status:', user?.status);

        if (!user) {
            console.log('Auth middleware - User not found');
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid token. User not found.'
                }
            });
        }

        if (user.status !== 'ACTIVE') {
            console.log('Auth middleware - User not active');
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Account is not active.'
                }
            });
        }

        req.user = user;
        console.log('Auth middleware - Authentication successful');
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Invalid token.'
                }
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Token expired.'
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Token verification failed.'
            }
        });
    }
};

// Role-based access control
const authorize = (...roles) => {
    return (req, res, next) => {
        console.log('Authorization middleware - Required roles:', roles);
        console.log('Authorization middleware - User role:', req.user?.role);
        console.log('Authorization middleware - User present:', !!req.user);

        if (!req.user) {
            console.log('Authorization middleware - No user found');
            return res.status(401).json({
                success: false,
                error: {
                    code: 'AUTH_401',
                    message: 'Authentication required.'
                }
            });
        }

        // Flatten roles array in case of nested arrays
        const flatRoles = roles.flat();
        console.log('Authorization middleware - Flattened roles:', flatRoles);

        if (!flatRoles.includes(req.user.role)) {
            console.log('Authorization middleware - Insufficient permissions');
            return res.status(403).json({
                success: false,
                error: {
                    code: 'PERMISSION_403',
                    message: 'Access denied. Insufficient permissions.'
                }
            });
        }

        console.log('Authorization middleware - Authorization successful');
        next();
    };
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-passwordHash');

            if (user && user.status === 'ACTIVE') {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth
};
