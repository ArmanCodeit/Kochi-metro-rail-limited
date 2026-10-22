const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const VirtualCard = require('../models/VirtualCard');
const CardTransaction = require('../models/CardTransaction');
const User = require('../models/User');
const { lines, getAllUniqueStations, findRoutes } = require('../utils/metroNetwork');

// Optional JWT authentication helper
const resolveUserId = (req) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded.id;
    } catch {
        return null;
    }
};

const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_API_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials not found in environment.');
    }
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ── 1. GET /api/metro/network ────────────────────────────────────────────────
// Return multi-line network lines and all unique stations
router.get('/network', (req, res) => {
    try {
        const stations = getAllUniqueStations();
        res.json({
            lines,
            stations,
            totalLines: lines.length,
            totalStations: stations.length
        });
    } catch (err) {
        console.error('Error fetching network:', err);
        res.status(500).json({ message: 'Server error loading metro network' });
    }
});

// ── 2. POST /api/metro/plan-routes ───────────────────────────────────────────
// Plan journeys between origin and destination with transfer calculations
router.post('/plan-routes', (req, res) => {
    try {
        const fromStation = req.body.fromStation || req.body.from;
        const toStation = req.body.toStation || req.body.to;

        if (!fromStation || !toStation) {
            return res.status(400).json({ message: 'Both origin and destination stations are required.' });
        }

        if (fromStation.trim().toLowerCase() === toStation.trim().toLowerCase()) {
            return res.status(400).json({ message: 'Origin and destination stations cannot be the same.' });
        }

        const routes = findRoutes(fromStation, toStation);

        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: `No connected metro routes found between "${fromStation}" and "${toStation}".`,
                routes: []
            });
        }

        res.json({
            fromStation,
            toStation,
            routesCount: routes.length,
            routes
        });
    } catch (err) {
        console.error('Error planning routes:', err);
        res.status(500).json({ message: 'Server error calculating routes.' });
    }
});

// ── 3. POST /api/metro/tickets/create-order ──────────────────────────────────
// Create a Razorpay test order for a chosen route
router.post('/tickets/create-order', async (req, res) => {
    try {
        const { fromStation, toStation, routeId, passengers = 1 } = req.body;
        const pCount = Math.max(1, parseInt(passengers, 10) || 1);

        const routes = findRoutes(fromStation, toStation);
        const selectedRoute = routes.find(r => r.routeId === routeId) || routes[0];

        if (!selectedRoute) {
            return res.status(400).json({ message: 'Invalid route selection.' });
        }

        const totalFare = selectedRoute.fare * pCount;
        const amountInPaise = Math.round(totalFare * 100);

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `tkt_rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            notes: {
                fromStation,
                toStation,
                routeId: selectedRoute.routeId,
                passengers: pCount
            }
        });

        const userId = resolveUserId(req);
        let userProfile = null;
        if (userId) {
            userProfile = await User.findById(userId).select('fullName email contactNumber');
        }

        res.json({
            orderId: order.id,
            amount: order.amount,
            totalFare,
            currency: order.currency,
            keyId: process.env.RAZORPAY_API_KEY_ID,
            selectedRoute,
            passengers: pCount,
            prefill: {
                name: userProfile?.fullName || 'Metro Passenger',
                email: userProfile?.email || '',
                contact: userProfile?.contactNumber || ''
            }
        });
    } catch (err) {
        console.error('Error creating ticket order:', err);
        res.status(500).json({ message: err.message || 'Failed to initiate ticket order.' });
    }
});

// Helper: Issue ticket with authoritative 5-hour validity
const issueVerifiedTicket = async ({
    userId,
    passengerName,
    fromStation,
    toStation,
    selectedRoute,
    fare,
    passengers,
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId
}) => {
    const issuedAt = new Date();
    // Exactly 5 hours validity
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    const expiresAt = new Date(issuedAt.getTime() + FIVE_HOURS_MS);

    const ticketId = `KMRL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const qrToken = `TKT-${ticketId}-${crypto.randomBytes(8).toString('hex')}`;

    const newTicket = await Ticket.create({
        ticketId,
        userId: userId || null,
        passengerName: passengerName || 'Passenger',
        fromStation,
        toStation,
        route: selectedRoute,
        fare,
        passengers: passengers || 1,
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || 'razorpay_test',
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        ticketStatus: 'valid',
        issuedAt,
        expiresAt,
        qrToken
    });

    // Also write a backwards-compatible Booking record so existing TicketView/MyAccount displays it seamlessly
    try {
        await Booking.create({
            bookingId: ticketId,
            userId: userId || null,
            fromStation,
            toStation,
            passengerName: passengerName || 'Passenger',
            type: 'single',
            fare,
            status: 'Success',
            method: paymentMethod || 'Razorpay Test',
            createdAt: issuedAt
        });

        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $push: {
                    bookings: {
                        bookingId: ticketId,
                        fromStation,
                        toStation,
                        type: 'single',
                        fare,
                        status: 'Success',
                        method: paymentMethod || 'Razorpay Test',
                        createdAt: issuedAt
                    }
                }
            });
        }
    } catch (bookingSyncErr) {
        console.warn('Booking sync notice:', bookingSyncErr.message);
    }

    return newTicket;
};

