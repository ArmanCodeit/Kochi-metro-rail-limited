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
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const app = express();


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

        // ── Primary Commuter account (arman) ────────────────────────────────
        const armanExists = await User.findOne({
            $or: [{ email: 'armansingh7856@gmail.com' }, { username: 'armansingh7856' }]
        });
        if (!armanExists) {
            await User.create({
                fullName: 'Arman Singh',
                email: 'armansingh7856@gmail.com',
                username: 'armansingh7856',
                password: 'Arman@7477',
                userType: 'customer'
            });
            console.log('Commuter account for armansingh7856@gmail.com initialized.');
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

const Station = require('./models/Station');
const { getAllUniqueStations } = require('./utils/metroNetwork');
const ensureDefaultStations = async () => {
    try {
        const count = await Station.countDocuments();
        const unique = getAllUniqueStations();
        if (count < unique.length) {
            for (let i = 0; i < unique.length; i++) {
                const st = unique[i];
                await Station.updateOne(
                    { code: st.code },
                    {
                        stationId: st.code,
                        name: st.name,
                        code: st.code,
                        line: st.lines ? st.lines.join(' / ') : 'Blue Line',
                        location: {
                            latitude: st.lat,
                            longitude: st.lng
                        },
                        facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
                        platformCount: st.isInterchange ? 4 : 2,
                        order: i + 1,
                        status: 'Active'
                    },
                    { upsert: true }
                );
            }
            console.log(`Synchronized ${unique.length} authoritative stations in MongoDB Atlas.`);
        }
    } catch (err) {
        console.error('Error synchronizing stations:', err.message);
    }
};

// Connect to MongoDB Atlas with auto-retry on cold start / transient network delays
const mongoose = require('mongoose');
let isConnecting = false;
const initDatabase = async () => {
    if (isConnecting || mongoose.connection.readyState === 1) return;
    isConnecting = true;
    try {
        await connectDB();
        await ensureDefaultUsers();
        await ensureDefaultStations();
    } catch (err) {
        console.error('Database connection error on server startup:', err.message);
        console.log('Will retry connecting to MongoDB Atlas in 10 seconds...');
        setTimeout(initDatabase, 10000);
    } finally {
        isConnecting = false;
    }
};
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity logger - logs important user/admin actions to MongoDB
app.use(activityLogger);

const userRoutes = require('./routes/user');
const cardRoutes = require('./routes/card');
const ticketRoutes = require('./routes/tickets');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metro', ticketRoutes);
app.use('/api/metro', metroRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lines', linesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/card', cardRoutes);

// Health check endpoint for Render and operations monitoring
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;
    res.status(isDbConnected ? 200 : 503).json({
        status: isDbConnected ? 'healthy' : 'degraded',
        database: {
            connected: isDbConnected,
            readyState: dbState,
            host: mongoose.connection.host || 'unknown',
            name: mongoose.connection.name || 'unknown'
        },
        timestamp: new Date().toISOString()
    });
});

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

// Serve static frontend assets and support SPA routing when production build (frontend/dist) is present
const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    // Handle SPA client-side routing fallback for non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

const PORT = parseInt(process.env.PORT, 10) || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`KMRL Metro System API is ready`);
});