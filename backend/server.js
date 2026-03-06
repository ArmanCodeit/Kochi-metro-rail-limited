const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const metroRoutes = require('./routes/metro');
const dashboardRoutes = require('./routes/dashboard');
const linesRoutes = require('./routes/lines');
const newsRoutes = require('./routes/news');
const fareRoutes = require('./routes/fare');
const activityLogger = require('./middleware/activityLogger');
const activityRoutes = require('./routes/activity');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();


// Connect to MongoDB
connectDB();

// Create default users if they don't exist (development convenience)
const User = require('./models/User');
const ensureDefaultUsers = async () => {
    try {
        // ── Customer test accounts ──────────────────────────────────────────
        const customerCount = await User.countDocuments({ userType: 'customer' });
        if (customerCount === 0) {
            await User.create({ fullName: 'Test User', email: 'test@example.com', username: 'testuser', password: 'Test@1234', userType: 'customer' });
            await User.create({ fullName: 'Z A B', email: 'zab@example.com', username: 'ZAB', password: 'Zab@1234', userType: 'customer' });
            console.log('Default customer accounts created: testuser / ZAB');
        }

        // ── Station Master default account ──────────────────────────────────
        const smExists = await User.findOne({ userType: 'station_master' });
        if (!smExists) {
            await User.create({
                fullName: 'Station Master',
                email: 'stationmaster@kmrl.com',
                username: 'stationmaster',
                password: 'MASTER123',
                userType: 'station_master',
                designation: 'Station Master',
                stationAssigned: 'Aluva'
            });
            console.log('Default Station Master created — username: stationmaster | password: MASTER123');
        }

        // ── KMRL Officer default account ────────────────────────────────────
        const officerExists = await User.findOne({ userType: 'officer' });
        if (!officerExists) {
            await User.create({
                fullName: 'KMRL Officer',
                email: 'officer@kmrl.com',
                username: 'kmrlofficer',
                password: 'OFFICER456',
                userType: 'officer',
                designation: 'Operations Officer',
                stationAssigned: 'Head Office'
            });
            console.log('Default KMRL Officer created — username: kmrlofficer | password: OFFICER456');
        }
    } catch (err) {
        console.error('Error creating default users:', err.message);
    }
};
ensureDefaultUsers();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity logger - logs important user/admin actions to MongoDB
app.use(activityLogger);

const userRoutes = require('./routes/user');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metro', metroRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lines', linesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Welcome route
app.get('/api/welcome', (req, res) => {
    res.json({
        message: 'Welcome to Kochi Metro Rail Limited (KMRL)',
        description: 'AI-Driven Train Induction Planning & Scheduling System',
        version: '1.0.0',
        endpoints: {
            auth: ['/api/auth/signup', '/api/auth/login'],
            metro: ['/api/metro/stations', '/api/metro/calculate-fare'],
            news: ['/api/news/all', '/api/news/create'],
            fare: ['/api/fare/stations', '/api/fare/calculate-fare']
        }
    });
});

// Note: frontend static serving removed to keep backend and frontend running on separate ports
const PORT = parseInt(process.env.PORT, 10) || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`KMRL Metro System API is ready`);
});