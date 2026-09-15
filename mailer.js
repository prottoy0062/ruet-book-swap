// utils/mailer.js
// This file handles sending emails (specifically, OTP codes) using Gmail + Nodemailer.

const nodemailer = require('nodemailer');

// This "transporter" is the object that actually connects to Gmail and sends mail.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // the 16-digit App Password (NOT your normal Gmail password)
  },
});

// Generates a random 6-digit OTP as a string, e.g. "482913"
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sends the OTP to the given email address.
async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: `"RUET BookSwap" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your RUET BookSwap Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>RUET BookSwap</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateOTP, sendOTPEmail };
