// utils/upload.js

// Multer keeps uploaded images in memory temporarily.
// The actual image will be uploaded to Cloudinary
// from listingRoutes.js.

const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per photo
  },

  fileFilter: function (req, file, cb) {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
    }
  },
});

module.exports = upload;