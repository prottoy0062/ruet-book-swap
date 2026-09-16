// routes/authRoutes.js
// Handles: registering a new user + sending OTP, and verifying that OTP.

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, sendOTPEmail } = require('../utils/mailer');

// Helper: creates a login token for a user.
// The frontend will store this and send it back on future requests
// to prove "this is a logged-in user".
function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // stays logged in for 30 days
  );
}

// ---------------------------------------------
// POST /api/auth/register
// Body: { name, email, department, year, phone }
// Creates a user (unverified) and emails them an OTP.
// ---------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, department, year, phone } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // (Optional but recommended) enforce RUET email domain
    if (!email.endsWith('@student.ruet.ac.bd')) {
      return res.status(400).json({ message: 'Please use your RUET student email' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // If user already exists, update their info + new OTP.
    // Otherwise, create a new user document.
    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.department = department;
      user.year = year;
      user.phone = phone;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      user.isVerified = false;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        department,
        year,
        phone,
        otp,
        otpExpiresAt,
        isVerified: false,
      });
    }

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// ---------------------------------------------
// POST /api/auth/login
// Body: { email }
// For EXISTING, already-verified users. Sends a fresh OTP to log in with.
// (No password needed — OTP-based login, same pattern as register.)
// ---------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Account not verified yet. Please complete registration first.' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email for login' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// ---------------------------------------------
// POST /api/auth/verify-otp
// Body: { email, otp }
// Checks the OTP and marks the user as verified.
// ---------------------------------------------
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired, please request a new one' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Issue a login token now that the user is verified.
    const token = generateToken(user);

    res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = router;
