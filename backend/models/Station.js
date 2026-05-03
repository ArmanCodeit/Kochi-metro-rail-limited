const mongoose = require('mongoose');


const StationSchema = new mongoose.Schema({
    stationId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    line: {
        type: String,
        enum: ['Line 1', 'Line 2', 'Line 3', 'Vyttila Extension', 'Infopark Extension'],
        required: true
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    facilities: [String],
    platformCount: Number,
    distanceFromPrevious: Number,
    order: Number,
    status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Inactive'],
        default: 'Active'
    }
});

module.exports = mongoose.model('Station', StationSchema);