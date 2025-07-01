# Project Lens - Setup Instructions

## 🚀 Quick Setup Guide

### 1. Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Open Supabase SQL Editor
   - Copy and paste the entire content from `supabase-schema.sql`
   - Execute the SQL commands
   - This will create all necessary tables, policies, and functions

3. **Verify Tables Created**
   ```sql
   -- Check if tables were created successfully
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### 2. Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://shffdhiyivwxzrarkquf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZmZkaGl5aXZ3eHpyYXJrcXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDkxOTEsImV4cCI6MjA2Njc4NTE5MX0.1u7jAxiotsoC-WIuq_OgkE9xH9BR9QPgRXjdt5zzRFM
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Stripe Setup

1. **Create Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Get your publishable key from API keys section

2. **Create Product and Price**
   ```bash
   # Using Stripe CLI
   stripe products create --name="Project Lens Pro" --description="15 additional project analyses"
   stripe prices create --product=prod_xxx --unit-amount=300 --currency=usd
   ```

3. **Set up Webhooks** (for production)
   - Endpoint: `https://your-domain.com/api/stripe-webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 4. Payment Integration

For a complete payment system, you'll need to implement server-side endpoints:

#### Example API Routes (Next.js/Express)

```typescript
// /api/create-payment-intent
export default async function handler(req, res) {
  const { amount, currency, user_id } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: { user_id }
  });
  
  res.json({ client_secret: paymentIntent.client_secret });
}

// /api/stripe-webhook
export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  
  if (event.type === 'payment_intent.succeeded') {
    // Update user subscription in Supabase
    const { user_id } = event.data.object.metadata;
    await supabase
      .from('user_subscriptions')
      .update({ plan_type: 'pro', usage_limit: 20 })
      .eq('user_id', user_id);
  }
  
  res.json({ received: true });
}
```

### 5. Testing the System

1. **Create Test User**
   ```sql
   -- The trigger will automatically create subscription
   -- Just sign up through the UI
   ```

2. **Test Usage Tracking**
   ```sql
   -- Check user's current usage
   SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
   
   -- Check usage logs
   SELECT * FROM usage_logs WHERE user_id = 'your-user-id';
   ```

3. **Test Upgrade Flow**
   - Use Stripe test cards: `4242424242424242`
   - Test the upgrade modal functionality

### 6. Production Deployment

1. **Environment Variables**
   - Set production Supabase URL and keys
   - Set production Stripe keys
   - Set Gemini API key

2. **Security**
   - Enable RLS policies (already done in schema)
   - Set up proper CORS policies
   - Use HTTPS for all endpoints

3. **Monitoring**
   - Set up Stripe webhook monitoring
   - Monitor Supabase usage
   - Set up error tracking (Sentry, etc.)

## 📊 Database Schema Overview

### Tables Created:
- `users` - User profiles
- `user_subscriptions` - Subscription plans and usage
- `usage_logs` - Individual usage tracking
- `payments` - Payment records
- `project_analyses` - Stored analysis results (optional)

### Key Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic user profile creation
- ✅ Usage tracking and limits
- ✅ Payment processing integration
- ✅ Audit trails for all actions

## 🔧 Customization

### Changing Plans:
```sql
-- Update free plan limit
UPDATE user_subscriptions SET usage_limit = 10 WHERE plan_type = 'free';

-- Add new plan type
ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_plan_type_check;
ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_plan_type_check 
CHECK (plan_type IN ('free', 'pro', 'enterprise'));
```

### Adding Features:
- Extend `usage_logs` with more metadata
- Add team/organization support
- Implement usage analytics dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **RLS Policies Not Working**
   ```sql
   -- Check if RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Trigger Not Creating Subscriptions**
   ```sql
   -- Check if trigger exists
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. **Payment Integration Issues**
   - Verify Stripe webhook signatures
   - Check Supabase service role permissions
   - Ensure proper error handling

## 📞 Support

For issues with this setup:
1. Check Supabase logs
2. Verify environment variables
3. Test with Stripe test mode
4. Review browser console for errors

---

**Your Project Lens subscription system is now ready! 🎉**