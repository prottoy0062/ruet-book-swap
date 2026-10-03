// models/BuyRequest.js
const mongoose = require('mongoose');


const buyRequestSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookListing', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
   sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
   respondedAt: { type: Date },
  }, { timestamps: true });

buyRequestSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('BuyRequest', buyRequestSchema);
