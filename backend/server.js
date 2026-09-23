// server.js
// This is the entry point of our backend.
// It starts an Express server and connects to MongoDB.

require('dotenv').config(); // loads variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ---- Middleware ----
app.use(cors());           // allows frontend (different origin) to call this backend
app.use(express.json());   // allows server to read JSON sent in requests

// ---- Routes ----
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const listingRoutes = require('./routes/listingRoutes');
app.use('/api/listings', listingRoutes);

// Serve uploaded photos as static files
// Example:
// https://ruet-book-swap.onrender.com/uploads/xyz.jpg
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ---- Connect to MongoDB ----
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });
