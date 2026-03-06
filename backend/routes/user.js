const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Get User Profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update User Profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            fathersName,
            dateOfBirth,
            gender,
            maritalStatus,
            contactNumber,
            address,
            city,
            state,
            pinCode
        } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                $set: {
                    firstName,
                    lastName,
                    fathersName,
                    dateOfBirth,
                    gender,
                    maritalStatus,
                    contactNumber,
                    address,
                    city,
                    state,
                    pinCode
                }
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
