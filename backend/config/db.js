const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const connectDB = async () => {
    // Read connection URI exclusively from MongoDB Atlas configuration
    const uri = process.env.MONGO_DB_ATLAS_CONNECTION_STRING || process.env.MONGODB_URI;

    if (!uri) {
        const errorMsg = 'FATAL: MongoDB Atlas connection URI is missing. Define MONGO_DB_ATLAS_CONNECTION_STRING in backend/.env';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Target database name (default: kmrl_metro)
    const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'kmrl_metro';

    const poolOptions = {
        dbName: dbName,
        maxPoolSize: 20,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000
    };

    try {
        console.log('Connecting to MongoDB Atlas cloud database...');
        const conn = await mongoose.connect(uri, poolOptions);
        const host = conn.connection.host || '';
        const isAtlas = host.includes('mongodb.net');
        console.log(`[MongoDB Atlas] Connected Successfully: database="${conn.connection.name}" on ${isAtlas ? 'MongoDB Atlas (' + host.split('.')[0] + '...)' : 'Host: ' + host}`);
        return conn;
    } catch (error) {
        console.error('[MongoDB Atlas] Connection Error:', error.message || error);
        // Do NOT silently fall back to local MongoDB, localhost, or mock data
        throw error;
    }
};

module.exports = connectDB;