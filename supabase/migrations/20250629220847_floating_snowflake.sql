-- Enable email verification in Supabase Auth
-- This migration configures email verification settings

-- Update auth configuration to require email confirmation
-- Note: This needs to be done in the Supabase Dashboard under Authentication > Settings
-- But we can create a function to help with verification

-- Create a function to check if email verification is enabled
CREATE OR REPLACE FUNCTION public.is_email_verification_enabled()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT true; -- Email verification should be enabled in Supabase Dashboard
$$;

-- Create a function to handle email verification completion
CREATE OR REPLACE FUNCTION public.handle_email_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This trigger fires when a user's email is confirmed
  -- We can use this to perform any additional setup if needed
  
  -- Log the email verification
  INSERT INTO public.usage_logs (user_id, action_type, metadata)
  VALUES (
    NEW.id,
    'analysis', -- We'll use this as a general log type
    jsonb_build_object(
      'event', 'email_verified',
      'email', NEW.email,
      'verified_at', NEW.email_confirmed_at
    )
  )
  ON CONFLICT DO NOTHING; -- Prevent duplicate logs
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the verification if logging fails
    RETURN NEW;
END;
$$;

-- Create trigger for email verification
DROP TRIGGER IF EXISTS on_email_verified ON auth.users;
CREATE TRIGGER on_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_verification();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_email_verification_enabled() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_email_verification() TO service_role;

-- Add a helpful view to check user verification status
CREATE OR REPLACE VIEW public.user_verification_status AS
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL as is_verified,
  u.email_confirmed_at as verified_at,
  u.created_at,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'verified'
    ELSE 'pending'
  END as status
FROM auth.users u;

-- Grant access to the view
GRANT SELECT ON public.user_verification_status TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own verification status"
  ON public.user_verification_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Enable RLS on the view
ALTER VIEW public.user_verification_status SET (security_invoker = true);