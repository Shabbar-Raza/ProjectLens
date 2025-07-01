export const STRIPE_CONFIG = {
  products: [
    {
      id: 'prod_SaYZOvE2BoSG5K',
      name: 'project lens',
      description: 'Upgrade to Pro for 15 additional project analyses',
      priceId: 'price_1RfNRsHKucUAhi1f4gKPYoIi',
      price: 3.00,
      mode: 'subscription' as const,
      features: [
        '15 additional project analyses',
        'Advanced AI documentation',
        'Priority support',
        'Export to multiple formats',
        'Codebase chatbot'
      ]
    }
  ]
} as const;

export type StripeProduct = typeof STRIPE_CONFIG.products[0];