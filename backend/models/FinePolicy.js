const mongoose = require('mongoose');

const finePolicySchema = new mongoose.Schema({
    lateFeePerDay: {
        type: Number,
        required: true,
        min: 0
    },
    damageFeeRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1 // 0-1 (0% to 100%)
    },
    lostBookFeeRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1, // 0-1 (0% to 100%)
        default: 1.0 // 100% of book value for lost books
    },
    currency: {
        type: String,
        required: true,
        default: 'VND',
        uppercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure only one active policy
finePolicySchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Static method to get current active policy
finePolicySchema.statics.getCurrent = async function () {
    let policy = await this.findOne({ isActive: true });

    if (!policy) {
        // Create default policy if none exists
        policy = await this.create({
            lateFeePerDay: 5000, // 5,000 VND per day
            damageFeeRate: 0.3, // 30% of book value
            lostBookFeeRate: 1.0, // 100% of book value for lost books
            currency: 'VND'
        });
    }

    return policy;
};

module.exports = mongoose.model('FinePolicy', finePolicySchema);
