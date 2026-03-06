const express = require('express');
const router = express.Router();
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
        .notEmpty().withMessage('Full name is required')
        .matches(/^[A-Za-z\s]+$/).withMessage('Name should contain only letters'),
    body('email')
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
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { fullName, email, password, username, userType, designation, stationAssigned } = req.body;

        // If registering as station_master or officer, require a passKey to verify authenticity
        if (userType === 'station_master' || userType === 'officer') {
            // Allow protected signup by default in development/local environments.
            // In production, provide PASS_KEYS or set ALLOW_PROTECTED_SIGNUP=true explicitly.
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

        // Check if user already exists
        const userExists = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (userExists) {
            return res.status(400).json({
                message: userExists.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = await User.create({
            fullName,
            email,
            username,
            password,
            userType: userType || 'customer',
            designation: designation || null,
            stationAssigned: stationAssigned || null,
            accountStatus: userType === 'station_master' ? 'pending' : 'active'
        });

        // Generate token
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
        res.status(500).json({ message: 'Server error' });
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

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
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
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;