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

// Concurrency lock set to prevent rapid duplicate transfer submissions
const activeTransferLocks = new Set();
// Concurrency lock set to prevent rapid duplicate journey fare deductions
const activeJourneyLocks = new Set();

// Helper: Normalize card number by removing all whitespace and hyphens
const normalizeCardNumber = (cardStr) => {
    if (!cardStr) return '';
    return String(cardStr).replace(/[\s-]/g, '').trim();
};

// Helper: Mask card number for safe UI display: 4180 •••• •••• 3365
const maskCardNumber = (cardNumberStr) => {
    if (!cardNumberStr) return '•••• •••• •••• ••••';
    const digits = normalizeCardNumber(cardNumberStr);
    if (digits.length === 16) {
        return `${digits.slice(0, 4)} •••• •••• ${digits.slice(12)}`;
    }
    return `•••• •••• •••• ${digits.slice(-4)}`;
};

// Helper: Mask cardholder name safely: e.g. "Arman Singh" -> "A**** S****"
const maskName = (fullName) => {
    if (!fullName) return 'KMRL COMMUTER';
    return fullName.trim().split(/\s+/).map(part => {
        if (part.length <= 1) return part;
        return part[0] + '*'.repeat(Math.min(4, Math.max(1, part.length - 1)));
    }).join(' ');
};

// Helper: Lookup active card across spaced or unspaced format
const findActiveCard = async (rawCardNumber) => {
    if (!rawCardNumber) return null;
    const cleanDigits = normalizeCardNumber(rawCardNumber);
    const spacedFormat = cleanDigits.replace(/(\d{4})/g, '$1 ').trim();

    return await VirtualCard.findOne({
        $or: [
            { cardNumber: rawCardNumber.trim() },
            { cardNumber: spacedFormat },
            { cardNumber: cleanDigits }
        ]
    });
};

// Helper: Generate cryptographically secure 3-digit CVV for virtual metro card
const generateCardCVV = () => {
    const num = crypto.randomInt(100, 1000);
    return num.toString();
};

// Helper: Generate independent expiry month and year (e.g. 05/31)
const generateCardExpiry = () => {
    const month = crypto.randomInt(1, 13).toString().padStart(2, '0');
    const year = crypto.randomInt(29, 35).toString();
    return `${month}/${year}`;
};

