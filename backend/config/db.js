const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    // Read connection URI from environment variables (MongoDB Atlas)
    const uri = process.env.MONGO_DB_ATLAS_CONNECTION_STRING || process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
        const errorMsg = 'FATAL: MongoDB connection URI is missing. Define MONGO_DB_ATLAS_CONNECTION_STRING or MONGODB_URI in backend/.env';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Set target database name (default: kmrl_metro)
    const dbName = process.env.DB_NAME || process.env.MONGODB_DB_NAME || 'kmrl_metro';

    try {
        const conn = await mongoose.connect(uri, {
            dbName: dbName,
            serverSelectionTimeoutMS: 15000,
        });

        const isAtlas = conn.connection.host && conn.connection.host.includes('mongodb.net');
        console.log(`MongoDB Connected Successfully: database="${conn.connection.name}" on ${isAtlas ? 'MongoDB Atlas' : 'Host: ' + conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('MongoDB Atlas Connection Error:', error.message || error);
        // Do not silently fall back to local MongoDB, in-memory storage, or mock data
        throw error;
    }
};

module.exports = connectDB;