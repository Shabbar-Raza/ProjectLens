-- =============================================
-- PROJECT LENS - COMPLETE NEW DATABASE SCHEMA
-- =============================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- This creates a clean, simple database structure

-- =============================================
-- 1. USERS TABLE (Simple user profiles)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. SUBSCRIPTIONS TABLE (User plans and usage)
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  usage_count INTEGER DEFAULT 0 NOT NULL,
  usage_limit INTEGER DEFAULT 5 NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- 3. USAGE_LOGS TABLE (Track all usage)
-- =============================================

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('analysis', 'export', 'chat')),
  project_name TEXT,
  file_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PAYMENTS TABLE (Payment records)
-- =============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  plan_type TEXT NOT NULL DEFAULT 'pro' CHECK (plan_type IN ('pro')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. PROJECT_ANALYSES TABLE (Optional storage)
-- =============================================

CREATE TABLE IF NOT EXISTS project_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  analysis_data JSONB,
  documentation_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_analyses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. CREATE RLS POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  TO service_role
  USING (true);

-- Subscriptions policies
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true);

-- Usage logs policies
CREATE POLICY "Users can read own usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role can manage usage logs"
  ON usage_logs FOR ALL
  TO service_role
  USING (true);

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  TO service_role
  USING (true);

-- Project analyses policies
CREATE POLICY "Users can manage own analyses"
  ON project_analyses FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service role can manage analyses"
  ON project_analyses FOR ALL
  TO service_role
  USING (true);

-- =============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_project_analyses_user_id ON project_analyses(user_id);

-- =============================================
-- 9. CREATE UTILITY FUNCTIONS
-- =============================================

-- Function to get user by auth ID
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  SELECT id INTO user_uuid FROM users WHERE auth_user_id = auth_id;
  RETURN user_uuid;
END;
$$;

-- Function to check if user can use feature
CREATE OR REPLACE FUNCTION can_use_feature(auth_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Get user ID
  SELECT get_user_by_auth_id(auth_id) INTO user_uuid;
  
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get usage info
  SELECT usage_count, subscriptions.usage_limit
  INTO current_usage, usage_limit
  FROM subscriptions
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_usage < usage_limit;
END;
$$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  auth_id UUID,
  action_type_param TEXT,
  project_name_param TEXT DEFAULT NULL,
  file_count_param INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Get user ID
  SELECT get_user_by_auth_id(auth_id) INTO user_uuid;
  
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current usage and limit
  SELECT usage_count, subscriptions.usage_limit
  INTO current_usage, usage_limit
  FROM subscriptions
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has reached limit
  IF current_usage >= usage_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment usage count
  UPDATE subscriptions
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE user_id = user_uuid;
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, action_type, project_name, file_count)
  VALUES (user_uuid, action_type_param, project_name_param, file_count_param);
  
  RETURN TRUE;
END;
$$;

-- Function to upgrade user to pro
CREATE OR REPLACE FUNCTION upgrade_user_to_pro(
  auth_id UUID,
  stripe_customer_id_param TEXT DEFAULT NULL,
  stripe_subscription_id_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID
  SELECT get_user_by_auth_id(auth_id) INTO user_uuid;
  
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE subscriptions
  SET 
    plan_type = 'pro',
    usage_limit = 20, -- 5 free + 15 pro
    stripe_customer_id = stripe_customer_id_param,
    stripe_subscription_id = stripe_subscription_id_param,
    status = 'active',
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- 10. CREATE TRIGGER FUNCTION FOR NEW USERS
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO users (auth_user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  RETURNING id INTO new_user_id;
  
  -- Create free subscription
  INSERT INTO subscriptions (user_id, plan_type, usage_count, usage_limit, status)
  VALUES (new_user_id, 'free', 0, 5, 'active');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth operation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =============================================
-- 11. CREATE TRIGGER FOR NEW USER CREATION
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 12. CREATE UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT ON usage_logs TO authenticated;
GRANT SELECT ON payments TO authenticated;
GRANT ALL ON project_analyses TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =============================================
-- 14. VERIFICATION QUERIES
-- =============================================

-- Run these to verify everything was created:

-- Check tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'subscriptions', 'usage_logs', 'payments', 'project_analyses')
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'subscriptions', 'usage_logs', 'payments', 'project_analyses')
ORDER BY tablename;

-- Check functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('can_use_feature', 'increment_usage_count', 'upgrade_user_to_pro', 'handle_new_user')
ORDER BY routine_name;

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';

-- =============================================
-- SETUP COMPLETE! 🎉
-- =============================================

-- Your new Project Lens database is ready!
-- 
-- Key improvements in this design:
-- ✅ Simpler table structure
-- ✅ Better separation of auth.users and app users
-- ✅ More reliable trigger function
-- ✅ Cleaner RLS policies
-- ✅ Better error handling
-- ✅ Optimized for the current app structure
-- 
-- Next steps:
-- 1. Update your .env file with new Supabase credentials
-- 2. Test user registration
-- 3. Verify usage tracking works
-- 4. Set up Stripe integration if needed