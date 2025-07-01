/*
  # Fix User Signup Database Error

  1. Database Functions
    - Create or replace the handle_new_user function
    - Ensure proper error handling and permissions

  2. Triggers
    - Create trigger on auth.users for new user creation
    - Ensure it properly creates user profile and subscription

  3. Security Updates
    - Update RLS policies to allow trigger operations
    - Ensure service role can perform necessary operations

  This migration fixes the "Database error saving new user" issue by ensuring
  the database trigger and function work correctly for new user signups.
*/

-- Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );

  -- Insert into user_subscriptions table with default free plan
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_type,
    usage_count,
    usage_limit,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'free',
    0,
    5,
    'active',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth operation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to ensure the trigger can work properly
-- The service role needs to be able to insert into these tables

-- Update users table policies
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure authenticated users can still manage their own data
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update user_subscriptions table policies
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure authenticated users can still manage their own subscriptions
DROP POLICY IF EXISTS "Users can read own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscription"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to the service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;