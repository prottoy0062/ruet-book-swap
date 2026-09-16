// models/User.js
// This defines what fields a "user" document looks like in MongoDB.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // no two users can have the same email
  },
  department: {
    type: String,
  },
  year: {
    type: String,
  },
  phone: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  // --- OTP related fields ---
  otp: {
    type: String, // the 6-digit code we email to the user
  },
  otpExpiresAt: {
    type: Date, // OTP is only valid for a few minutes
  },
  isVerified: {
    type: Boolean,
    default: false, // becomes true once they verify their OTP
  },
}, { timestamps: true }); // timestamps automatically adds createdAt/updatedAt

module.exports = mongoose.model('User', userSchema);