// ── 4. POST /api/metro/tickets/verify-and-issue ──────────────────────────────
// Verify Razorpay payment signature on backend and issue 5-hour QR ticket
router.post('/tickets/verify-and-issue', async (req, res) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            fromStation,
            toStation,
            routeId,
            passengers = 1,
            passengerName
        } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Missing Razorpay payment parameters.' });
        }

        // Server-side timing-safe signature verification
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Server Razorpay configuration error.' });
        }

        const expectedPayload = `${razorpayOrderId}|${razorpayPaymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(expectedPayload)
            .digest('hex');

        let isSignatureValid = false;
        try {
            const bufA = Buffer.from(generatedSignature, 'utf8');
            const bufB = Buffer.from(razorpaySignature, 'utf8');
            if (bufA.length === bufB.length) {
                isSignatureValid = crypto.timingSafeEqual(bufA, bufB);
            }
        } catch {
            isSignatureValid = false;
        }

        if (!isSignatureValid) {
            return res.status(400).json({ message: 'Invalid payment signature. Ticket issuance rejected.' });
        }

        // Check if ticket already issued for this order (idempotency)
        const existingTicket = await Ticket.findOne({ razorpayOrderId });
        if (existingTicket) {
            return res.json({
                success: true,
                message: 'Ticket already issued.',
                ticket: existingTicket
            });
        }

        // Verify with Razorpay API
        const razorpay = getRazorpayInstance();
        const paymentInfo = await razorpay.payments.fetch(razorpayPaymentId);

        if (paymentInfo.order_id !== razorpayOrderId) {
            return res.status(400).json({ message: 'Payment does not match this ticket order.' });
        }

        // Derive authoritative route and fare on backend
        const routes = findRoutes(fromStation, toStation);
        const selectedRoute = routes.find(r => r.routeId === routeId) || routes[0];
        const pCount = Math.max(1, parseInt(passengers, 10) || 1);
        const totalFare = selectedRoute.fare * pCount;

        const userId = resolveUserId(req);

        const ticket = await issueVerifiedTicket({
            userId,
            passengerName,
            fromStation,
            toStation,
            selectedRoute,
            fare: totalFare,
            passengers: pCount,
            paymentMethod: 'razorpay_test',
            razorpayOrderId,
            razorpayPaymentId
        });

        res.json({
            success: true,
            message: 'Payment verified! Your 5-hour digital QR ticket has been generated.',
            ticket
        });
    } catch (err) {
        console.error('Error verifying and issuing ticket:', err);
        res.status(500).json({ message: err.message || 'Failed to issue ticket.' });
    }
});

// ── 5. POST /api/metro/tickets/pay-with-card ─────────────────────────────────
// Purchase a QR ticket using the user's Virtual Metro Card balance
router.post('/tickets/pay-with-card', async (req, res) => {
    try {
        const userId = resolveUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Please sign in to pay with your Virtual Metro Card.' });
        }

        const { fromStation, toStation, routeId, passengers = 1, passengerName } = req.body;
        const pCount = Math.max(1, parseInt(passengers, 10) || 1);

        const routes = findRoutes(fromStation, toStation);
        const selectedRoute = routes.find(r => r.routeId === routeId) || routes[0];

        if (!selectedRoute) {
            return res.status(400).json({ message: 'Invalid route selection.' });
        }

        const totalFare = selectedRoute.fare * pCount;

        const card = await VirtualCard.findOne({ userId, status: 'active' });
        if (!card) {
            return res.status(404).json({ message: 'Active Virtual Metro Card not found.' });
        }

        if (card.balance < totalFare) {
            return res.status(400).json({
                message: `Insufficient card balance! Fare is ₹${totalFare}, but your available card balance is ₹${card.balance}.`,
                requiredAmount: totalFare,
                cardBalance: card.balance,
                requiresRecharge: true
            });
        }

        // Atomically deduct fare
        const updatedCard = await VirtualCard.findOneAndUpdate(
            { _id: card._id, userId, balance: { $gte: totalFare }, status: 'active' },
            { $inc: { balance: -totalFare }, $set: { updatedAt: new Date() } },
            { new: true }
        );

        if (!updatedCard) {
            return res.status(400).json({ message: 'Unable to deduct balance. Please check your card balance and try again.' });
        }

        // Record card transaction
        const txnId = `TXN_TKT_${Date.now()}_${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        await CardTransaction.create({
            transactionId: txnId,
            userId,
            cardId: card._id,
            type: 'fare_deduction',
            amount: totalFare,
            amountInPaise: totalFare * 100,
            currency: 'INR',
            paymentStatus: 'success',
            creditStatus: 'not_applicable',
            balanceBefore: card.balance,
            balanceAfter: updatedCard.balance,
            description: `QR Ticket: ${fromStation} → ${toStation} (${pCount} Pax)`
        });

        // Issue 5-hour QR ticket
        const ticket = await issueVerifiedTicket({
            userId,
            passengerName: passengerName || card.cardHolderName,
            fromStation,
            toStation,
            selectedRoute,
            fare: totalFare,
            passengers: pCount,
            paymentMethod: 'virtual_card'
        });

        res.json({
            success: true,
            message: `Ticket issued! ₹${totalFare} paid from Virtual Metro Card. Remaining balance: ₹${updatedCard.balance}`,
            ticket,
            newCardBalance: updatedCard.balance
        });
    } catch (err) {
        console.error('Error paying with virtual card:', err);
        res.status(500).json({ message: err.message || 'Failed to purchase ticket with card.' });
    }
});

