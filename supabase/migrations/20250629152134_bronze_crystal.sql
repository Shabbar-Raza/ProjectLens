-- =============================================
-- PROJECT LENS DATABASE SCHEMA
-- =============================================
-- Run these SQL commands in your Supabase SQL Editor
-- to create all the necessary tables for the subscription system

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =============================================
-- 1. USERS TABLE
-- =============================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =============================================
-- Manages user subscription plans and usage limits
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
    usage_count INTEGER DEFAULT 0 NOT NULL,
    usage_limit INTEGER NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. USAGE LOGS TABLE
-- =============================================
-- Tracks individual usage events for analytics and debugging
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('analysis', 'export', 'chat')),
    project_name TEXT,
    file_count INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. PAYMENTS TABLE
-- =============================================
-- Records all payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd' NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('pro')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true); -- Allow service role to insert

-- =============================================
-- 5. PROJECT ANALYSES TABLE (Optional)
-- =============================================
-- Store analysis results for future reference
CREATE TABLE IF NOT EXISTS public.project_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    project_name TEXT NOT NULL,
    file_count INTEGER,
    analysis_data JSONB,
    documentation_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_analyses
CREATE POLICY "Users can view own analyses" ON public.project_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.project_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.project_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.project_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_project_analyses_user_id ON public.project_analyses(user_id);

-- =============================================
-- 7. FUNCTIONS AND TRIGGERS
-- =============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. INITIAL DATA SETUP
-- =============================================
-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    INSERT INTO public.user_subscriptions (user_id, plan_type, usage_count, usage_limit, status)
    VALUES (
        NEW.id,
        'free',
        0,
        5,
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile and subscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 9. UTILITY FUNCTIONS
-- =============================================
-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION public.can_user_perform_action(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    SELECT usage_count, usage_limit, status
    INTO subscription_record
    FROM public.user_subscriptions
    WHERE user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    RETURN subscription_record.status = 'active' 
           AND subscription_record.usage_count < subscription_record.usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_user_usage(
    user_uuid UUID,
    action_type_param TEXT,
    project_name_param TEXT DEFAULT NULL,
    file_count_param INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    -- Get current subscription
    SELECT usage_count, usage_limit, status
    INTO subscription_record
    FROM public.user_subscriptions
    WHERE user_id = user_uuid;
    
    IF NOT FOUND OR subscription_record.status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has remaining usage
    IF subscription_record.usage_count >= subscription_record.usage_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Log the usage
    INSERT INTO public.usage_logs (user_id, action_type, project_name, file_count)
    VALUES (user_uuid, action_type_param, project_name_param, file_count_param);
    
    -- Increment usage count
    UPDATE public.user_subscriptions
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =============================================
-- Uncomment the following to insert sample data for testing

/*
-- Insert a test user (you'll need to create this user through Supabase Auth first)
-- INSERT INTO public.users (id, email, full_name) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User');

-- Insert a test subscription
-- INSERT INTO public.user_subscriptions (user_id, plan_type, usage_count, usage_limit, status) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'free', 2, 5, 'active');

-- Insert some test usage logs
-- INSERT INTO public.usage_logs (user_id, action_type, project_name, file_count) VALUES 
-- ('00000000-0000-0000-0000-000000000000', 'analysis', 'Test Project 1', 15),
-- ('00000000-0000-0000-0000-000000000000', 'export', 'Test Project 1', NULL);
*/

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Your database is now ready for Project Lens!
-- 
-- Next steps:
-- 1. Set up Stripe webhook endpoints
-- 2. Configure your environment variables
-- 3. Test the authentication flow
-- 4. Implement payment processing