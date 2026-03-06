const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
let nodemailer;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }
const fs = require('fs');
const path = require('path');
const FALLBACK_STATIONS_FILE = path.join(__dirname, '..', 'data', 'stations_fallback.json');
const FALLBACK_BOOKINGS_FILE = path.join(__dirname, '..', 'data', 'bookings_fallback.json');
// Load local train data file as a fallback if external APIs are unavailable
let localTrains = [];
try {
    localTrains = require(path.join(__dirname, '..', 'data', 'metro_trains.json'));
} catch (e) {
    localTrains = [];
}

// Kochi Metro Stations Data (aligned with frontend codes)
const kochiMetroStations = [
    { stationId: 'ALV', name: 'Aluva', code: 'ALV', line: 'Line 1', order: 1 },
    { stationId: 'PUL', name: 'Pulinchodu', code: 'PUL', line: 'Line 1', order: 2 },
    { stationId: 'COM', name: 'Companypady', code: 'COM', line: 'Line 1', order: 3 },
    { stationId: 'SNJ', name: 'SN Junction', code: 'SNJ', line: 'Line 1', order: 4 },
    { stationId: 'AMB', name: 'Ambattukavu', code: 'AMB', line: 'Line 1', order: 5 },
    { stationId: 'KAK', name: 'Kakkanad', code: 'KAK', line: 'Line 1', order: 6 },
    { stationId: 'PAL', name: 'Palarivattom', code: 'PAL', line: 'Line 1', order: 7 },
    { stationId: 'EDA', name: 'Edapally', code: 'EDA', line: 'Line 1', order: 8 },
    { stationId: 'MUT', name: 'Muttom', code: 'MUT', line: 'Line 1', order: 9 },
    { stationId: 'KAL', name: 'Kaloor', code: 'KAL', line: 'Line 1', order: 10 },
    { stationId: 'LIS', name: 'Lissie', code: 'LIS', line: 'Line 1', order: 11 },
    { stationId: 'MGR', name: 'M.G. Road', code: 'MGR', line: 'Line 1', order: 12 },
    { stationId: 'ERS', name: 'Ernakulam South', code: 'ERS', line: 'Line 1', order: 13 },
    { stationId: 'VYT', name: 'Vyttila', code: 'VYT', line: 'Vyttila Extension', order: 14 },
    { stationId: 'THY', name: 'Thykoodam', code: 'THY', line: 'Vyttila Extension', order: 15 },
    { stationId: 'SEA', name: 'Seaport', code: 'SEA', line: 'Vyttila Extension', order: 16 }
];

// Helper: read/write simple JSON fallback files when MongoDB unavailable
const readJsonSync = (p, fallback) => {
    try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
};

const writeJsonSync = (p, data) => {
    try {
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.warn('Failed to write fallback file', p, e && e.message);
    }
};

const isDbConnected = () => !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);

const getStationsFallback = () => readJsonSync(FALLBACK_STATIONS_FILE, kochiMetroStations);

const saveBookingFallback = (booking) => {
    const arr = readJsonSync(FALLBACK_BOOKINGS_FILE, []);
    arr.push(booking);
    writeJsonSync(FALLBACK_BOOKINGS_FILE, arr);
};

// Initialize stations (for development)
router.post('/init-stations', async (req, res) => {
    try {
        await Station.deleteMany({});
        await Station.insertMany(kochiMetroStations);
        // persist a local fallback so frontend works if MongoDB is not running
        writeJsonSync(FALLBACK_STATIONS_FILE, kochiMetroStations);
        res.json({ message: 'Stations initialized successfully' });
    } catch (error) {
        console.error('Init stations error', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error initializing stations', error: error.message });
    }
});

// Default stored trains (used to seed DB if external API unavailable)
const sampleTrains = [
    { trainId: 'KM-ALU-EXP-01', name: 'Aluva Express', route: kochiMetroStations.map(s => s.code), startTime: '06:00', frequencyMinutes: 8, status: 'Running' },
    { trainId: 'KM-MG-LOC-01', name: 'M.G. Road Local', route: kochiMetroStations.map(s => s.code).slice().reverse(), startTime: '06:10', frequencyMinutes: 10, status: 'Running' },
    { trainId: 'KM-VYT-CON-01', name: 'Vyttila Connector', route: kochiMetroStations.filter(s => ['VYT', 'EDP', 'PLM', 'MGR'].includes(s.code)).map(s => s.code), startTime: '06:20', frequencyMinutes: 12, status: 'Running' },
    { trainId: 'KM-ALU-SHT-01', name: 'Aluva-MG Shuttle', route: kochiMetroStations.map(s => s.code), startTime: '07:00', frequencyMinutes: 15, status: 'Running' },
    { trainId: 'KM-PAL-EXP-01', name: 'Palarivattom Express', route: kochiMetroStations.map(s => s.code), startTime: '06:30', frequencyMinutes: 9, status: 'Running' }
];

// Helper: get current minutes since midnight
const minutesSinceMidnight = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

// Endpoint: get trains / timetable
router.get('/trains', async (req, res) => {
    try {
        // External API disabled by default for stability in local dev.
        // If you want to use an external TRAIN_API_URL, enable the block below.
        /*
        const externalApi = process.env.TRAIN_API_URL;
        if (externalApi) {
            try {
                const resp = await fetch(externalApi);
                const data = await resp.json();
                return res.json(data);
            } catch (e) {
                console.warn('External train API failed, falling back to stored trains');
            }
        }
        */

        // Try to read stored trains from DB; if none, seed from localTrains or sampleTrains
        let stored = await Train.find().lean();
        if (!stored || stored.length === 0) {
            await Train.deleteMany({});
            const seedSource = (localTrains && localTrains.length) ? localTrains : sampleTrains;
            const created = await Train.insertMany(seedSource.map(t => ({
                trainId: t.trainId || t.id || t.trainId,
                name: t.name,
                route: t.route,
                startTime: t.startTime || t.start || '06:00',
                frequencyMinutes: t.frequencyMinutes || t.freq || 10,
                status: t.status || 'Running',
                currentStation: t.route && t.route.length ? t.route[0] : null,
                nextStop: t.route && t.route.length > 1 ? t.route[1] : null
            })));
            stored = created;
        }

        // Build upcoming departures (simple calculation)
        const now = new Date();
        const currentMins = minutesSinceMidnight(now);
        const results = stored.map(train => {
            const [h, m] = (train.startTime || '06:00').split(':').map(Number);
            const startMins = h * 60 + m;
            const upcoming = [];
            for (let k = 0; k < 8; k++) {
                const dep = startMins + k * (train.frequencyMinutes || 10);
                if (dep >= currentMins - 30) {
                    const depHours = Math.floor((dep % (24 * 60)) / 60).toString().padStart(2, '0');
                    const depMins = (dep % 60).toString().padStart(2, '0');
                    upcoming.push({ departure: `${depHours}:${depMins}`, trainId: train.trainId });
                }
            }
            return { ...train, upcoming };
        });

        res.json(results);
    } catch (error) {
        console.error('Error in /trains', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error fetching trains' });
    }
});

// Endpoint: live train status (mock or proxied)
router.get('/trains/live', async (req, res) => {
    try {
        let liveTrains = [];
        if (isDbConnected()) {
            const Train = require('../models/Train');
            const dbTrains = await Train.find().lean();
            if (dbTrains && dbTrains.length) {
                liveTrains = dbTrains.map(t => ({
                    ...t,
                    timestamp: t.updatedAt || new Date()
                }));
            }
        }

        if (!liveTrains.length) {
            // Return a simple, safe live-like status derived from local data to avoid complex async logic
            const seedSource = (localTrains && localTrains.length) ? localTrains : sampleTrains;
            const now = new Date();
            liveTrains = seedSource.map((t, i) => ({
                trainId: t.trainId || t.id || `T-${i}`,
                name: t.name || `Train ${i + 1}`,
                route: t.route || [],
                currentStation: (Array.isArray(t.route) && t.route.length) ? t.route[Math.floor(Math.random() * t.route.length)] : null,
                nextStop: (Array.isArray(t.route) && t.route.length) ? t.route[Math.min(Math.floor(Math.random() * t.route.length) + 1, (t.route.length - 1))] : null,
                delayedByMinutes: Math.random() < 0.1 ? Math.floor(Math.random() * 10) + 1 : 0,
                status: t.status || 'Running',
                timestamp: now
            }));
        }

        return res.json(liveTrains);
    } catch (error) {
        console.error('Error in /trains/live', error);
        if (!res.headersSent) return res.status(500).json({ message: 'Error fetching live data' });
        return;
    }
});

// Create a booking and return booking id and ticket download
router.post('/book', async (req, res) => {
    try {
        const { fromStation, toStation, passengerName, passengerPhone, type, email, passengers } = req.body;
        // type: 'single' | 'day-pass' | 'weekly-pass' | 'monthly-pass' | 'smart-card'
        if (!type) return res.status(400).json({ message: 'type is required' });

        let fare = 0;
        let pCount = parseInt(passengers) || 1;
        let fromCode = fromStation || null;
        let toCode = toStation || null;

        // For single journey, require stations
        if (type === 'single') {
            if (!fromStation || !toStation) return res.status(400).json({ message: 'fromStation and toStation are required for single journey' });

            let from = null, to = null;
            if (isDbConnected()) {
                try {
                    from = await Station.findOne({ code: fromStation });
                    to = await Station.findOne({ code: toStation });
                } catch (e) {
                    from = null; to = null;
                }
            }

            if (!from || !to) {
                const st = getStationsFallback();
                from = st.find(s => s.code === fromStation) || null;
                to = st.find(s => s.code === toStation) || null;
            }

            if (!from || !to) return res.status(400).json({ message: 'Invalid stations' });
            const stops = Math.abs(from.order - to.order);
            fare = 10 + (stops * 5);
            fromCode = from.code;
            toCode = to.code;
        } else if (type === 'day-pass') {
            fare = 80; // fixed example price
        } else if (type === 'weekly-pass') {
            fare = 300;
        } else if (type === 'monthly-pass') {
            fare = 600;
        } else if (type === 'smart-card') {
            fare = 100; // card issuing cost (recharge separate)
        } else {
            return res.status(400).json({ message: 'Unknown ticket type' });
        }

        fare = fare * pCount;

        // --- Resolve userId from JWT (if present) before saving ---
        let resolvedUserId = null;
        try {
            const auth = req.headers && req.headers.authorization;
            if (auth && auth.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'your-secret-key');
                if (decoded && decoded.id) resolvedUserId = decoded.id;
            }
        } catch (e) {
            console.warn('[Metro/Book] Could not resolve userId from token:', e.message || e);
        }

        const bookingId = uuidv4();
        const bookingObj = {
            bookingId,
            userId: resolvedUserId || null,
            fromStation: fromCode || '',
            toStation: toCode || '',
            passengerName: passengerName || '',
            passengerPhone: passengerPhone || '',
            type: type || 'single',
            fare,
            status: 'Success',
            method: 'Card/UPI',
            createdAt: new Date()
        };

        let savedBooking = null;
        if (isDbConnected()) {
            try {
                const b = new Booking(bookingObj);
                savedBooking = await b.save();
                console.log('[Metro/Book] Booking saved to MongoDB:', bookingId);
            } catch (e) {
                console.error('[Metro/Book] Error saving Booking to DB:', e.message || e);
                saveBookingFallback(bookingObj);
                savedBooking = bookingObj;
            }
        } else {
            console.warn('[Metro/Book] DB not connected — saving booking to fallback file');
            saveBookingFallback(bookingObj);
            savedBooking = bookingObj;
        }

        // Attach booking to the authenticated user's bookings array
        if (resolvedUserId && isDbConnected()) {
            try {
                const User = require('../models/User');
                const u = await User.findById(resolvedUserId);
                if (u) {
                    u.bookings = u.bookings || [];
                    u.bookings.push({
                        bookingId,
                        fromStation: fromCode || '',
                        toStation: toCode || '',
                        type,
                        status: 'Success',
                        method: 'Card/UPI',
                        fare,
                        createdAt: new Date()
                    });
                    await u.save();
                    console.log('[Metro/Book] Booking attached to user:', resolvedUserId);
                } else {
                    console.warn('[Metro/Book] User not found for id:', resolvedUserId);
                }
            } catch (e) {
                console.warn('[Metro/Book] Failed to attach booking to user:', e.message || e);
            }
        } else if (!resolvedUserId) {
            console.warn('[Metro/Book] Guest booking — not attached to any user account');
        }

        const ticketUrl = `/api/metro/bookings/${bookingId}/ticket`;

        // Optionally send email if requested
        if (email) {
            try {
                // call existing email endpoint logic
                if (nodemailer && process.env.SMTP_HOST) {
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST,
                        port: process.env.SMTP_PORT || 587,
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
                    });
                    const fullUrl = `${req.protocol}://${req.get('host')}${ticketUrl}`;
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || 'no-reply@kmrl.local',
                        to: email,
                        subject: 'Your KMRL Ticket',
                        text: `Your ticket is available here: ${fullUrl}`,
                        html: `<p>Your ticket is available here: <a href="${fullUrl}">${fullUrl}</a></p>`
                    });
                }
            } catch (e) {
                console.warn('Failed to send immediate email', e);
            }
        }

        res.json({ bookingId, fare, ticketUrl });
    } catch (error) {
        console.error('Booking error', error);
        if (!res.headersSent) res.status(500).json({ message: 'Booking failed' });
    }
});

// Send ticket link to email (uses nodemailer when configured)
router.post('/email-ticket', async (req, res) => {
    try {
        const { bookingId, email } = req.body;
        if (!bookingId || !email) return res.status(400).json({ message: 'bookingId and email are required' });

        let booking = null;
        try {
            if (isDbConnected()) booking = await Booking.findOne({ bookingId });
        } catch (e) {
            booking = null;
        }
        if (!booking) {
            const fb = readJsonSync(FALLBACK_BOOKINGS_FILE, []);
            const found = fb.find(b => b.bookingId === bookingId);
            if (found) booking = found;
        }
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const ticketUrl = `${req.protocol}://${req.get('host')}/api/metro/bookings/${bookingId}/ticket`;

        if (!nodemailer || !process.env.SMTP_HOST) {
            // Nodemailer not configured — respond with ticket URL so frontend can show/email externally
            console.warn('SMTP not configured. Skipping email send.');
            return res.json({ message: 'SMTP not configured', ticketUrl });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'no-reply@kmrl.local',
            to: email,
            subject: 'Your KMRL Ticket',
            text: `Your ticket is available here: ${ticketUrl}`,
            html: `<p>Your ticket is available here: <a href="${ticketUrl}">${ticketUrl}</a></p>`
        });

        res.json({ message: 'Email sent', info });
    } catch (err) {
        console.error('Email ticket error', err);
        if (!res.headersSent) res.status(500).json({ message: 'Failed to send email' });
    }
});

