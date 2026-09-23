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
app.use('/api/auth', authRoutes); // e.g. POST http://localhost:5000/api/auth/register

const listingRoutes = require('./routes/listingRoutes');
app.use('/api/listings', listingRoutes); // e.g. GET http://localhost:5000/api/listings

// Serve uploaded photos as static files, e.g. http://localhost:5000/uploads/xyz.jpg
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Serve the frontend (HTML/CSS/JS) so the whole site runs from this one server
app.use(express.static(require('path').join(__dirname, '..', 'frontend')));

// Express root URL-e (/) hit korle automatic frontend/index.html render/redirect korbe
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});

// ---- Connect to MongoDB ----
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });
