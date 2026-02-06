const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['ADMIN', 'LIBRARIAN', 'USER'],
        default: 'USER'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    notificationSettings: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: false
        },
        sms: {
            type: Boolean,
            default: false
        },
        loanReminders: {
            type: Boolean,
            default: true
        },
        fineAlerts: {
            type: Boolean,
            default: true
        },
        newBooks: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Virtual for password (not stored)
userSchema.virtual('password')
    .set(function (password) {
        this._password = password;
    })
    .get(function () {
        return this._password;
    });

// Hash password before saving
userSchema.pre('save', async function (next) {
    console.log('Pre-save middleware triggered');
    console.log('_password exists:', !!this._password);
    console.log('_password value:', this._password);

    // Hash password if _password exists (for new users or password updates)
    if (this._password) {
        console.log('Hashing password...');
        try {
            const salt = await bcrypt.genSalt(12);
            this.passwordHash = await bcrypt.hash(this._password, salt);
            this._password = undefined;
            console.log('Password hashed successfully');
        } catch (error) {
            console.error('Error hashing password:', error);
            return next(error);
        }
    }

    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.passwordHash;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
