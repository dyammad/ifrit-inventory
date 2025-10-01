import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook do Stripe para gerenciar assinaturas
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': subscription.customer },
          {
            'subscription.status': subscription.status,
            'subscription.stripeSubscriptionId': subscription.id,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000)
          }
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': deletedSub.customer },
          {
            'subscription.status': 'cancelled',
            'subscription.plan': 'free'
          }
        );
        break;

      case 'invoice.payment_succeeded':
        // Resetar contadores mensais
        const invoice = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeCustomerId': invoice.customer },
          {
            'usage.aiRequestsThisMonth': 0
          }
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
