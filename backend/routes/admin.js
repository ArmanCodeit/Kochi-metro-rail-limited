const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware – verify JWT and assert officer role
const verifyOfficer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// GET /api/admin/users  –  returns all users (excluding passwords)
router.get('/users', verifyOfficer, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -bookings -__v')
            .sort({ createdAt: -1 });

        const mapped = users.map(u => ({
            id: u._id,
            username: u.username,
            fullName: u.fullName,
            email: u.email,
            role: u.userType === 'station_master' ? 'Station Master'
                : u.userType === 'officer' ? 'Officer'
                    : 'Customer',
            userType: u.userType,
            stationAssigned: u.stationAssigned || null,
            designation: u.designation || null,
            status: 'Active',
            createdAt: u.createdAt,
        }));

        res.json({ users: mapped, total: mapped.length });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