// Helper: Get or atomically create a user's virtual card
const getOrCreateUserCard = async (userId) => {
    let card = await VirtualCard.findOne({ userId });
    const user = await User.findById(userId);

    if (card) {
        let isModified = false;

        // Safely repair missing or unassigned CVV without changing card number or balance
        if (!card.cvv) {
            card.cvv = generateCardCVV();
            isModified = true;
        }

        // Safely repair missing expiry date
        if (!card.expiryDate) {
            card.expiryDate = generateCardExpiry();
            isModified = true;
        }

        // Synchronize cardholder name if it is currently default 'KMRL COMMUTER' and user has a real name
        if (user) {
            const resolvedName = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '').toUpperCase();
            if (resolvedName && (!card.cardHolderName || card.cardHolderName === 'KMRL COMMUTER' || card.cardHolderName !== resolvedName)) {
                card.cardHolderName = resolvedName;
                isModified = true;
            }
        }

        if (isModified) {
            await card.save();
        }

        return card;
    }

    if (!user) {
        throw new Error('User not found.');
    }

    const cardHolderName = (user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'KMRL COMMUTER').toUpperCase();
    const cardNumber = await generateUniqueCardNumber();
    const expiryDate = generateCardExpiry();
    const cvv = generateCardCVV();

    try {
        card = await VirtualCard.create({
            cardNumber,
            userId,
            cardHolderName,
            balance: 100, // Default welcome balance of ₹100
            status: 'active',
            expiryDate,
            cvv
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

// ── 1. GET /api/card & GET /api/card/my-card ──────────────────────────────────
// Retrieve (or auto-provision) the authenticated user's virtual card
const handleGetMyCard = async (req, res) => {
    try {
        const card = await getOrCreateUserCard(req.user.id);
        res.json({
            cardId: card._id,
            cardNumber: card.cardNumber,
            cardHolderName: card.cardHolderName,
            balance: card.balance,
            status: card.status,
            expiryDate: card.expiryDate,
            cvv: card.cvv, // Returned exclusively for authenticated cardholder flip display
            createdAt: card.createdAt
        });
    } catch (error) {
        console.error('Error fetching/creating virtual card:', error);
        res.status(500).json({ message: error.message || 'Failed to retrieve virtual metro card.' });
    }
};

router.get('/', authenticate, handleGetMyCard);
router.get('/my-card', authenticate, handleGetMyCard);

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
        const transactions = await CardTransaction.find({
            $or: [
                { userId: req.user.id },
                { initiatingUserId: req.user.id },
                { recipientUserId: req.user.id }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching card transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transaction history.' });
    }
});

// ── 7. POST /api/card/simulate-journey ───────────────────────────────────────
// Authoritative metro journey fare deduction with route validation, idempotency, and balance synchronization
router.post('/simulate-journey', authenticate, async (req, res) => {
    const lockKey = req.user.id.toString();
    if (activeJourneyLocks.has(lockKey)) {
        return res.status(429).json({ message: 'A journey fare deduction is currently being processed. Please wait a moment.' });
    }
    activeJourneyLocks.add(lockKey);

    let session = null;
    let transactionSucceeded = false;

    try {
        const { fromStation, toStation, routeId, idempotencyKey } = req.body;

        if (!fromStation || !toStation) {
            return res.status(400).json({ message: 'Both origin and destination stations are required.' });
        }

        const cleanFrom = String(fromStation).trim();
        const cleanTo = String(toStation).trim();

        if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) {
            return res.status(400).json({ message: 'Origin and destination stations cannot be the same.' });
        }

        // 1. Idempotency Check: if identical idempotencyKey was already processed, return existing record
        if (idempotencyKey) {
            const existingTxn = await CardTransaction.findOne({
                idempotencyKey: String(idempotencyKey).trim(),
                userId: req.user.id
            });
            if (existingTxn) {
                const userCard = await VirtualCard.findById(existingTxn.cardId);
                return res.json({
                    success: true,
                    message: `Journey recorded! Traveled from ${existingTxn.journeyDetails?.fromStation || cleanFrom} to ${existingTxn.journeyDetails?.toStation || cleanTo}. Fare of ₹${existingTxn.amount} deducted.`,
                    balance: userCard ? userCard.balance : existingTxn.balanceAfter,
                    fare: existingTxn.amount,
                    distance: existingTxn.journeyDetails?.distance || 0,
                    routeName: existingTxn.journeyDetails?.routeName || '',
                    routeId: existingTxn.journeyDetails?.routeId || '',
                    transaction: existingTxn,
                    isIdempotentReplay: true
                });
            }
        }

        // 2. Rapid Duplicate Protection: within last 3 seconds for exact same card & stations
        const threeSecondsAgo = new Date(Date.now() - 3000);
        const recentDuplicate = await CardTransaction.findOne({
            userId: req.user.id,
            type: 'fare_deduction',
            'journeyDetails.fromStation': cleanFrom,
            'journeyDetails.toStation': cleanTo,
            createdAt: { $gte: threeSecondsAgo }
        }).sort({ createdAt: -1 });

        if (recentDuplicate) {
            const userCard = await VirtualCard.findById(recentDuplicate.cardId);
            return res.json({
                success: true,
                message: `Journey recorded! Traveled from ${cleanFrom} to ${cleanTo}. Fare of ₹${recentDuplicate.amount} deducted.`,
                balance: userCard ? userCard.balance : recentDuplicate.balanceAfter,
                fare: recentDuplicate.amount,
                distance: recentDuplicate.journeyDetails?.distance || 0,
                routeName: recentDuplicate.journeyDetails?.routeName || '',
                routeId: recentDuplicate.journeyDetails?.routeId || '',
                transaction: recentDuplicate,
                isDuplicatePrevented: true
            });
        }

        // 3. Authoritative route and fare lookup from single source of truth (metroNetwork)
        const fareDetails = calculateFare(cleanFrom, cleanTo, routeId);
        if (!fareDetails) {
            return res.status(400).json({ message: 'Invalid station or route selection. Please choose valid Kochi Metro stations.' });
        }

        const { fare, distance, routeName, totalStops, transfers, interchanges } = fareDetails;
        const resolvedRouteId = fareDetails.routeId;

        // 4. Retrieve card & verify balance
        const card = await getOrCreateUserCard(req.user.id);
        if (card.status !== 'active') {
            return res.status(403).json({ message: 'Your virtual card is not active. Please contact support.' });
        }

        if (card.balance < fare) {
            return res.status(400).json({
                message: `Insufficient card balance! Fare is ₹${fare}, but your available balance is ₹${card.balance}. Please recharge your card.`,
                fare,
                balance: card.balance,
                requiresRecharge: true
            });
        }

        const transactionId = `TRIP_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const resolvedIdempotencyKey = idempotencyKey ? String(idempotencyKey).trim() : transactionId;

        let updatedCard = null;
        let tripTransaction = null;

        // 5. Atomic deduction and transaction creation using replica session if available
        try {
            session = await VirtualCard.startSession();
            session.startTransaction();

            updatedCard = await VirtualCard.findOneAndUpdate(
                { _id: card._id, userId: req.user.id, balance: { $gte: fare }, status: 'active' },
                {
                    $inc: { balance: -fare },
                    $set: { updatedAt: new Date() }
                },
                { new: true, session }
            );

            if (!updatedCard) {
                throw new Error('INSUFFICIENT_OR_CONFLICT');
            }

            const [createdTxn] = await CardTransaction.create([{
                transactionId,
                idempotencyKey: resolvedIdempotencyKey,
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
                description: `Metro Journey: ${cleanFrom} → ${cleanTo} (${distance} km)`,
                journeyDetails: {
                    fromStation: cleanFrom,
                    toStation: cleanTo,
                    distance,
                    fare,
                    routeId: resolvedRouteId,
                    routeName,
                    totalStops,
                    transfers,
                    interchanges
                }
            }], { session });

            await session.commitTransaction();
            tripTransaction = createdTxn;
            transactionSucceeded = true;
        } catch (sessionErr) {
            if (session && session.inTransaction()) {
                await session.abortTransaction();
            }
            if (sessionErr.message === 'INSUFFICIENT_OR_CONFLICT') {
                return res.status(400).json({
                    message: `Unable to deduct fare due to concurrent balance change or insufficient funds. Available balance: ₹${card.balance}.`,
                    requiresRecharge: true
                });
            }
            // Standalone or non-replica environment fallback
            console.warn('[Metro/Card] Session transaction unsupported, falling back to atomic two-phase deduction with compensation:', sessionErr.message);
        } finally {
            if (session) {
                session.endSession();
            }
        }

        // 6. Safe fallback for environments where MongoDB replica set transactions are not active
        if (!transactionSucceeded) {
            updatedCard = await VirtualCard.findOneAndUpdate(
                { _id: card._id, userId: req.user.id, balance: { $gte: fare }, status: 'active' },
                {
                    $inc: { balance: -fare },
                    $set: { updatedAt: new Date() }
                },
                { new: true }
            );

            if (!updatedCard) {
                return res.status(400).json({
                    message: `Unable to deduct fare due to concurrent balance change or insufficient funds. Available balance: ₹${card.balance}.`,
                    requiresRecharge: true
                });
            }

            try {
                tripTransaction = await CardTransaction.create({
                    transactionId,
                    idempotencyKey: resolvedIdempotencyKey,
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
                    description: `Metro Journey: ${cleanFrom} → ${cleanTo} (${distance} km)`,
                    journeyDetails: {
                        fromStation: cleanFrom,
                        toStation: cleanTo,
                        distance,
                        fare,
                        routeId: resolvedRouteId,
                        routeName,
                        totalStops,
                        transfers,
                        interchanges
                    }
                });
            } catch (createErr) {
                // Compensating rollback: restore the deducted balance immediately
                await VirtualCard.findByIdAndUpdate(card._id, {
                    $inc: { balance: fare },
                    $set: { updatedAt: new Date() }
                });
                throw createErr;
            }
        }

        res.json({
            success: true,
            message: `Journey recorded! Traveled from ${cleanFrom} to ${cleanTo}. Fare of ₹${fare} deducted.`,
            balance: updatedCard.balance,
            fare,
            distance,
            routeName,
            routeId: resolvedRouteId,
            transaction: tripTransaction
        });
    } catch (error) {
        console.error('Error simulating metro journey:', error);
        res.status(500).json({ message: error.message || 'Failed to process metro fare deduction.' });
    } finally {
        activeJourneyLocks.delete(lockKey);
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

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: RECHARGE OTHER CARD (RAZORPAY)
// ══════════════════════════════════════════════════════════════════════════════

// ── 9. POST /api/card/verify-recipient ────────────────────────────────────────
// Validate recipient card exists and is active; return safe masked identifier
router.post('/verify-recipient', authenticate, async (req, res) => {
    try {
        const { cardNumber } = req.body;
        if (!cardNumber) {
            return res.status(400).json({ message: 'Please enter a 16-digit Kochi Metro card number.' });
        }

        const cleanDigits = normalizeCardNumber(cardNumber);
        if (cleanDigits.length !== 16 || !/^\d{16}$/.test(cleanDigits)) {
            return res.status(400).json({ message: 'Invalid card format. Kochi Metro cards are 16 digits.' });
        }

        const card = await findActiveCard(cardNumber);
        if (!card) {
            return res.status(404).json({ message: 'Metro card not found in KMRL system. Please check the card number.' });
        }

        if (card.status !== 'active') {
            return res.status(400).json({ message: `Card is currently ${card.status} and cannot receive funds.` });
        }

        res.json({
            valid: true,
            cardId: card._id,
            maskedCardNumber: maskCardNumber(card.cardNumber),
            cardHolderName: maskName(card.cardHolderName),
            status: card.status
        });
    } catch (error) {
        console.error('Error verifying recipient card:', error);
        res.status(500).json({ message: 'Error verifying recipient card.' });
    }
});

// ── 10. POST /api/card/recharge-other/create-order ────────────────────────────
// Create Razorpay order to recharge another commuter's card
router.post('/recharge-other/create-order', authenticate, async (req, res) => {
    try {
        const { recipientCardNumber, amount } = req.body;
        const numericAmount = Number(amount);

        if (!numericAmount || isNaN(numericAmount) || numericAmount < 10) {
            return res.status(400).json({ message: 'Minimum recharge amount is ₹10.' });
        }

        if (numericAmount > 10000) {
            return res.status(400).json({ message: 'Maximum single recharge limit is ₹10,000.' });
        }

        if (!recipientCardNumber) {
            return res.status(400).json({ message: 'Recipient card number is required.' });
        }

        const recipientCard = await findActiveCard(recipientCardNumber);
        if (!recipientCard) {
            return res.status(404).json({ message: 'Recipient metro card not found in KMRL system.' });
        }

        if (recipientCard.status !== 'active') {
            return res.status(403).json({ message: 'Recipient card is inactive or blocked. Cannot recharge.' });
        }

        const initiatingUser = await User.findById(req.user.id);
        const razorpay = getRazorpayInstance();

        const amountInPaise = Math.round(numericAmount * 100);
        const receipt = `rcpt_oth_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt,
            notes: {
                initiatingUserId: req.user.id.toString(),
                recipientCardId: recipientCard._id.toString(),
                recipientUserId: recipientCard.userId ? recipientCard.userId.toString() : '',
                purpose: 'Kochi Metro Other Card Recharge'
            }
        });

        const transactionId = `TXN_OTH_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        await CardTransaction.create({
            transactionId,
            userId: req.user.id,
            cardId: recipientCard._id,
            recipientCardId: recipientCard._id,
            initiatingUserId: req.user.id,
            recipientUserId: recipientCard.userId,
            type: 'recharge',
            transferCategory: 'other_card_recharge',
            amount: numericAmount,
            amountInPaise,
            currency: 'INR',
            razorpayOrderId: order.id,
            paymentStatus: 'pending',
            creditStatus: 'pending',
            balanceBefore: recipientCard.balance,
            balanceAfter: recipientCard.balance,
            description: `Recharge for Recipient Card ${maskCardNumber(recipientCard.cardNumber)}`
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            amountInRupees: numericAmount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_API_KEY_ID,
            transactionId,
            recipientCardId: recipientCard._id,
            maskedRecipientCard: maskCardNumber(recipientCard.cardNumber),
            cardHolderName: maskName(recipientCard.cardHolderName),
            prefill: {
                name: initiatingUser ? initiatingUser.fullName : 'KMRL Commuter',
                email: initiatingUser ? initiatingUser.email : '',
                contact: initiatingUser ? (initiatingUser.contactNumber || '') : ''
            }
        });
    } catch (error) {
        console.error('Error creating other card recharge order:', error);
        res.status(500).json({ message: error.message || 'Failed to initiate other card recharge order.' });
    }
});

// ── 11. POST /api/card/recharge-other/verify-payment ──────────────────────────
// Verify Razorpay payment and credit recipient's card balance atomically
router.post('/recharge-other/verify-payment', authenticate, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ message: 'Missing required Razorpay payment verification parameters.' });
        }

        // Find the pending transaction initiated by this user
        const transaction = await CardTransaction.findOne({
            razorpayOrderId,
            initiatingUserId: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({ message: 'Recharge transaction record not found.' });
        }

        // Idempotency check: If already credited, return cleanly without duplicate credit
        if (transaction.paymentStatus === 'success' && transaction.creditStatus === 'credited') {
            const recipientCard = await VirtualCard.findById(transaction.cardId);
            return res.json({
                success: true,
                message: 'Payment already verified and recipient card credited.',
                transactionReference: transaction.transactionId,
                amount: transaction.amount,
                maskedRecipientCard: maskCardNumber(recipientCard?.cardNumber),
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

        // Verify with Razorpay API
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

        // Atomically credit recipient card balance
        const updatedRecipientCard = await VirtualCard.findOneAndUpdate(
            { _id: transaction.cardId, status: 'active' },
            {
                $inc: { balance: transaction.amount },
                $set: { updatedAt: new Date() }
            },
            { new: true }
        );

        if (!updatedRecipientCard) {
            return res.status(500).json({ message: 'Failed to update recipient virtual card balance. Card may be inactive.' });
        }

        // Mark initiator transaction as success
        transaction.paymentStatus = 'success';
        transaction.creditStatus = 'credited';
        transaction.razorpayPaymentId = razorpayPaymentId;
        transaction.razorpaySignature = razorpaySignature;
        transaction.balanceAfter = updatedRecipientCard.balance;
        await transaction.save();

        // Also create transaction for recipient user's ledger if different user
        const initiatingUser = await User.findById(req.user.id);
        if (transaction.recipientUserId && transaction.recipientUserId.toString() !== req.user.id.toString()) {
            await CardTransaction.create({
                transactionId: `TXN_RCV_${transaction.transactionId}`,
                userId: transaction.recipientUserId,
                cardId: transaction.cardId,
                initiatingUserId: req.user.id,
                recipientUserId: transaction.recipientUserId,
                recipientCardId: transaction.cardId,
                type: 'recharge',
                transferCategory: 'other_card_recharge',
                amount: transaction.amount,
                amountInPaise: transaction.amountInPaise,
                currency: 'INR',
                razorpayOrderId,
                razorpayPaymentId,
                paymentStatus: 'success',
                creditStatus: 'credited',
                balanceBefore: updatedRecipientCard.balance - transaction.amount,
                balanceAfter: updatedRecipientCard.balance,
                description: `Metro Card Recharge credited by ${initiatingUser ? initiatingUser.fullName : 'KMRL Commuter'}`
            });
        }

        res.json({
            success: true,
            message: `Recharge successful! ₹${transaction.amount} has been credited to Metro Card ${maskCardNumber(updatedRecipientCard.cardNumber)}.`,
            transactionReference: transaction.transactionId,
            amount: transaction.amount,
            maskedRecipientCard: maskCardNumber(updatedRecipientCard.cardNumber),
            cardHolderName: maskName(updatedRecipientCard.cardHolderName),
            date: transaction.createdAt,
            paymentId: razorpayPaymentId
        });
    } catch (error) {
        console.error('Other card payment verification error:', error);
        res.status(500).json({ message: error.message || 'Payment verification failed.' });
    }
});

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: RECHARGE CARD VIA CARD (INTERNAL BALANCE TRANSFER)
// ══════════════════════════════════════════════════════════════════════════════

// ── 12. POST /api/card/transfer/verify-receiver ──────────────────────────────
// Verify receiver card is valid, active, and not the sender's own card
router.post('/transfer/verify-receiver', authenticate, async (req, res) => {
    try {
        const { receiverCardNumber } = req.body;
        if (!receiverCardNumber) {
            return res.status(400).json({ message: 'Please enter receiver metro card number.' });
        }

        const cleanDigits = normalizeCardNumber(receiverCardNumber);
        if (cleanDigits.length !== 16 || !/^\d{16}$/.test(cleanDigits)) {
            return res.status(400).json({ message: 'Invalid card format. Kochi Metro cards are 16 digits.' });
        }

        const senderCard = await VirtualCard.findOne({ userId: req.user.id });
        if (!senderCard) {
            return res.status(404).json({ message: 'Your virtual metro card was not found.' });
        }

        const receiverCard = await findActiveCard(receiverCardNumber);
        if (!receiverCard) {
            return res.status(404).json({ message: 'Receiver card not found in KMRL system.' });
        }

        // Prohibit self-transfer
        if (receiverCard._id.toString() === senderCard._id.toString()) {
            return res.status(400).json({ message: 'Self-transfer prohibited: Receiver card cannot be your own metro card.' });
        }

        if (receiverCard.status !== 'active') {
            return res.status(400).json({ message: `Receiver card is currently ${receiverCard.status} and cannot receive transfers.` });
        }

        res.json({
            valid: true,
            maskedCardNumber: maskCardNumber(receiverCard.cardNumber),
            cardHolderName: maskName(receiverCard.cardHolderName),
            status: receiverCard.status
        });
    } catch (error) {
        console.error('Error verifying receiver card:', error);
        res.status(500).json({ message: 'Error verifying receiver card.' });
    }
});

// ── 13. POST /api/card/transfer ──────────────────────────────────────────────
// Atomic balance transfer between authenticated sender and verified receiver
router.post('/transfer', authenticate, async (req, res) => {
    const lockKey = req.user.id.toString();
    if (activeTransferLocks.has(lockKey)) {
        return res.status(429).json({ message: 'A card transfer is already in progress. Please wait a moment.' });
    }
    activeTransferLocks.add(lockKey);

    let session = null;
    try {
        const { receiverCardNumber, amount, password, transferNote } = req.body;
        const numericAmount = Number(amount);

        // 1. Password verification for secure transaction authorization
        if (!password) {
            return res.status(400).json({ message: 'Account password is required to authorize the transfer.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(401).json({ message: 'Authenticated user not found.' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password. Card transfer authorization failed.' });
        }

        // 2. Amount verification
        if (!numericAmount || isNaN(numericAmount) || numericAmount < 10) {
            return res.status(400).json({ message: 'Minimum transfer amount is ₹10.' });
        }

        if (numericAmount > 10000) {
            return res.status(400).json({ message: 'Maximum single transfer limit is ₹10,000.' });
        }

        // 3. Sender card identification from authenticated session (NEVER trust frontend)
        const senderCard = await getOrCreateUserCard(req.user.id);
        if (!senderCard || senderCard.status !== 'active') {
            return res.status(403).json({ message: 'Your virtual card is not active. Transfer cannot proceed.' });
        }

        // 4. Sender balance verification
        if (senderCard.balance < numericAmount) {
            return res.status(400).json({
                message: `Insufficient balance! Your available balance is ₹${senderCard.balance}, but transfer amount is ₹${numericAmount}.`,
                availableBalance: senderCard.balance
            });
        }

        // 5. Receiver card verification
        if (!receiverCardNumber) {
            return res.status(400).json({ message: 'Receiver card number is required.' });
        }

        const receiverCard = await findActiveCard(receiverCardNumber);
        if (!receiverCard) {
            return res.status(404).json({ message: 'Receiver metro card not found in KMRL system.' });
        }

        if (receiverCard._id.toString() === senderCard._id.toString()) {
            return res.status(400).json({ message: 'Self-transfer prohibited: Cannot transfer funds to your own card.' });
        }

        if (receiverCard.status !== 'active') {
            return res.status(400).json({ message: 'Receiver metro card is inactive or blocked.' });
        }

        // 6. Concurrency-safe atomic execution via MongoDB Multi-Document Transaction
        session = await VirtualCard.startSession();
        session.startTransaction();

        // Atomically debit sender (ensuring balance >= numericAmount at execution time)
        const debitedSender = await VirtualCard.findOneAndUpdate(
            { _id: senderCard._id, balance: { $gte: numericAmount }, status: 'active' },
            { $inc: { balance: -numericAmount }, $set: { updatedAt: new Date() } },
            { new: true, session }
        );

        if (!debitedSender) {
            throw new Error('Transfer failed: Concurrency conflict or insufficient balance.');
        }

        // Atomically credit receiver
        const creditedReceiver = await VirtualCard.findOneAndUpdate(
            { _id: receiverCard._id, status: 'active' },
            { $inc: { balance: numericAmount }, $set: { updatedAt: new Date() } },
            { new: true, session }
        );

        if (!creditedReceiver) {
            throw new Error('Transfer failed: Recipient card is unavailable.');
        }

        const txnRef = `XFER_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Create sender debit transaction record
        await CardTransaction.create([{
            transactionId: txnRef,
            userId: req.user.id,
            cardId: senderCard._id,
            senderCardId: senderCard._id,
            recipientCardId: receiverCard._id,
            initiatingUserId: req.user.id,
            recipientUserId: receiverCard.userId,
            type: 'fare_deduction',
            transferCategory: 'card_to_card_transfer',
            amount: numericAmount,
            amountInPaise: numericAmount * 100,
            currency: 'INR',
            paymentStatus: 'success',
            creditStatus: 'credited',
            balanceBefore: senderCard.balance,
            balanceAfter: debitedSender.balance,
            description: `Transfer to Card ${maskCardNumber(receiverCard.cardNumber)}${transferNote ? ` (${transferNote})` : ''}`
        }], { session });

        // Create receiver credit transaction record
        await CardTransaction.create([{
            transactionId: `REC_${txnRef}`,
            userId: receiverCard.userId,
            cardId: receiverCard._id,
            senderCardId: senderCard._id,
            recipientCardId: receiverCard._id,
            initiatingUserId: req.user.id,
            recipientUserId: receiverCard.userId,
            type: 'recharge',
            transferCategory: 'card_to_card_transfer',
            amount: numericAmount,
            amountInPaise: numericAmount * 100,
            currency: 'INR',
            paymentStatus: 'success',
            creditStatus: 'credited',
            balanceBefore: receiverCard.balance,
            balanceAfter: creditedReceiver.balance,
            description: `Transfer from Card ${maskCardNumber(senderCard.cardNumber)}${transferNote ? ` (${transferNote})` : ''}`
        }], { session });

        await session.commitTransaction();
        session.endSession();
        session = null;

        res.json({
            success: true,
            message: `Transfer of ₹${numericAmount} to card ${maskCardNumber(receiverCard.cardNumber)} completed successfully!`,
            transactionReference: txnRef,
            amount: numericAmount,
            senderNewBalance: debitedSender.balance,
            maskedSenderCard: maskCardNumber(senderCard.cardNumber),
            maskedReceiverCard: maskCardNumber(receiverCard.cardNumber),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (session) {
            try {
                await session.abortTransaction();
                session.endSession();
            } catch (abortErr) {
                console.error('Error aborting session:', abortErr);
            }
        }
        console.error('Card-to-card transfer error:', error);
        res.status(500).json({ message: error.message || 'Transfer failed. No funds were debited.' });
    } finally {
        activeTransferLocks.delete(lockKey);
    }
});

module.exports = router;

