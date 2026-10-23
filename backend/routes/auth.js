const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d'
    });
};

// Validation middleware
const validateSignup = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .matches(/^[A-Za-z\s]+$/).withMessage('Name should contain only letters'),
    body('email')
        .trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('confirmPassword')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),
    body('username')
        .trim()
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('userType')
        .isIn(['customer', 'station_master', 'officer']).withMessage('Invalid user type')
];

const validateLogin = [
    body('emailOrUsername')
        .notEmpty().withMessage('Email or Username is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Signup Route
router.post('/signup', validateSignup, async (req, res) => {
    try {
        // 1. Verify database connectivity before processing
        if (mongoose.connection.readyState !== 1) {
            console.error('[Auth/Signup] Database not ready (readyState: ' + mongoose.connection.readyState + ')');
            return res.status(503).json({
                message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection and network access.'
            });
        }

        // 2. Check express-validator rules
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array(), message: errors.array()[0]?.msg || 'Validation failed' });
        }

        const { fullName, email, password, username, userType, designation, stationAssigned } = req.body;

        const cleanFullName = String(fullName || '').trim();
        const cleanEmail = String(email || '').trim().toLowerCase();
        const cleanUsername = String(username || '').trim();

        // 3. If registering as station_master or officer, require a passKey to verify authenticity
        if (userType === 'station_master' || userType === 'officer') {
            const allowOpenEnv = (process.env.ALLOW_PROTECTED_SIGNUP || '').toLowerCase() === 'true';
            const isDev = (process.env.NODE_ENV || 'development') !== 'production';
            const allowOpen = allowOpenEnv || isDev;
            if (!allowOpen) {
                const providedKey = req.body.passKey || '';
                const allowedFromEnv = (process.env.PASS_KEYS || process.env.PASS_KEY || '').split(',').map(s => s.trim()).filter(Boolean);
                if (!providedKey) {
                    return res.status(403).json({ message: 'Pass key is required to register as station master or officer' });
                }
                if (allowedFromEnv.length === 0) {
                    console.warn('No PASS_KEYS configured in environment — rejecting protected signup attempts');
                    return res.status(403).json({ message: 'Registration for this role is currently disabled. Contact admin.' });
                }
                if (!allowedFromEnv.includes(providedKey)) {
                    return res.status(403).json({ message: 'You are not authorised to create this account — invalid pass key' });
                }
            }
        }

        // 4. Check if user already exists
        const userExists = await User.findOne({
            $or: [{ email: cleanEmail }, { username: cleanUsername }]
        });

        if (userExists) {
            return res.status(400).json({
                message: userExists.email === cleanEmail
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // 5. Create new user with trimmed/sanitized fields
        const user = await User.create({
            fullName: cleanFullName,
            email: cleanEmail,
            username: cleanUsername,
            password,
            userType: userType || 'customer',
            designation: designation || null,
            stationAssigned: stationAssigned || null,
            accountStatus: userType === 'station_master' ? 'pending' : 'active'
        });

        // 6. Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                userType: user.userType
            }
        });

    } catch (error) {
        console.error('Signup error:', error);

        // Map MongoDB duplicate key collision (E11000) to clean 400 error
        if (error.code === 11000) {
            const isEmail = error.keyPattern?.email || (error.message && error.message.includes('email'));
            return res.status(400).json({
                message: isEmail ? 'Email already registered' : 'Username already taken'
            });
        }

        // Map Mongoose Schema validation errors to clean 400 error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join('. ');
            return res.status(400).json({
                message: messages || 'Validation error. Please verify your registration inputs.'
            });
        }

        // Map Database connection errors to clean 503 error
        if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
            return res.status(503).json({
                message: 'Database connection failed. Please ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0).'
            });
        }

        res.status(500).json({ message: error.message || 'Server error during account creation.' });
    }
});

// Login Route
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { emailOrUsername, password, captcha } = req.body;

        // Verify captcha - accept any non-empty captcha for now
        if (!captcha || captcha.trim() === '') {
            return res.status(400).json({ message: 'Please enter CAPTCHA' });
        }

        const cleanedIdentifier = (emailOrUsername || '').trim();
        const lowerIdentifier = cleanedIdentifier.toLowerCase();

        // Find user by email or username (handling case sensitivity and trimming)
        const user = await User.findOne({
            $or: [
                { email: lowerIdentifier },
                { username: cleanedIdentifier },
                { username: lowerIdentifier }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.accountStatus === 'pending') {
            return res.status(403).json({ message: 'Your account is pending approval by KMRL Officer' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                userType: user.userType
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        if (error.name === 'MongooseServerSelectionError' || error.name === 'MongooseError') {
            return res.status(503).json({
                message: 'Database connection failed. Please ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0).'
            });
        }
        res.status(500).json({ message: error.message || 'Server error during login.' });
    }
});

module.exports = router;