const express = require('express');
const { body } = require('express-validator');
const FinePolicy = require('../models/FinePolicy');
const { authenticate, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// GET /api/fine-policy (ADMIN only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
    try {
        const policy = await FinePolicy.getCurrent();

        res.json({
            success: true,
            data: policy
        });
    } catch (error) {
        console.error('Get fine policy error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to get fine policy'
            }
        });
    }
});

// PUT /api/fine-policy (ADMIN only)
router.put('/', authenticate, authorize('ADMIN'), [
    body('lateFeePerDay').isFloat({ min: 0 }).withMessage('Late fee per day must be a positive number'),
    body('damageFeeRate').isFloat({ min: 0, max: 1 }).withMessage('Damage fee rate must be between 0 and 1'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { lateFeePerDay, damageFeeRate, currency = 'VND' } = req.body;

        // Get current policy
        let policy = await FinePolicy.findOne({ isActive: true });

        if (policy) {
            // Update existing policy
            policy.lateFeePerDay = lateFeePerDay;
            policy.damageFeeRate = damageFeeRate;
            policy.currency = currency;
            await policy.save();
        } else {
            // Create new policy
            policy = new FinePolicy({
                lateFeePerDay,
                damageFeeRate,
                currency
            });
            await policy.save();
        }

        res.json({
            success: true,
            data: policy
        });
    } catch (error) {
        console.error('Update fine policy error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_500',
                message: 'Failed to update fine policy'
            }
        });
    }
});

module.exports = router;