// Get all bookings (admin/debug)
router.get('/bookings', async (req, res) => {
    try {
        if (!isDbConnected()) {
            const fb = readJsonSync(FALLBACK_BOOKINGS_FILE, []);
            return res.json(fb);
        }
        const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
        return res.json(bookings);
    } catch (err) {
        console.error('Fetch all bookings error', err);
        if (!res.headersSent) return res.status(500).json({ message: 'Error fetching bookings' });
    }
});

// Serve ticket PDF
router.get('/bookings/:id/ticket', async (req, res) => {
    try {
        const id = req.params.id;
        let booking = null;
        try {
            if (isDbConnected()) booking = await Booking.findOne({ bookingId: id });
        } catch (e) {
            booking = null;
        }

        if (!booking) {
            const fb = readJsonSync(FALLBACK_BOOKINGS_FILE, []);
            booking = fb.find(b => b.bookingId === id) || null;
        }

        if (!booking) return res.status(404).send('Booking not found');

        const doc = new PDFDocument();
        res.setHeader('Content-disposition', `attachment; filename=kmrl_ticket_${id}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        // Pipe first, then finalize the document
        doc.pipe(res);
        doc.fontSize(20).text('KMRL Ticket', { align: 'center' });
        doc.moveDown();

        // Add QR code (encodes bookingId + link)
        try {
            const fullUrl = `${req.protocol}://${req.get('host')}/api/metro/bookings/${booking.bookingId}/ticket`;
            const qrPayload = JSON.stringify({ bookingId: booking.bookingId, url: fullUrl });
            const qrBuffer = await QRCode.toBuffer(qrPayload, { type: 'png', width: 240, errorCorrectionLevel: 'H' });
            // place QR on the right side
            const startX = doc.page.width - 260;
            const curY = doc.y;
            doc.image(qrBuffer, startX, curY, { width: 220, height: 220 });
        } catch (e) {
            console.warn('Failed to render QR code in ticket PDF', e && e.message);
        }

        doc.fontSize(12).text(`Booking ID: ${booking.bookingId}`);
        doc.text(`Passenger: ${booking.passengerName || 'N/A'}`);
        doc.text(`Phone: ${booking.passengerPhone || 'N/A'}`);
        doc.text(`From: ${booking.fromStation}`);
        doc.text(`To: ${booking.toStation}`);
        doc.text(`Fare: ₹${booking.fare}`);
        const created = booking.createdAt ? new Date(booking.createdAt) : new Date();
        doc.text(`Booked At: ${created.toLocaleString()}`);
        doc.moveDown();
        doc.text('Present this ticket at entry gates. Scan the QR code on the right for quick validation.');
        doc.end();
    } catch (error) {
        console.error('Ticket PDF error', error);
        if (!res.headersSent) res.status(500).send('Error generating ticket');
    }
});

// Get all stations
router.get('/stations', async (req, res) => {
    try {
        // Prefer DB when connected, otherwise return fallback stations
        if (isDbConnected()) {
            try {
                const stations = await Station.find().sort('order');
                if (!res.headersSent) return res.json(stations);
            } catch (e) {
                // fall through to fallback
            }
        }

        const fallback = getStationsFallback();
        if (!res.headersSent) res.json(fallback);
    } catch (error) {
        console.error('Stations fetch error', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error fetching stations' });
    }
});

// Calculate fare
router.post('/calculate-fare', async (req, res) => {
    try {
        const { fromStation, toStation } = req.body;

        let from = null, to = null;
        if (isDbConnected()) {
            try {
                from = await Station.findOne({ code: fromStation });
                to = await Station.findOne({ code: toStation });
            } catch (e) {
                from = null; to = null;
            }
        }
        if (!from || !to) {
            const st = getStationsFallback();
            from = st.find(s => s.code === fromStation) || null;
            to = st.find(s => s.code === toStation) || null;
        }

        if (!from || !to) {
            if (!res.headersSent) return res.status(400).json({ message: 'Invalid station codes' });
            return;
        }

        const distance = Math.abs(from.order - to.order);
        const baseFare = 10;
        const farePerStation = 5;
        const totalFare = baseFare + (distance * farePerStation);

        // Calculate estimated time (2 minutes per station + 5 minutes base)
        const estimatedTime = (distance * 2) + 5;

        // Find intermediate stations
        const startOrder = Math.min(from.order, to.order);
        const endOrder = Math.max(from.order, to.order);

        let intermediateStations = [];
        if (isDbConnected()) {
            try {
                intermediateStations = await Station.find({ order: { $gt: startOrder, $lt: endOrder } }).sort('order');
            } catch (e) {
                intermediateStations = getStationsFallback().filter(s => s.order > startOrder && s.order < endOrder).sort((a, b) => a.order - b.order);
            }
        } else {
            intermediateStations = getStationsFallback().filter(s => s.order > startOrder && s.order < endOrder).sort((a, b) => a.order - b.order);
        }

        if (!res.headersSent) res.json({
            fromStation: from.name,
            toStation: to.name,
            distance: distance + 1, // +1 to include destination
            totalFare: totalFare,
            estimatedTime: estimatedTime,
            intermediateStations: intermediateStations.map(s => s.name),
            breakdown: {
                baseFare: baseFare,
                stationFare: distance * farePerStation,
                stationsTravelled: distance + 1
            }
        });
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ message: 'Error calculating fare' });
    }
});

// Get logged-in user's bookings
router.get('/my-bookings', async (req, res) => {
    try {
        const auth = req.headers && req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = auth.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (!decoded || !decoded.id) return res.status(401).json({ message: 'Unauthorized' });

        const User = require('../models/User');
        const user = await User.findById(decoded.id).select('bookings').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json(user.bookings || []);
    } catch (err) {
        console.error('Fetch my-bookings error', err);
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error fetching bookings' });
        }
    }
});

module.exports = router;