const mongoose = require('mongoose');

const VirtualCardSchema = new mongoose.Schema({
    cardNumber: {
        type: String,
        required: [true, 'Card number is required'],
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        unique: true,
        index: true
    },
    cardHolderName: {
        type: String,
        required: [true, 'Cardholder name is required'],
        trim: true
    },
    balance: {
        type: Number,
        default: 100, // Initial welcome balance of ₹100
        min: [0, 'Balance cannot be negative']
    },
    status: {
        type: String,
        enum: ['active', 'blocked', 'suspended'],
        default: 'active'
    },
    expiryDate: {
        type: String,
        trim: true
    },
    cvv: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

VirtualCardSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('VirtualCard', VirtualCardSchema);
