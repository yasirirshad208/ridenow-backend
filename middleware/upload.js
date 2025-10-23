const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with .webp extension since all images will be converted
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp');
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware function to process the uploaded image: convert to lossless WebP (preserves quality, reduces file size without changing width/height)
const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const inputPath = req.file.path;
  const outputPath = inputPath; // Overwrite the original file

  try {
    // Use Sharp to convert to lossless WebP
    // This reduces file size through compression while preserving original quality, width, and height
    await sharp(inputPath)
      .webp({ lossless: true })
      .toFile(outputPath);

    // No need to delete anything since we're overwriting
    next();
  } catch (error) {
    // Handle errors (e.g., invalid image)
    next(error);
  }
};

// Export both upload and processImage
module.exports = { upload, processImage };
