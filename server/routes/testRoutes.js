const express = require('express');
const router = express.Router();

router.get('/sentry-test', (req, res) => {
  throw new Error('Sentry test crash');
});

module.exports = router;
