const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// Get recent activities (admin use)
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const activities = await Activity.find().sort({ createdAt: -1 }).limit(limit).lean();
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
