-- =============================================
-- PROJECT LENS - COMPLETE DATABASE SCHEMA
-- =============================================
-- Copy and paste this entire file into your Supabase SQL Editor
-- This will create all tables, policies, triggers, and functions

-- =============================================
-- 1. USERS TABLE (Extended user profiles)
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
  usage_count INTEGER DEFAULT 0 NOT NULL,
  usage_limit INTEGER NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can read own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- =============================================
-- 3. USAGE LOGS TABLE
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

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can read own usage logs"
  ON usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all usage logs
CREATE POLICY "Service role can manage usage logs"
  ON usage_logs
  FOR ALL
  TO service_role
  USING (true);

-- =============================================
-- 4. PAYMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pro')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all payments (for webhooks)
CREATE POLICY "Service role can manage payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true);

-- =============================================
-- 5. PROJECT ANALYSES TABLE (Optional - for storing results)
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

-- Enable RLS
ALTER TABLE project_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_analyses
CREATE POLICY "Users can manage own project analyses"
  ON project_analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

-- User subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Project analyses indexes
CREATE INDEX IF NOT EXISTS idx_project_analyses_user_id ON project_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_project_analyses_created_at ON project_analyses(created_at);

-- =============================================
-- 7. FUNCTIONS
-- =============================================

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_user_id UUID,
  p_action_type TEXT,
  p_project_name TEXT DEFAULT NULL,
  p_file_count INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT usage_count, usage_limit 
  INTO current_usage, usage_limit
  FROM user_subscriptions 
  WHERE user_id = p_user_id;
  
  -- Check if user exists and has remaining usage
  IF current_usage IS NULL THEN
    RAISE EXCEPTION 'User subscription not found';
  END IF;
  
  IF current_usage >= usage_limit THEN
    RETURN FALSE; -- Usage limit exceeded
  END IF;
  
  -- Increment usage count
  UPDATE user_subscriptions 
  SET 
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, action_type, project_name, file_count)
  VALUES (p_user_id, p_action_type, p_project_name, p_file_count);
  
  RETURN TRUE;
END;
$$;

-- Function to check if user can use feature
CREATE OR REPLACE FUNCTION can_use_feature(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  SELECT usage_count, usage_limit 
  INTO current_usage, usage_limit
  FROM user_subscriptions 
  WHERE user_id = p_user_id;
  
  IF current_usage IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_usage < usage_limit;
END;
$$;

-- Function to upgrade user to pro
CREATE OR REPLACE FUNCTION upgrade_user_to_pro(
  p_user_id UUID,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_subscriptions 
  SET 
    plan_type = 'pro',
    usage_limit = 20, -- 5 free + 15 pro
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    status = 'active',
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- =============================================
-- 8. TRIGGERS
-- =============================================

-- Trigger to create user profile and subscription when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create free subscription
  INSERT INTO user_subscriptions (user_id, plan_type, usage_count, usage_limit, status)
  VALUES (NEW.id, 'free', 0, 5, 'active');
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at timestamp
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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. SAMPLE DATA (Optional - for testing)
-- =============================================

-- You can uncomment these lines to create test data
-- Note: Replace 'your-test-user-id' with an actual UUID from auth.users

/*
-- Insert test user (only if you want to test manually)
INSERT INTO users (id, email, full_name) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Insert test subscription
INSERT INTO user_subscriptions (user_id, plan_type, usage_count, usage_limit, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'free', 2, 5, 'active')
ON CONFLICT (user_id) DO NOTHING;

-- Insert test usage logs
INSERT INTO usage_logs (user_id, action_type, project_name, file_count)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'analysis', 'Test Project 1', 15),
  ('00000000-0000-0000-0000-000000000000', 'export', 'Test Project 1', NULL)
ON CONFLICT DO NOTHING;
*/

-- =============================================
-- 10. VERIFICATION QUERIES
-- =============================================

-- Run these queries to verify everything was created successfully:

-- Check tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_subscriptions', 'usage_logs', 'payments', 'project_analyses')
ORDER BY table_name;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_subscriptions', 'usage_logs', 'payments', 'project_analyses')
ORDER BY tablename;

-- Check functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_usage_count', 'can_use_feature', 'upgrade_user_to_pro', 'handle_new_user')
ORDER BY routine_name;

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- =============================================
-- SETUP COMPLETE! 🎉
-- =============================================

-- Your Project Lens database is now ready!
-- 
-- What was created:
-- ✅ 5 tables with proper relationships
-- ✅ Row Level Security (RLS) policies
-- ✅ Automatic user profile creation
-- ✅ Usage tracking and limits
-- ✅ Payment processing support
-- ✅ Helpful utility functions
-- ✅ Performance indexes
-- 
-- Next steps:
-- 1. Test user registration through your app
-- 2. Verify usage tracking works
-- 3. Set up Stripe integration
-- 4. Configure environment variables
-- 
-- Need help? Check the README-SETUP.md file!