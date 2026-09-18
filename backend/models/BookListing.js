// models/BookListing.js
const mongoose = require('mongoose');

const bookListingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  edition: { type: String },
  courseCode: { type: String, required: true }, // e.g. "CSE 2101"
  department: { type: String, required: true },
  semester: { type: String },
  condition: { type: String, enum: ['New', 'Good', 'Worn'], default: 'Good' },
  photos: [{ type: String }], // array of image filenames/URLs
  type: { type: String, enum: ['sale', 'exchange', 'donation'], required: true },
  price: { type: Number, default: 0 }, // only relevant if type is 'sale'
  status: { type: String, enum: ['available', 'closed'], default: 'available' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerPhone: { type: String }, // stored directly for quick display, avoids extra lookups
}, { timestamps: true });

module.exports = mongoose.model('BookListing', bookListingSchema);