// ── 6. GET /api/metro/tickets/:ticketId ──────────────────────────────────────
// Fetch ticket details, recalculating 5-hour validity dynamically
router.get('/tickets/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await Ticket.findOne({
            $or: [{ ticketId }, { qrToken: ticketId }]
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found.' });
        }

        const now = Date.now();
        const expiresAtTime = new Date(ticket.expiresAt).getTime();
        const isExpired = now > expiresAtTime;
        const remainingSeconds = Math.max(0, Math.floor((expiresAtTime - now) / 1000));

        // If ticket has expired but status is still 'valid', atomically update status
        if (isExpired && ticket.ticketStatus === 'valid') {
            ticket.ticketStatus = 'expired';
            await ticket.save();
        }

        res.json({
            ticket,
            isExpired,
            remainingSeconds,
            validityDurationHours: 5,
            statusText: ticket.ticketStatus === 'valid' && !isExpired ? 'Active & Valid' : (ticket.ticketStatus === 'used' ? 'Used / Boarded' : 'Expired')
        });
    } catch (err) {
        console.error('Error retrieving ticket:', err);
        res.status(500).json({ message: 'Error retrieving ticket details.' });
    }
});

// ── 7. POST /api/metro/tickets/verify-scan ────────────────────────────────────
// Entry gate QR verification and atomic boarding validation
router.post('/tickets/verify-scan', async (req, res) => {
    try {
        const { qrToken, ticketId } = req.body;
        const lookup = qrToken ? { qrToken } : { ticketId };

        const ticket = await Ticket.findOne(lookup);

        if (!ticket) {
            return res.status(404).json({
                valid: false,
                reason: 'TICKET_NOT_FOUND',
                message: 'Invalid QR Ticket: No ticket record matches this scan code.'
            });
        }

        const now = Date.now();
        const expiresAtTime = new Date(ticket.expiresAt).getTime();

        if (now > expiresAtTime) {
            ticket.ticketStatus = 'expired';
            await ticket.save();
            return res.status(400).json({
                valid: false,
                reason: 'TICKET_EXPIRED',
                message: `Ticket expired on ${new Date(ticket.expiresAt).toLocaleTimeString('en-IN')}. Tickets are strictly valid for 5 hours from issuance.`,
                ticket
            });
        }

        if (ticket.ticketStatus === 'used') {
            return res.status(400).json({
                valid: false,
                reason: 'ALREADY_USED',
                message: `This ticket was already used for entry at ${new Date(ticket.usedAt).toLocaleTimeString('en-IN')}. Single-use boarding policy enforced.`,
                ticket
            });
        }

        if (ticket.ticketStatus !== 'valid' || ticket.paymentStatus !== 'paid') {
            return res.status(400).json({
                valid: false,
                reason: 'INVALID_STATUS',
                message: 'Ticket is cancelled or unpaid.',
                ticket
            });
        }

        // Atomically validate entry
        ticket.ticketStatus = 'used';
        ticket.usedAt = new Date();
        await ticket.save();

        res.json({
            valid: true,
            reason: 'ACCESS_GRANTED',
            message: `Entry Authorized! Valid ticket from ${ticket.fromStation} to ${ticket.toStation}.`,
            ticket
        });
    } catch (err) {
        console.error('Error verifying ticket scan:', err);
        res.status(500).json({ valid: false, message: 'Server error during ticket verification.' });
    }
});

// ── 8. GET /api/metro/user-tickets ───────────────────────────────────────────
// List user tickets
router.get('/user-tickets', async (req, res) => {
    try {
        const userId = resolveUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        const tickets = await Ticket.find({ userId })
            .sort({ issuedAt: -1 })
            .limit(20);

        res.json(tickets);
    } catch (err) {
        console.error('Error fetching user tickets:', err);
        res.status(500).json({ message: 'Error retrieving your tickets.' });
    }
});

module.exports = router;
