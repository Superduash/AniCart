const stripe = require('stripe')(require('../config').STRIPE_SECRET_KEY);
const { STRIPE_WEBHOOK_SECRET } = require('../config');
const orderService = require('../services/orderService');
const logger = require('../utils/logger');

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    logger.info(`PaymentIntent for ${paymentIntent.amount} was successful! ID: ${paymentIntent.id}`);
    
    try {
      await orderService.completeOrder(paymentIntent.id);
    } catch (err) {
      logger.error(`Error completing order for payment intent ${paymentIntent.id}:`, err);
    }
  }

  // H3 Fix: cancel orphaned pending orders when payment fails or is abandoned
  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    const pi = event.data.object;
    logger.info(`PaymentIntent ${pi.id} ${event.type} — cancelling pending order`);
    try {
      const Order = require('../models/Order');
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: pi.id, status: 'pending' },
        { status: 'cancelled' }
      );
    } catch (err) {
      logger.error(`Error cancelling order for payment intent ${pi.id}:`, err);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

module.exports = {
  handleStripeWebhook,
};
