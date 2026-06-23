const express = require('express');
const router = express.Router();

router.get('/crash', (req, res) => {
  throw new Error('Sentry manual crash test');
});

router.get('/async-crash', async (req, res) => {
  await Promise.reject(new Error('Sentry async crash test'));
});

module.exports = router;
