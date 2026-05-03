const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    userName: { type: String },
    userRole: { type: String },
    action: { type: String, required: true },
    path: { type: String },
    method: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now }
});






module.exports = mongoose.model('Activity', ActivitySchema);
