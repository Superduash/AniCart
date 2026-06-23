const express = require('express');
const timeout = require('express-timeout-handler');
const { protect, adminOrCreator } = require('../middleware/authMiddleware');
const checkUploadLimit = require('../middleware/checkUploadLimit');
const multerUpload = require('../middleware/multerUpload');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

const uploadTimeout = timeout.handler({
  timeout: 30000,
  onTimeout: (req, res) => {
    res.status(408).json({
      success: false,
      message: 'Upload timeout. File too large or connection too slow.',
    });
  },
});

router.post(
  '/wallpaper',
  protect,
  adminOrCreator,
  checkUploadLimit,
  uploadTimeout,
  multerUpload,
  uploadController.uploadWallpaper
);

router.get(
  '/status/:productId',
  protect,
  uploadController.getUploadStatus
);

module.exports = router;