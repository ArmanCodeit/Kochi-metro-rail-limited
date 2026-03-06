const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'News title is required']
    },
    content: {
        type: String,
        required: [true, 'News content is required']
    },
    description: {
        type: String
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postedByName: {
        type: String
    },
    postedByRole: {
        type: String,
        enum: ['station_master', 'officer'],
        required: true
    },
    newsType: {
        type: String,
        enum: ['announcement', 'maintenance', 'alert', 'information'],
        default: 'information'
    },
    affectedLines: [String],
    affectedStations: [String],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    viewedBy: [{
        userId: mongoose.Schema.Types.ObjectId,
        viewedAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('News', NewsSchema);
