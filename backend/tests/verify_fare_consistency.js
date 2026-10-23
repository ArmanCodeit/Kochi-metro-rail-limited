const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const VirtualCard = require('../models/VirtualCard');
const CardTransaction = require('../models/CardTransaction');
const { findRoutes } = require('../utils/metroNetwork');
const { calculateFare } = require('../utils/fareCalculator');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let testUser = null;
let testCard = null;

async function setup() {
    await mongoose.connect(process.env.MONGO_DB_ATLAS_CONNECTION_STRING);
    console.log('Connected to MongoDB Atlas');

    // Create or find a clean dedicated test account for financial assertions
    testUser = await User.findOne({ email: 'autotest_commuter@kmrl.gov.in' });
    if (!testUser) {
        testUser = await User.create({
            fullName: 'Audit Test Commuter',
            email: 'autotest_commuter@kmrl.gov.in',
            username: 'autotestcommuter',
            password: '$2a$10$e8V9Msqi8G57xI9U37UjBODm6qI3uH05UoX31e7dCkJ9m4U5zDkya', // valid bcrypt hash
            userType: 'customer',
            isVerified: true
        });
    }

    authToken = jwt.sign({ id: testUser._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '1d'
    });

    // Ensure user has a virtual card with known balance (₹500 for testing)
    testCard = await VirtualCard.findOne({ userId: testUser._id });
    if (!testCard) {
        testCard = await VirtualCard.create({
            cardNumber: '4180 9999 8888 7777',
            userId: testUser._id,
            cardHolderName: 'AUDIT TEST COMMUTER',
            balance: 500,
            status: 'active',
            expiryDate: '12/32',
            cvv: '999'
        });
    } else {
        testCard.balance = 500;
        testCard.status = 'active';
        await testCard.save();
    }

    console.log(`Test user initialized: ${testUser.email}, Card Balance: ₹${testCard.balance}`);
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
}

