const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: [true, 'Ticket ID is required'],
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    passengerName: {
        type: String,
        default: 'Passenger'
    },
    fromStation: {
        type: String,
        required: [true, 'Origin station is required']
    },
    toStation: {
        type: String,
        required: [true, 'Destination station is required']
    },
    route: {
        routeId: String,
        name: String,
        lines: [
            {
                id: String,
                name: String,
                color: String
            }
        ],
        transfers: { type: Number, default: 0 },
        interchanges: [String],
        totalStops: Number,
        estimatedMinutes: Number,
        fullPath: [String],
        segments: [mongoose.Schema.Types.Mixed]
    },
    fare: {
        type: Number,
        required: true,
        min: 0
    },
    passengers: {
        type: Number,
        default: 1,
        min: 1
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'paid',
        index: true
    },
    paymentMethod: {
        type: String,
        default: 'razorpay_test' // 'razorpay_test' | 'virtual_card' | 'counter_upi'
    },
    razorpayOrderId: {
        type: String,
        default: null,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    ticketStatus: {
        type: String,
        enum: ['valid', 'used', 'expired', 'cancelled'],
        default: 'valid',
        index: true
    },
    issuedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Strictly enforced 5-hour validity
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    usedAt: {
        type: Date,
        default: null
    },
    // Unique secure token embedded into the QR code
    qrToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Ticket', TicketSchema);
