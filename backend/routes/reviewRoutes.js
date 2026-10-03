// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const requireAuth = require('../middleware/authMiddleware');

// A buyer can review a seller only after an accepted purchase exists.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { transactionId, rating, comment } = req.body;
    const numericRating = Number(rating);
    if (!transactionId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Transaction and a rating from 1 to 5 are required' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Purchase record not found' });
    if (transaction.buyerId.toString() !== req.user.userId) return res.status(403).json({ message: 'Only the buyer can review this seller' });

    const existing = await Review.findOne({ transactionId });
    if (existing) return res.status(400).json({ message: 'You already reviewed this purchase' });

    const review = await Review.create({
      transactionId,
      sellerId: transaction.sellerId,
      buyerId: transaction.buyerId,
      rating: numericRating,
      comment: (comment || '').trim(),
    });

    const stats = await Review.aggregate([
      { $match: { sellerId: transaction.sellerId } },
      { $group: { _id: '$sellerId', average: { $avg: '$rating' } } },
    ]);
    await User.findByIdAndUpdate(transaction.sellerId, { rating: stats[0] ? Number(stats[0].average.toFixed(2)) : 0 });

    res.status(201).json({ message: 'Review submitted', review });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ message: 'Could not submit review', error: err.message });
  }
});

router.get('/seller/:sellerId', async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId })
      .populate('buyerId', 'name roll')
      .sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ message: 'Could not load reviews', error: err.message });
  }
});

module.exports = router;
