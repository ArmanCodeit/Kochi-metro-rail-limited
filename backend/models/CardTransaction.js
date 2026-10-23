const mongoose = require('mongoose');

const CardTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualCard',
        required: [true, 'Card ID is required'],
        index: true
    },
    type: {
        type: String,
        enum: ['recharge', 'fare_deduction', 'card_transfer', 'transfer_debit', 'transfer_credit'],
        required: true
    },
    senderCardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualCard',
        default: null,
        index: true
    },
    recipientCardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualCard',
        default: null,
        index: true
    },
    initiatingUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    recipientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    transferCategory: {
        type: String,
        enum: ['self_recharge', 'other_card_recharge', 'card_to_card_transfer', 'metro_journey', null],
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    amountInPaise: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    razorpayOrderId: {
        type: String,
        default: null,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        default: null,
        index: true
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    creditStatus: {
        type: String,
        enum: ['pending', 'credited', 'not_applicable'],
        default: 'pending'
    },
    balanceBefore: {
        type: Number,
        default: 0
    },
    balanceAfter: {
        type: Number,
        default: 0
    },
    idempotencyKey: {
        type: String,
        default: null,
        sparse: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    journeyDetails: {
        fromStation: { type: String, default: null },
        toStation: { type: String, default: null },
        routeId: { type: String, default: null },
        routeName: { type: String, default: null },
        distance: { type: Number, default: 0 },
        fare: { type: Number, default: 0 },
        totalStops: { type: Number, default: 0 },
        transfers: { type: Number, default: 0 },
        interchanges: [{ type: String }]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

CardTransactionSchema.index({ userId: 1, createdAt: -1 });
CardTransactionSchema.index({ cardId: 1, createdAt: -1 });

CardTransactionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CardTransaction', CardTransactionSchema);