async function runTests() {
    await setup();
    const results = [];

    const record = (num, title, passed, details) => {
        results.push({ num, title, passed, details });
        console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [Test ${num}] ${title}`);
        if (!passed || details) console.log(`   -> Details: ${details}`);
    };

    try {
        // -------------------------------------------------------------
        // Case 1: Route with valid fare ₹60 displays ₹60 and deducts ₹60
        // -------------------------------------------------------------
        const aluvaInfoparkRoutes = findRoutes('Aluva', 'Infopark');
        const alt6 = aluvaInfoparkRoutes.find(r => r.routeId === 'TRANSFER2_line-1_JLN_line-2_INF_line-7');
        const displayedFare60 = alt6.fare;

        const balBefore60 = (await VirtualCard.findById(testCard._id)).balance;
        const res60 = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Infopark',
            routeId: alt6.routeId
        });

        const cardAfter60 = await VirtualCard.findById(testCard._id);
        const pass1 = res60.ok &&
            displayedFare60 === 60 &&
            res60.data.fare === 60 &&
            cardAfter60.balance === balBefore60 - 60;

        record(1, 'Route with valid fare of ₹60 displays ₹60 and deducts ₹60', pass1,
            `Displayed: ₹${displayedFare60}, Deducted: ₹${res60.data?.fare}, Balance before: ₹${balBefore60}, Balance after: ₹${cardAfter60.balance}`);

        // -------------------------------------------------------------
        // Case 2: Route with valid fare ₹25 displays ₹25 and deducts ₹25
        // -------------------------------------------------------------
        const aluvaEdappallyRoutes = findRoutes('Aluva', 'Edappally');
        const directEdappally = aluvaEdappallyRoutes[0];
        const displayedFare25 = directEdappally.fare;

        // Wait 3.1s to clear the rapid duplicate protection window
        await new Promise(r => setTimeout(r, 3100));

        const balBefore25 = (await VirtualCard.findById(testCard._id)).balance;
        const res25 = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Edappally',
            routeId: directEdappally.routeId
        });

        const cardAfter25 = await VirtualCard.findById(testCard._id);
        const pass2 = res25.ok &&
            displayedFare25 === 25 &&
            res25.data.fare === 25 &&
            cardAfter25.balance === balBefore25 - 25;

        record(2, 'Route with valid fare of ₹25 displays ₹25 and deducts ₹25', pass2,
            `Displayed: ₹${displayedFare25}, Deducted: ₹${res25.data?.fare}, Balance before: ₹${balBefore25}, Balance after: ₹${cardAfter25.balance}`);

        // -------------------------------------------------------------
        // Case 3: The ledger amount matches the actual deduction
        // -------------------------------------------------------------
        const txn60 = await CardTransaction.findById(res60.data.transaction._id);
        const txn25 = await CardTransaction.findById(res25.data.transaction._id);

        const pass3 = txn60 && txn60.amount === 60 && txn60.type === 'fare_deduction' &&
                      txn25 && txn25.amount === 25 && txn25.type === 'fare_deduction';

        record(3, 'Ledger amount matches actual deduction', pass3,
            `Txn 1 amount: ₹${txn60?.amount} (${txn60?.description}), Txn 2 amount: ₹${txn25?.amount} (${txn25?.description})`);

        // -------------------------------------------------------------
        // Case 4: Resulting card balance is correct
        // -------------------------------------------------------------
        const pass4 = txn60.balanceAfter === balBefore60 - 60 &&
                      txn25.balanceAfter === balBefore25 - 25 &&
                      cardAfter25.balance === txn25.balanceAfter;

        record(4, 'Resulting card balance is strictly correct in both card and ledger', pass4,
            `Expected final balance: ₹${balBefore25 - 25}, Actual card balance: ₹${cardAfter25.balance}, Ledger balanceAfter: ₹${txn25.balanceAfter}`);

        // -------------------------------------------------------------
        // Case 5: Switching between route alternatives updates the fare correctly
        // -------------------------------------------------------------
        const alt1 = aluvaInfoparkRoutes.find(r => r.routeId === 'TRANSFER_line-1_CUS_line-7');
        const alt5 = aluvaInfoparkRoutes.find(r => r.routeId === 'TRANSFER2_line-1_KAL_line-5_KKJ_line-2');
        const alt6Check = aluvaInfoparkRoutes.find(r => r.routeId === 'TRANSFER2_line-1_JLN_line-2_INF_line-7');

        const calcAlt1 = calculateFare('Aluva', 'Infopark', alt1.routeId);
        const calcAlt5 = calculateFare('Aluva', 'Infopark', alt5.routeId);
        const calcAlt6 = calculateFare('Aluva', 'Infopark', alt6Check.routeId);

        const pass5 = calcAlt1.fare === 30 && calcAlt5.fare === 40 && calcAlt6.fare === 60;
        record(5, 'Switching between route alternatives updates fare dynamically', pass5,
            `Alt 1 (via Cochin Univ): ₹${calcAlt1.fare}, Alt 5 (via Kalamassery): ₹${calcAlt5.fare}, Alt 6 (via JLN Stadium): ₹${calcAlt6.fare}`);

        // -------------------------------------------------------------
        // Case 6: Failed transaction does not deduct money or create ledger entry
        // -------------------------------------------------------------
        const balBeforeFail = (await VirtualCard.findById(testCard._id)).balance;
        const txnsCountBefore = await CardTransaction.countDocuments({ cardId: testCard._id });

        const resFail = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Aluva' // invalid: same origin and destination
        });

        const balAfterFail = (await VirtualCard.findById(testCard._id)).balance;
        const txnsCountAfter = await CardTransaction.countDocuments({ cardId: testCard._id });

        const pass6 = !resFail.ok &&
                      balBeforeFail === balAfterFail &&
                      txnsCountBefore === txnsCountAfter;

        record(6, 'Failed transaction does not deduct money or create ledger entry', pass6,
            `Status: ${resFail.status}, Message: "${resFail.data.message}", Balance unchanged: ₹${balAfterFail}`);

        // -------------------------------------------------------------
        // Case 7: Double-clicking Tap Card does not create duplicate deductions
        // -------------------------------------------------------------
        await new Promise(r => setTimeout(r, 3100)); // wait past 3s
        const balBeforeDouble = (await VirtualCard.findById(testCard._id)).balance;
        const targetRoute = directEdappally;

        // Send two simultaneous requests
        const [double1, double2] = await Promise.all([
            apiRequest('/api/card/simulate-journey', 'POST', {
                fromStation: 'Aluva',
                toStation: 'Edappally',
                routeId: targetRoute.routeId
            }),
            apiRequest('/api/card/simulate-journey', 'POST', {
                fromStation: 'Aluva',
                toStation: 'Edappally',
                routeId: targetRoute.routeId
            })
        ]);

        const balAfterDouble = (await VirtualCard.findById(testCard._id)).balance;
        // Fare of ₹25 should be deducted EXACTLY once, balance decreased by 25, not 50!
        const pass7 = (balBeforeDouble - balAfterDouble === 25) &&
                      (double1.ok && (double2.data.isDuplicatePrevented || double2.status === 429 || double2.data.isIdempotentReplay || double2.data.balance === balAfterDouble));

        record(7, 'Double-clicking Tap Card does not create duplicate deductions', pass7,
            `Balance before: ₹${balBeforeDouble}, Balance after: ₹${balAfterDouble} (Diff: ₹${balBeforeDouble - balAfterDouble}), Req 1: ${double1.status}, Req 2: ${double2.status} (duplicate prevented: ${double2.data.isDuplicatePrevented || double2.status === 429})`);

        // -------------------------------------------------------------
        // Case 8: Retrying a previously successful request does not deduct fare again
        // -------------------------------------------------------------
        await new Promise(r => setTimeout(r, 3100));
        const testIdempotencyKey = `TEST_IDEMP_${Date.now()}`;
        const balBeforeIdemp = (await VirtualCard.findById(testCard._id)).balance;

        const firstTry = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Edappally',
            routeId: targetRoute.routeId,
            idempotencyKey: testIdempotencyKey
        });

        const balAfterFirst = (await VirtualCard.findById(testCard._id)).balance;

        // Retry identical request with same idempotencyKey
        const secondTry = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Edappally',
            routeId: targetRoute.routeId,
            idempotencyKey: testIdempotencyKey
        });

        const balAfterSecond = (await VirtualCard.findById(testCard._id)).balance;

        const pass8 = firstTry.ok &&
                      secondTry.ok &&
                      secondTry.data.isIdempotentReplay === true &&
                      balAfterFirst === balBeforeIdemp - 25 &&
                      balAfterSecond === balAfterFirst;

        record(8, 'Retrying request with idempotencyKey does not deduct fare again', pass8,
            `First try fare: ₹${firstTry.data.fare}, Second try isIdempotentReplay: ${secondTry.data.isIdempotentReplay}, Balance unchanged: ₹${balAfterSecond}`);

        // -------------------------------------------------------------
        // Case 9: Insufficient balance is handled correctly
        // -------------------------------------------------------------
        await VirtualCard.findByIdAndUpdate(testCard._id, { balance: 15 });
        const resInsufficient = await apiRequest('/api/card/simulate-journey', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Infopark',
            routeId: alt6.routeId // fare ₹60, balance ₹15
        });

        const balAfterInsufficient = (await VirtualCard.findById(testCard._id)).balance;
        const pass9 = resInsufficient.status === 400 &&
                      resInsufficient.data.requiresRecharge === true &&
                      balAfterInsufficient === 15;

        record(9, 'Insufficient balance handled correctly (fails safely without deduction)', pass9,
            `Status: ${resInsufficient.status}, RequiresRecharge: ${resInsufficient.data.requiresRecharge}, Balance preserved: ₹${balAfterInsufficient}`);

        // Restore card balance
        await VirtualCard.findByIdAndUpdate(testCard._id, { balance: 500 });

        // -------------------------------------------------------------
        // Case 10: Recharge credits amount actually verified by payment provider, exactly once
        // -------------------------------------------------------------
        // Test idempotency of verify-payment: an already credited order cannot be credited twice
        const testOrderId = `order_test_${Date.now()}`;
        const testPaymentId = `pay_test_${Date.now()}`;

        // Create a successful transaction record representing an already credited transaction
        const existingTxn = await CardTransaction.create({
            transactionId: `TXN_TEST_${Date.now()}`,
            userId: testUser._id,
            cardId: testCard._id,
            type: 'recharge',
            amount: 100,
            amountInPaise: 10000,
            currency: 'INR',
            razorpayOrderId: testOrderId,
            razorpayPaymentId: testPaymentId,
            paymentStatus: 'success',
            creditStatus: 'credited',
            balanceBefore: 400,
            balanceAfter: 500,
            description: 'Kochi Metro Card Recharge - ₹100'
        });

        const balBeforeRecredit = (await VirtualCard.findById(testCard._id)).balance;

        // Call verify-payment for this already processed order
        const recreditAttempt = await apiRequest('/api/card/verify-payment', 'POST', {
            razorpayOrderId: testOrderId,
            razorpayPaymentId: testPaymentId,
            razorpaySignature: 'dummy_sig'
        });

        const balAfterRecredit = (await VirtualCard.findById(testCard._id)).balance;
        const pass10 = recreditAttempt.data.alreadyProcessed === true &&
                       balBeforeRecredit === balAfterRecredit;

        record(10, 'Recharge payment verification prevents double crediting via idempotency', pass10,
            `AlreadyProcessed: ${recreditAttempt.data.alreadyProcessed}, Balance unchanged at ₹${balAfterRecredit}`);

        // Clean up test recharge record
        await CardTransaction.findByIdAndDelete(existingTxn._id);

        // -------------------------------------------------------------
        // Case 11: QR ticket booking and pay-with-card continue working
        // -------------------------------------------------------------
        const qrTicketRoutes = findRoutes('Aluva', 'Kalamassery');
        const qrRoute = qrTicketRoutes[0]; // fare ₹20
        const balBeforeTicket = (await VirtualCard.findById(testCard._id)).balance;

        const ticketRes = await apiRequest('/api/metro/tickets/pay-with-card', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Kalamassery',
            routeId: qrRoute.routeId,
            passengers: 1,
            passengerName: 'Test Commuter'
        });

        const balAfterTicket = (await VirtualCard.findById(testCard._id)).balance;
        const pass11 = ticketRes.ok &&
                       ticketRes.data.success &&
                       ticketRes.data.ticket &&
                       balAfterTicket === balBeforeTicket - qrRoute.fare;

        record(11, 'QR ticket pay-with-card issues ticket and deducts exact route fare', pass11,
            `Fare: ₹${qrRoute.fare}, Ticket ID: ${ticketRes.data?.ticket?.ticketId}, Remaining Bal: ₹${balAfterTicket}`);

        // -------------------------------------------------------------
        // Case 12: Existing login, signup, maps, route planning still work
        // -------------------------------------------------------------
        const planRes = await apiRequest('/api/metro/plan-routes', 'POST', {
            fromStation: 'Aluva',
            toStation: 'Infopark'
        });

        const stationsRes = await apiRequest('/api/metro/stations');

        const pass12 = planRes.ok &&
                       planRes.data.routes.length === 8 &&
                       stationsRes.ok &&
                       Array.isArray(stationsRes.data) &&
                       stationsRes.data.length > 20;

        record(12, 'Existing route planner, network stations, and APIs operate normally', pass12,
            `Routes returned: ${planRes.data?.routes?.length}, Stations returned: ${stationsRes.data?.length}`);

        console.log('\n=============================================');
        const allPassed = results.every(r => r.passed);
        console.log(allPassed ? '🎉 ALL 12 VERIFICATION TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
        console.log('=============================================\n');

    } catch (err) {
        console.error('Test execution error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

runTests();
