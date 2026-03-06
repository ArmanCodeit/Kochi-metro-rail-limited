const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        match: [/^[A-Za-z\s]+$/, 'Name should contain only letters and spaces']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        minlength: [3, 'Username must be at least 3 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    userType: {
        type: String,
        enum: ['customer', 'station_master', 'officer'],
        default: 'customer',
        required: true
    },
    accountStatus: {
        type: String,
        enum: ['active', 'pending'],
        default: 'active'
    },
    designation: {
        type: String,
        default: null
    },
    stationAssigned: {
        type: String,
        default: null
    },
    // Additional Profile Details
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    fathersName: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pinCode: { type: String, default: '' },
    bookings: {
        type: [
            {
                bookingId: { type: String },
                fromStation: { type: String },
                toStation: { type: String },
                type: { type: String },
                status: { type: String, default: 'Success' },
                method: { type: String, default: 'Card/UPI' },
                fare: { type: Number },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);