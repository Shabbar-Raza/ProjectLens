/*
  # Complete Project Lens Database Schema

  This migration creates the complete database schema for Project Lens including:

  1. New Tables
    - `users` - Extended user profiles linked to auth.users
    - `user_subscriptions` - Subscription management with usage tracking
    - `usage_logs` - Detailed usage tracking for all actions
    - `payments` - Payment records with Stripe integration
    - `project_analyses` - Optional storage for analysis results

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Service role can manage all data (for webhooks)

  3. Functions
    - `increment_usage_count()` - Safely increment usage with limits
    - `can_use_feature()` - Check if user has remaining usage
    - `upgrade_user_to_pro()` - Upgrade user subscription
    - `handle_new_user()` - Auto-create profiles on signup

  4. Triggers
    - Auto-create user profile and free subscription on signup
    - Auto-update timestamps
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extended profile)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plan_type text CHECK (plan_type IN ('free', 'pro')) DEFAULT 'free',
  usage_count integer DEFAULT 0,
  usage_limit integer DEFAULT 5,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action_type text CHECK (action_type IN ('analysis', 'export', 'chat')) NOT NULL,
  project_name text,
  file_count integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'usd',
  status text CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')) DEFAULT 'pending',
  plan_type text CHECK (plan_type IN ('pro')) DEFAULT 'pro',
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_analyses table (optional storage)
CREATE TABLE IF NOT EXISTS project_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_name text NOT NULL,
  file_count integer NOT NULL,
  analysis_data jsonb,
  documentation_content text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
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

CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true);

-- User subscriptions policies
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

CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Usage logs policies
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

CREATE POLICY "Service role can manage usage logs"
  ON usage_logs
  FOR ALL
  TO service_role
  USING (true);

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true);

-- Project analyses policies
CREATE POLICY "Users can manage own analyses"
  ON project_analyses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage analyses"
  ON project_analyses
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_project_analyses_user_id ON project_analyses(user_id);

-- Create functions

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage integer;
  usage_limit integer;
BEGIN
  SELECT usage_count, user_subscriptions.usage_limit
  INTO current_usage, usage_limit
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN current_usage < usage_limit;
END;
$$;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(
  p_user_id uuid,
  p_action_type text,
  p_project_name text DEFAULT NULL,
  p_file_count integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage integer;
  usage_limit integer;
BEGIN
  -- Get current usage and limit
  SELECT usage_count, user_subscriptions.usage_limit
  INTO current_usage, usage_limit
  FROM user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user has reached limit
  IF current_usage >= usage_limit THEN
    RETURN false;
  END IF;
  
  -- Increment usage count
  UPDATE user_subscriptions
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log the usage
  INSERT INTO usage_logs (user_id, action_type, project_name, file_count)
  VALUES (p_user_id, p_action_type, p_project_name, p_file_count);
  
  RETURN true;
END;
$$;

-- Function to upgrade user to pro
CREATE OR REPLACE FUNCTION upgrade_user_to_pro(
  p_user_id uuid,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_subscriptions
  SET 
    plan_type = 'pro',
    usage_limit = 100,
    stripe_customer_id = p_stripe_customer_id,
    stripe_subscription_id = p_stripe_subscription_id,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;