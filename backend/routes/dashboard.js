const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get user dashboard data
router.get('/user-data', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt
            },
            stats: {
                totalJourneys: 12,
                savedAmount: 180,
                currentBalance: 450
            },
            recentBookings: [
                {
                    id: 1,
                    from: 'Aluva',
                    to: 'MG Road',
                    date: new Date().toLocaleDateString(),
                    fare: 25,
                    status: 'Completed'
                },
                {
                    id: 2,
                    from: 'Seaport',
                    to: 'Vyttila',
                    date: new Date(Date.now() - 86400000).toLocaleDateString(),
                    fare: 30,
                    status: 'Completed'
                }
            ]
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { fullName, email } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { fullName, email },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get wallet balance
router.get('/wallet', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            balance: 450,
            transactions: [
                {
                    id: 1,
                    type: 'debit',
                    amount: 25,
                    description: 'Metro Journey - Aluva to MG Road',
                    date: new Date().toLocaleDateString()
                },
                {
                    id: 2,
                    type: 'credit',
                    amount: 500,
                    description: 'Wallet Recharge',
                    date: new Date(Date.now() - 86400000).toLocaleDateString()
                }
            ]
        });
    } catch (error) {
        console.error('Wallet error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add wallet recharge
router.post('/wallet/recharge', verifyToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        res.json({
            message: 'Recharge initiated',
            amount: amount,
            status: 'pending',
            transactionId: 'TXN-' + Date.now()
        });
    } catch (error) {
        console.error('Recharge error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
