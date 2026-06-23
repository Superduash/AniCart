const multer = require('multer');
const ApiError = require('../utils/apiError');

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
});

const _singleWallpaper = upload.single('wallpaper');

const singleWallpaper = (req, res, next) => {
  _singleWallpaper(req, res, (err) => {
    if (err && err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest('File too large. Max size is 25MB'));
    }

    if (err) {
      return next(err);
    }

    return next();
  });
};

module.exports = singleWallpaper;
