const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VirtualCard = require('../models/VirtualCard');
const CardTransaction = require('../models/CardTransaction');
const { kochiMetroStations, calculateFare } = require('../utils/fareCalculator');

// Helper to initialize Razorpay instance safely
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_API_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error('Razorpay credentials are not configured in environment.');
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

// Middleware: Authenticate JWT
const authenticate = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. Please log in to view or manage your metro card.' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
    }
};

// Generate a unique 16-digit card number in format: 4180 XXXX XXXX XXXX
const generateUniqueCardNumber = async () => {
    const prefix = '4180';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        attempts++;
        // Generate 3 blocks of 4 cryptographically secure random digits
        const randomBlock = () => {
            const buf = crypto.randomBytes(2);
            const num = (buf.readUInt16BE(0) % 9000) + 1000;
            return num.toString();
        };

        const cardNumber = `${prefix} ${randomBlock()} ${randomBlock()} ${randomBlock()}`;
        const existing = await VirtualCard.findOne({ cardNumber });
        if (!existing) {
            return cardNumber;
        }
    }

    // Fallback if loop exhausted
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix} ${ts.slice(0, 4)} ${ts.slice(4, 8)} ${rand}`;
};

// Helper: Get or atomically create a user's virtual card
const getOrCreateUserCard = async (userId) => {
    let card = await VirtualCard.findOne({ userId });
    if (card) {
        return card;
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found.');
    }

    const cardHolderName = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'KMRL COMMUTER').toUpperCase();
    const cardNumber = await generateUniqueCardNumber();

    try {
        card = await VirtualCard.create({
            cardNumber,
            userId,
            cardHolderName,
            balance: 100, // Default welcome balance of ₹100
            status: 'active',
            expiryDate: '08/29'
        });
        return card;
    } catch (err) {
        // If concurrent request created it in the meantime, retrieve and return
        if (err.code === 11000) {
            return await VirtualCard.findOne({ userId });
        }
        throw err;
    }
};

// ── 1. GET /api/card ──────────────────────────────────────────────────────────
// Retrieve (or auto-provision) the authenticated user's virtual card
router.get('/', authenticate, async (req, res) => {
    try {
        const card = await getOrCreateUserCard(req.user.id);
        res.json({
            cardId: card._id,
            cardNumber: card.cardNumber,
            cardHolderName: card.cardHolderName,
            balance: card.balance,
            status: card.status,
            expiryDate: card.expiryDate,
            createdAt: card.createdAt
        });
    } catch (error) {
        console.error('Error fetching/creating virtual card:', error);
        res.status(500).json({ message: error.message || 'Failed to retrieve virtual metro card.' });
    }
});

// ── 2. POST /api/card/create-order ───────────────────────────────────────────
// Create a Razorpay recharge order
router.post('/create-order', authenticate, async (req, res) => {
    try {
        const { amount } = req.body;
        const numericAmount = Number(amount);

        if (!numericAmount || isNaN(numericAmount) || numericAmount < 10) {
            return res.status(400).json({ message: 'Minimum recharge amount is ₹10.' });
        }

        if (numericAmount > 10000) {
            return res.status(400).json({ message: 'Maximum single recharge limit is ₹10,000.' });
        }

        const card = await getOrCreateUserCard(req.user.id);
        if (card.status !== 'active') {
            return res.status(403).json({ message: 'Virtual metro card is inactive or blocked. Please contact support.' });
        }

        const user = await User.findById(req.user.id);
        const razorpay = getRazorpayInstance();

        const amountInPaise = Math.round(numericAmount * 100);
        const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
                userId: req.user.id.toString(),
                cardId: card._id.toString(),
                purpose: 'Kochi Metro Virtual Card Recharge'
            }
        });

        const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        await CardTransaction.create({
            transactionId,
            userId: req.user.id,
            cardId: card._id,
            type: 'recharge',
            amount: numericAmount,
            amountInPaise,
            currency: 'INR',
            razorpayOrderId: order.id,
            paymentStatus: 'pending',
            creditStatus: 'pending',
            balanceBefore: card.balance,
            balanceAfter: card.balance,
            description: `Kochi Metro Card Recharge - ₹${numericAmount}`
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount, // in paise for Razorpay Checkout
            amountInRupees: numericAmount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_API_KEY_ID, // Safe public key ID for Razorpay frontend SDK
            transactionId,
            cardId: card._id,
            prefill: {
                name: user ? user.fullName : card.cardHolderName,
                email: user ? user.email : '',
                contact: user ? (user.contactNumber || '') : ''
            }
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: error.message || 'Failed to initiate recharge order.' });
    }
});

// ── 3. POST /api/card/verify-payment ─────────────────────────────────────────
// Verify Razorpay signature server-side and credit balance atomically
router.post('/verify-payment', authenticate, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Missing required Razorpay payment verification parameters.' });
        }

        // Find the pending transaction
        const transaction = await CardTransaction.findOne({
            razorpayOrderId,
            userId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction record not found for this user.' });
        }

        // Idempotency check: If already credited, return updated state without double-crediting
        if (transaction.paymentStatus === 'success' && transaction.creditStatus === 'credited') {
            const card = await VirtualCard.findById(transaction.cardId);
            return res.json({
                success: true,
                message: 'Payment already verified and balance credited.',
                balance: card ? card.balance : transaction.balanceAfter,
                alreadyProcessed: true
            });
        }

        // Server-side HMAC SHA256 signature verification with timing-safe comparison
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
            transaction.paymentStatus = 'failed';
            transaction.creditStatus = 'not_applicable';
            transaction.razorpayPaymentId = razorpayPaymentId;
            transaction.razorpaySignature = razorpaySignature;
            transaction.description += ' (Signature verification failed)';
            await transaction.save();
            return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
        }

        // Verify payment with Razorpay API to confirm capture status and amount match
        const razorpay = getRazorpayInstance();
        let paymentInfo;
        try {
            paymentInfo = await razorpay.payments.fetch(razorpayPaymentId);
        } catch (fetchErr) {
            console.error('Error fetching payment from Razorpay:', fetchErr);
            return res.status(502).json({ message: 'Could not verify payment with Razorpay service.' });
        }

        if (paymentInfo.order_id !== razorpayOrderId) {
            return res.status(400).json({ message: 'Payment does not match the recharge order ID.' });
        }

        if (paymentInfo.amount !== transaction.amountInPaise) {
            return res.status(400).json({ message: 'Payment amount mismatch detected.' });
        }

        // Atomically credit card balance
        const updatedCard = await VirtualCard.findOneAndUpdate(
            { _id: transaction.cardId, userId: req.user.id },
            {
                $inc: { balance: transaction.amount },
                $set: { updatedAt: new Date() }
            },
            { new: true }
        );

        if (!updatedCard) {
            return res.status(500).json({ message: 'Failed to update virtual card balance.' });
        }

        // Mark transaction as successful and credited
        transaction.paymentStatus = 'success';
        transaction.creditStatus = 'credited';
        transaction.razorpayPaymentId = razorpayPaymentId;
        transaction.razorpaySignature = razorpaySignature;
        transaction.balanceAfter = updatedCard.balance;
        await transaction.save();

        res.json({
            success: true,
            message: `Payment verified! ₹${transaction.amount} has been added to your Kochi Metro Card.`,
            balance: updatedCard.balance,
            transaction: {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                date: transaction.createdAt,
                paymentId: razorpayPaymentId
            }
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: error.message || 'Payment verification failed.' });
    }
});

// ── 4. POST /api/card/payment-failed ─────────────────────────────────────────
// Record a failed or cancelled payment attempt
router.post('/payment-failed', authenticate, async (req, res) => {
    try {
        const { razorpayOrderId, reason, code } = req.body;
        if (razorpayOrderId) {
            await CardTransaction.findOneAndUpdate(
                { razorpayOrderId, userId: req.user.id, paymentStatus: 'pending' },
                {
                    $set: {
                        paymentStatus: 'failed',
                        creditStatus: 'not_applicable',
                        description: `Recharge failed: ${reason || code || 'Payment cancelled or dismissed by user'}`
                    }
                }
            );
        }
        res.json({ success: true, message: 'Payment failure logged.' });
    } catch (error) {
        console.error('Failed to log payment failure:', error);
        res.status(500).json({ message: 'Error logging payment failure.' });
    }
});

// ── 5. POST /api/card/webhook ────────────────────────────────────────────────
// Optional Razorpay webhook listener for asynchronous event capture
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!secret || !signature) {
            return res.status(400).send('Webhook secret or signature missing');
        }

        const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const expectedSig = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

        if (signature !== expectedSig) {
            return res.status(400).send('Invalid webhook signature');
        }

        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const event = payload.event;

        if (event === 'payment.captured' || event === 'order.paid') {
            const payment = payload.payload?.payment?.entity;
            const orderId = payment?.order_id;
            const paymentId = payment?.id;

            if (orderId && paymentId) {
                const transaction = await CardTransaction.findOne({ razorpayOrderId: orderId });
                if (transaction && transaction.paymentStatus === 'pending') {
                    const updatedCard = await VirtualCard.findOneAndUpdate(
                        { _id: transaction.cardId },
                        { $inc: { balance: transaction.amount }, $set: { updatedAt: new Date() } },
                        { new: true }
                    );

                    transaction.paymentStatus = 'success';
                    transaction.creditStatus = 'credited';
                    transaction.razorpayPaymentId = paymentId;
                    if (updatedCard) {
                        transaction.balanceAfter = updatedCard.balance;
                    }
                    await transaction.save();
                }
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).send('Webhook handler error');
    }
});

// ── 6. GET /api/card/transactions ────────────────────────────────────────────
// Fetch recent transaction history for the user's virtual card
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const transactions = await CardTransaction.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching card transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transaction history.' });
    }
});

// ── 7. POST /api/card/simulate-journey ───────────────────────────────────────
// Simulate metro travel and deduct fare atomically using authoritative fare data
router.post('/simulate-journey', authenticate, async (req, res) => {
    try {
        const { fromStation, toStation } = req.body;

        if (!fromStation || !toStation) {
            return res.status(400).json({ message: 'Both origin and destination stations are required.' });
        }

        if (fromStation.trim().toLowerCase() === toStation.trim().toLowerCase()) {
            return res.status(400).json({ message: 'Origin and destination stations cannot be the same.' });
        }

        const fareDetails = calculateFare(fromStation.trim(), toStation.trim());
        if (!fareDetails) {
            return res.status(400).json({ message: 'Invalid station selection. Please choose valid Kochi Metro stations.' });
        }

        const { fare, distance } = fareDetails;

        const card = await getOrCreateUserCard(req.user.id);
        if (card.status !== 'active') {
            return res.status(403).json({ message: 'Your virtual card is not active. Please contact support.' });
        }

        // Insufficient balance check
        if (card.balance < fare) {
            return res.status(400).json({
                message: `Insufficient card balance! Fare is ₹${fare}, but your available balance is ₹${card.balance}. Please recharge your card.`,
                fare,
                balance: card.balance,
                requiresRecharge: true
            });
        }

        // Atomic deduction: ensure balance >= fare at time of deduction
        const updatedCard = await VirtualCard.findOneAndUpdate(
            { _id: card._id, userId: req.user.id, balance: { $gte: fare }, status: 'active' },
            {
                $inc: { balance: -fare },
                $set: { updatedAt: new Date() }
            },
            { new: true }
        );

        if (!updatedCard) {
            return res.status(400).json({
                message: 'Unable to deduct fare due to concurrent balance change or insufficient funds. Please try again.',
                requiresRecharge: true
            });
        }

        const transactionId = `TRIP_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const tripTransaction = await CardTransaction.create({
            transactionId,
            userId: req.user.id,
            cardId: card._id,
            type: 'fare_deduction',
            amount: fare,
            amountInPaise: fare * 100,
            currency: 'INR',
            paymentStatus: 'success',
            creditStatus: 'not_applicable',
            balanceBefore: card.balance,
            balanceAfter: updatedCard.balance,
            description: `Metro Journey: ${fromStation} → ${toStation} (${distance} km)`,
            journeyDetails: {
                fromStation,
                toStation,
                distance,
                fare
            }
        });

        res.json({
            success: true,
            message: `Journey simulated successfully! Fare of ₹${fare} deducted. New balance: ₹${updatedCard.balance}`,
            balance: updatedCard.balance,
            fare,
            distance,
            transaction: tripTransaction
        });
    } catch (error) {
        console.error('Error simulating metro journey:', error);
        res.status(500).json({ message: error.message || 'Failed to process metro fare deduction.' });
    }
});

// ── 8. GET /api/card/stations ────────────────────────────────────────────────
// List stations and distances for journey simulator
router.get('/stations', (req, res) => {
    try {
        res.json(kochiMetroStations);
    } catch (error) {
        console.error('Error loading stations:', error);
        res.status(500).json({ message: 'Failed to load station list.' });
    }
});

module.exports = router;
