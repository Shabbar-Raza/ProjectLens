import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripe = loadStripe(stripePublishableKey);

export const PLANS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    usage_limit: 5,
    features: [
      '5 project analyses',
      'Basic documentation export',
      'Standard support'
    ]
  },
  PRO: {
    name: 'Pro Plan',
    price: 3,
    usage_limit: 20, // 15 + 5 free
    features: [
      '20 project analyses',
      'Advanced AI documentation',
      'Priority support',
      'Export to multiple formats',
      'Codebase chatbot'
    ]
  }
} as const;