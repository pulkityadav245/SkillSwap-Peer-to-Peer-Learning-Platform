const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    bio: {
        type: String,
        default: "",
        trim: true
    },

    location: {
        type: String,
        default: "",
        trim: true
    },

    // Geo coordinates (set via geocoding when user updates location)
    coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },

    // Trust Score System
    trustScore: {
        type: Number,
        default: 50,   // Everyone starts at 50/100
        min: 0,
        max: 100
    },

    totalRatings: {
        type: Number,
        default: 0
    },

    averageRating: {
        type: Number,
        default: 0
    },

    // Fraud Detection flags
    isFlagged: {
        type: Boolean,
        default: false
    },

    flagReason: {
        type: String,
        default: ""
    },

    // Activity tracking for fraud detection
    loginCount: {
        type: Number,
        default: 0
    },

    lastLogin: {
        type: Date,
        default: null
    },

    reportCount: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);