# 🚀 Supabase Database Setup for Project Lens

## Step 1: Copy the SQL Schema

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Navigate to your project: https://shffdhiyivwxzrarkquf.supabase.co

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Schema**
   - Copy the ENTIRE content from `supabase-database-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

## Step 2: Verify Setup

After running the SQL, you should see:

```sql
-- Run this to verify tables were created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_subscriptions', 'usage_logs', 'payments', 'project_analyses');
```

Expected output:
- users
- user_subscriptions  
- usage_logs
- payments
- project_analyses

## Step 3: Test the System

1. **Sign up for a new account** in your app
2. **Check if user was created automatically:**

```sql
-- Check users table
SELECT id, email, full_name, created_at FROM users;

-- Check subscriptions table  
SELECT user_id, plan_type, usage_count, usage_limit, status FROM user_subscriptions;
```

## Step 4: Test Usage Tracking

```sql
-- Test the usage function
SELECT increment_usage_count(
  'your-user-id-here'::uuid, 
  'analysis', 
  'Test Project', 
  10
);

-- Check usage was recorded
SELECT * FROM usage_logs WHERE user_id = 'your-user-id-here';
```

## Step 5: Test Upgrade Function

```sql
-- Test upgrade to pro
SELECT upgrade_user_to_pro('your-user-id-here'::uuid);

-- Verify upgrade
SELECT plan_type, usage_limit FROM user_subscriptions 
WHERE user_id = 'your-user-id-here';
```

## Database Schema Overview

### 📊 Tables Created:

1. **`users`** - Extended user profiles
   - Links to Supabase auth.users
   - Stores full_name, avatar_url, etc.

2. **`user_subscriptions`** - Subscription management
   - Tracks plan type (free/pro)
   - Usage counting (current/limit)
   - Stripe integration fields

3. **`usage_logs`** - Detailed usage tracking
   - Every analysis, export, chat logged
   - Includes project metadata

4. **`payments`** - Payment records
   - Stripe payment intent tracking
   - Amount, status, metadata

5. **`project_analyses`** - Optional storage
   - Save analysis results
   - Documentation content

### 🔒 Security Features:

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ Users can only access their own data
- ✅ Service role can manage all data (for webhooks)
- ✅ Automatic user profile creation on signup

### ⚡ Functions Created:

- `increment_usage_count()` - Safely increment usage
- `can_use_feature()` - Check if user has remaining usage
- `upgrade_user_to_pro()` - Upgrade user subscription
- `handle_new_user()` - Auto-create profiles on signup

### 🔄 Triggers Created:

- Auto-create user profile and free subscription on signup
- Auto-update `updated_at` timestamps

## Troubleshooting

### Issue: Tables not created
**Solution:** Make sure you copied the ENTIRE SQL file content

### Issue: RLS blocking queries  
**Solution:** Check if you're authenticated in your app

### Issue: Trigger not working
**Solution:** Verify the trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Issue: Functions not working
**Solution:** Check function exists:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'increment_usage_count';
```

## Next Steps

1. ✅ Database schema created
2. 🔄 Test user registration
3. 🔄 Set up Stripe integration  
4. 🔄 Configure environment variables
5. 🔄 Test payment flow

Your Project Lens database is now ready! 🎉

## Support

If you encounter any issues:
1. Check the Supabase logs in your dashboard
2. Verify all environment variables are set
3. Test with a fresh user account
4. Check browser console for errors

---

**Database setup complete! Your subscription system is ready to use.**