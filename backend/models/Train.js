const mongoose = require('mongoose');

const TrainSchema = new mongoose.Schema({
    trainId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    route: [String],
    startTime: String,
    frequencyMinutes: Number,
    status: { type: String, enum: ['Running','Delayed','Maintenance','Not Service'], default: 'Running' },
    currentStation: String,
    nextStop: String,
    delayedByMinutes: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Train', TrainSchema);
