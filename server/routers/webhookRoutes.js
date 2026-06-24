const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// Route handles Stripe webhooks
router.post('/stripe', handleStripeWebhook);

module.exports = router;
