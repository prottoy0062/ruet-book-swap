// routes/listingRoutes.js
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const BookListing = require('../models/BookListing');
const User = require('../models/User');
const BuyRequest = require('../models/BuyRequest');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

// Create a listing.
router.post('/', requireAuth, upload.array('photos', 4), async (req, res) => {
  try {
    const { title, author, edition, courseCode, department, semester, condition, type, price } = req.body;
    if (!title || !courseCode || !department || !type) {
      return res.status(400).json({ message: 'Title, course code, department, and type are required' });
    }

    const seller = await User.findById(req.user.userId);
    if (!seller) return res.status(404).json({ message: 'Seller account not found' });

    const photoUrls = [];
    for (const file of req.files || []) {
      // Use Cloudinary when it is configured; otherwise save locally so the
      // project works immediately in local development without Cloudinary keys.
      const hasCloudinary = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (hasCloudinary) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: 'ruet-book-swap' }, (error, result) => {
            if (error) reject(error); else resolve(result);
          });
          stream.end(file.buffer);
        });
        photoUrls.push(result.secure_url);
      } else {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadsDir, safeName), file.buffer);
        photoUrls.push(`/uploads/${safeName}`);
      }
    }

    const listing = await BookListing.create({
      title, author, edition, courseCode, department, semester, condition, type,
      price: type === 'sale' ? Number(price || 0) : 0,
      photos: photoUrls,
      sellerId: seller._id,
      sellerPhone: seller.phone,
    });

    res.status(201).json({ message: 'Listing created', listing });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});


// Get public listings. Sold listings can be requested explicitly with status=sold.
router.get('/', async (req, res) => {
  try {
    const { courseCode, department, type, status } = req.query;
    const filter = {};
    if (courseCode) filter.courseCode = { $regex: courseCode, $options: 'i' };
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (type) filter.type = type;
    filter.status = status || 'available';

    const listings = await BookListing.find(filter)
      .populate('sellerId', 'name roll department year rating')
      .sort({ createdAt: -1 });
    res.json({ count: listings.length, listings });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// Everything belonging to the logged-in user: listings + sale/buy history + reviews.
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [listings, sold, bought, reviewsGiven, reviewsReceived] = await Promise.all([
      BookListing.find({ sellerId: req.user.userId }).populate('sellerId', 'name roll department year rating').sort({ createdAt: -1 }),
      Transaction.find({ sellerId: req.user.userId }).populate('buyerId', 'name roll department year').sort({ purchasedAt: -1 }),
      Transaction.find({ buyerId: req.user.userId }).populate('sellerId', 'name roll department year').sort({ purchasedAt: -1 }),
      Review.find({ buyerId: req.user.userId }).populate('sellerId', 'name roll').sort({ createdAt: -1 }),
      Review.find({ sellerId: req.user.userId }).populate('buyerId', 'name roll').sort({ createdAt: -1 }),
    ]);
    res.json({ listings, sold, bought, reviewsGiven, reviewsReceived });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ message: 'Could not load your dashboard', error: err.message });
  }
});

// Seller's pending buy requests.
router.get('/requests/incoming', requireAuth, async (req, res) => {
  try {
    const requests = await BuyRequest.find({ sellerId: req.user.userId, status: 'pending' })
      .populate('listingId', 'title price photos status')
      .populate('buyerId', 'name roll department year')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Could not load buy requests', error: err.message });
  }
});

// Buyer requests to buy an available sale listing.
router.post('/:id/buy-request', requireAuth, async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'available') return res.status(400).json({ message: 'This book is no longer available' });
    if (listing.type !== 'sale') return res.status(400).json({ message: 'Only sale listings can receive buy requests' });
    if (listing.sellerId.toString() === req.user.userId) return res.status(400).json({ message: 'You cannot request your own book' });

    const existing = await BuyRequest.findOne({ listingId: listing._id, buyerId: req.user.userId });
    if (existing) return res.status(400).json({ message: `You already have a ${existing.status} request for this book` });

    const request = await BuyRequest.create({ listingId: listing._id, buyerId: req.user.userId, sellerId: listing.sellerId });
    res.status(201).json({ message: 'Buy request sent to the seller', request });
  } catch (err) {
    console.error('Buy request error:', err);
    res.status(500).json({ message: 'Could not send buy request', error: err.message });
  }
});

// Seller accepts/rejects a request. Accepting creates the permanent purchase record.
router.patch('/requests/:id', requireAuth, async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Action must be accept or reject' });

    const request = await BuyRequest.findOne({ _id: req.params.id, sellerId: req.user.userId }).populate('listingId');
    if (!request) return res.status(404).json({ message: 'Buy request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'This request has already been handled' });

    if (action === 'reject') {
      request.status = 'rejected';
      request.respondedAt = new Date();
      await request.save();
      return res.json({ message: 'Buy request rejected', request });
    }

    const listing = await BookListing.findOneAndUpdate(
      { _id: request.listingId._id, sellerId: req.user.userId, status: 'available' },
      { $set: { status: 'sold', soldAt: new Date() } },
      { new: true }
    );
    if (!listing) return res.status(409).json({ message: 'This book has already been sold or is no longer available' });

    const transaction = await Transaction.create({
      listingId: listing._id,
      bookTitle: listing.title,
      sellerId: listing.sellerId,
      buyerId: request.buyerId,
      price: listing.price,
      purchasedAt: new Date(),
    });

    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: 'Request accepted and purchase recorded', request, transaction, listing });
  } catch (err) {
    console.error('Handle buy request error:', err);
    res.status(500).json({ message: 'Could not handle buy request', error: err.message });
  }
});

// Seller can manually mark their listing sold/available.
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'sold'].includes(status)) return res.status(400).json({ message: 'Status must be available or sold' });

    const listing = await BookListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.sellerId.toString() !== req.user.userId) return res.status(403).json({ message: 'You can only update your own listings' });

    if (status === 'available' && await Transaction.exists({ listingId: listing._id })) {
      return res.status(400).json({ message: 'A completed sale cannot be marked available again' });
    }

    listing.status = status;
    listing.soldAt = status === 'sold' ? (listing.soldAt || new Date()) : undefined;
    await listing.save();

    if (status === 'sold') {
      await BuyRequest.updateMany(
        { listingId: listing._id, status: 'pending' },
        { $set: { status: 'rejected', respondedAt: new Date() } }
      );
    }

    res.json({ message: 'Listing status updated', listing });
  } catch (err) {
    console.error('Update listing status error:', err);
    res.status(500).json({ message: 'Could not update listing', error: err.message });
  }
});

// Owner can delete their own listing. A sold listing that has a transaction is kept for history.
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.sellerId.toString() !== req.user.userId) return res.status(403).json({ message: 'You can only delete your own listings' });

    const transaction = await Transaction.findOne({ listingId: listing._id });
    if (transaction) return res.status(400).json({ message: 'Sold books with a purchase record cannot be deleted from history' });

    await BuyRequest.deleteMany({ listingId: listing._id });
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ message: 'Could not delete listing', error: err.message });
  }
});

// Public detail, including seller name/roll and rating.
router.get('/:id', async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id)
      .populate('sellerId', 'name roll email department year phone rating');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const reviewCount = await require('../models/Review').countDocuments({ sellerId: listing.sellerId._id });
    res.json({ listing, sellerReviewCount: reviewCount });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = router;


