const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const BASE_URL = 'http://localhost:5000';

async function runAuthTests() {
    console.log('--- Starting Production Auth & Signup Flow Verification ---');

    await mongoose.connect(process.env.MONGO_DB_ATLAS_CONNECTION_STRING);
    console.log('Connected directly to MongoDB Atlas for persistence verification');

    const timestamp = Date.now();
    const testUsername = `user_${timestamp}`;
    const testEmail = `commuter_${timestamp}@kmrl.gov.in`;
    const testPassword = 'Password@123';
    const testFullName = 'Kerala Commuter';

    const results = [];
    const record = (num, title, passed, details) => {
        results.push({ num, title, passed, details });
        console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [Test ${num}] ${title}`);
        if (!passed || details) console.log(`   -> Details: ${details}`);
    };

    try {
        // -------------------------------------------------------------
        // Test 1: Health endpoint reports database is connected
        // -------------------------------------------------------------
        const healthRes = await fetch(`${BASE_URL}/api/health`);
        const healthData = await healthRes.json();
        const pass1 = healthRes.ok && healthData.status === 'healthy' && healthData.database.connected === true;
        record(1, 'Health check endpoint reports active MongoDB Atlas connection', pass1,
            `Status: ${healthData.status}, Connected: ${healthData.database?.connected}, Host: ${healthData.database?.host}`);

        // -------------------------------------------------------------
        // Test 2: Valid new user registration succeeds with 201 and JWT token
        // -------------------------------------------------------------
        const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: testFullName,
                email: testEmail,
                username: testUsername,
                password: testPassword,
                confirmPassword: testPassword,
                userType: 'customer'
            })
        });

        const signupData = await signupRes.json();
        const pass2 = signupRes.status === 201 &&
                      signupData.token &&
                      signupData.user &&
                      signupData.user.email === testEmail.toLowerCase();

        record(2, 'Valid user registration succeeds with 201 and JWT token', pass2,
            `Status: ${signupRes.status}, User ID: ${signupData.user?.id}, Token length: ${signupData.token?.length}`);

        // -------------------------------------------------------------
        // Test 3: Newly registered user is actually persisted in MongoDB Atlas
        // -------------------------------------------------------------
        const atlasUser = await User.findOne({ email: testEmail.toLowerCase() });
        const pass3 = atlasUser !== null && atlasUser.username === testUsername;
        record(3, 'Newly registered user is persisted in MongoDB Atlas cluster', pass3,
            `Found in Atlas: ${atlasUser?.email}, FullName: ${atlasUser?.fullName}, AccountStatus: ${atlasUser?.accountStatus}`);

        // -------------------------------------------------------------
        // Test 4: Duplicate email registration returns clean 400 error, not 500
        // -------------------------------------------------------------
        const dupEmailRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Another Person',
                email: testEmail, // same email
                username: `unique_${timestamp}_2`,
                password: testPassword,
                confirmPassword: testPassword,
                userType: 'customer'
            })
        });

        const dupEmailData = await dupEmailRes.json();
        const pass4 = dupEmailRes.status === 400 && dupEmailData.message === 'Email already registered';
        record(4, 'Duplicate email registration returns 400 with specific message', pass4,
            `Status: ${dupEmailRes.status}, Message: "${dupEmailData.message}"`);

        // -------------------------------------------------------------
        // Test 5: Duplicate username registration returns clean 400 error, not 500
        // -------------------------------------------------------------
        const dupUserRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Another Person',
                email: `unique_${timestamp}_2@example.com`,
                username: testUsername, // same username
                password: testPassword,
                confirmPassword: testPassword,
                userType: 'customer'
            })
        });

        const dupUserData = await dupUserRes.json();
        const pass5 = dupUserRes.status === 400 && dupUserData.message === 'Username already taken';
        record(5, 'Duplicate username registration returns 400 with specific message', pass5,
            `Status: ${dupUserRes.status}, Message: "${dupUserData.message}"`);

        // -------------------------------------------------------------
        // Test 6: Registration with modern domain (.info, .online) succeeds without schema error
        // -------------------------------------------------------------
        const modernEmail = `modern_${timestamp}@commuter.info`;
        const modernSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Modern Domain User',
                email: modernEmail,
                username: `modern_${timestamp}`,
                password: testPassword,
                confirmPassword: testPassword,
                userType: 'customer'
            })
        });

        const modernData = await modernSignupRes.json();
        const pass6 = modernSignupRes.status === 201 && modernData.user?.email === modernEmail;
        record(6, 'Modern email domain (.info) registers cleanly without Mongoose schema rejection', pass6,
            `Status: ${modernSignupRes.status}, Email registered: ${modernData.user?.email}`);

        // -------------------------------------------------------------
        // Test 7: Untrimmed input (whitespace around email/name) succeeds without 500
        // -------------------------------------------------------------
        const whitespaceEmail = `  spaced_${timestamp}@example.com  `;
        const whitespaceSignupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: '  Padded Name  ',
                email: whitespaceEmail,
                username: `  padded_${timestamp}  `,
                password: testPassword,
                confirmPassword: testPassword,
                userType: 'customer'
            })
        });

        const whitespaceData = await whitespaceSignupRes.json();
        const pass7 = whitespaceSignupRes.status === 201 &&
                      whitespaceData.user?.email === `spaced_${timestamp}@example.com` &&
                      whitespaceData.user?.fullName === 'Padded Name';
        record(7, 'Untrimmed input is sanitized and registers cleanly without 500 error', pass7,
            `Status: ${whitespaceSignupRes.status}, Cleaned Email: "${whitespaceData.user?.email}", Cleaned Name: "${whitespaceData.user?.fullName}"`);

        // -------------------------------------------------------------
        // Test 8: Invalid password returns 400 validation error, not 500
        // -------------------------------------------------------------
        const invalidRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Valid Name',
                email: `invalid_${timestamp}@example.com`,
                username: `invalid_${timestamp}`,
                password: 'short', // invalid: too short, missing requirements
                confirmPassword: 'short',
                userType: 'customer'
            })
        });

        const invalidData = await invalidRes.json();
        const pass8 = invalidRes.status === 400 && invalidData.message !== 'Server error';
        record(8, 'Invalid input returns 400 validation failure, never 500 Server error', pass8,
            `Status: ${invalidRes.status}, Validation message: "${invalidData.message}"`);

        // -------------------------------------------------------------
        // Test 9: Newly registered user can log in via existing login flow
        // -------------------------------------------------------------
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailOrUsername: testEmail,
                password: testPassword,
                captcha: 'KMRL123'
            })
        });

        const loginData = await loginRes.json();
        const pass9 = loginRes.status === 200 &&
                      loginData.token &&
                      loginData.user?.email === testEmail.toLowerCase();
        record(9, 'Newly registered user can log in successfully with credentials and CAPTCHA', pass9,
            `Status: ${loginRes.status}, User ID: ${loginData.user?.id}, Message: "${loginData.message}"`);

        // -------------------------------------------------------------
        // Test 10: Existing user can still log in successfully
        // -------------------------------------------------------------
        const existingLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailOrUsername: 'test@example.com',
                password: 'Test@1234',
                captcha: 'TEST12'
            })
        });

        const existingLoginData = await existingLoginRes.json();
        const pass10 = existingLoginRes.status === 200 && existingLoginData.token;
        record(10, 'Existing users can log in without any regression', pass10,
            `Status: ${existingLoginRes.status}, Logged in: ${existingLoginData.user?.email}`);

        console.log('\n=============================================');
        const allPassed = results.every(r => r.passed);
        console.log(allPassed ? '🎉 ALL 10 AUTH VERIFICATION TESTS PASSED!' : '⚠️ SOME TESTS FAILED');
        console.log('=============================================\n');

    } catch (err) {
        console.error('Test execution exception:', err);
    } finally {
        // Clean up test users created during test run
        try {
            await User.deleteMany({
                username: { $in: [testUsername, `modern_${timestamp}`, `padded_${timestamp}`] }
            });
            console.log('Cleaned up test accounts from MongoDB Atlas');
        } catch (cleanupErr) {
            console.warn('Test cleanup warning:', cleanupErr.message);
        }
        await mongoose.disconnect();
        process.exit(0);
    }
}

runAuthTests();
