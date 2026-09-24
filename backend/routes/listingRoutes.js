// routes/listingRoutes.js
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const BookListing = require('../models/BookListing');
const User = require('../models/User');
const requireAuth = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

// ---------------------------------------------
// POST /api/listings
// Requires login. Creates a new book listing, with up to 4 photos.
// Frontend sends this as multipart/form-data (not JSON) because of the files.
// ---------------------------------------------
router.post('/', requireAuth, upload.array('photos', 4), async (req, res) => {
  try {
    const {
      title, author, edition, courseCode, department,
      semester, condition, type, price,
    } = req.body;

    if (!title || !courseCode || !department || !type) {
      return res.status(400).json({ message: 'Title, course code, department, and type are required' });
    }

    const seller = await User.findById(req.user.userId);
    if (!seller) {
      return res.status(404).json({ message: 'Seller account not found' });
    }

    const photoUrls = [];

    for (const file of req.files || []) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'ruet-book-swap',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(file.buffer);
      });

      photoUrls.push(result.secure_url);
    }

    const listing = await BookListing.create({
      title,
      author,
      edition,
      courseCode,
      department,
      semester,
      condition,
      type,
      price: type === 'sale' ? price : 0,
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

// ---------------------------------------------
// GET /api/listings
// Public. Supports search via query params:
//   /api/listings?courseCode=CSE2101
//   /api/listings?department=CSE
//   /api/listings?type=exchange
// ---------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { courseCode, department, type, status } = req.query;

    const filter = {};
    if (courseCode) filter.courseCode = { $regex: courseCode, $options: 'i' }; // case-insensitive partial match
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (type) filter.type = type;
    filter.status = status || 'available'; // default: only show available listings

    const listings = await BookListing.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ count: listings.length, listings });
  } catch (err) {
    console.error('Get listings error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// ---------------------------------------------
// GET /api/listings/:id
// Public. Get full detail of one listing (used for the detail page).
// ---------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const listing = await BookListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.status(200).json({ listing });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

// ---------------------------------------------
// PATCH /api/listings/:id/status
// Requires login. Only the seller who owns this listing can mark it sold/closed.
// Body: { status: "closed" } or { status: "available" }
// ---------------------------------------------
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const listing = await BookListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.sellerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update your own listings' });
    }

    listing.status = status;
    await listing.save();

    res.status(200).json({ message: 'Listing updated', listing });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});

module.exports = router;
