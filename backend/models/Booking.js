const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fromStation: { type: String, required: true },
    toStation: { type: String, required: true },
    passengerName: { type: String, default: '' },
    passengerPhone: { type: String, default: '' },
    type: { type: String, default: 'single' },  // single | day-pass | weekly-pass | monthly-pass | smart-card
    fare: { type: Number, default: 0 },
    status: { type: String, default: 'Success' },     // Success | Failed | Pending
    method: { type: String, default: 'Card/UPI' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
