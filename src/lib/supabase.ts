import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (matching new schema)
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: 'free' | 'pro';
  usage_count: number;
  usage_limit: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action_type: 'analysis' | 'export' | 'chat';
  project_name?: string;
  file_count?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  plan_type: 'pro';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectAnalysis {
  id: string;
  user_id: string;
  project_name: string;
  file_count: number;
  analysis_data?: Record<string, any>;
  documentation_content?: string;
  created_at: string;
}

// Helper functions for database operations
export const dbHelpers = {
  // Get user's subscription
  async getUserSubscription(authUserId: string): Promise<UserSubscription | null> {
    try {
      console.log('📊 Fetching subscription for auth user:', authUserId);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching subscription:', error);
        return null;
      }
      
      console.log('✅ Subscription data:', data);
      return data;
    } catch (error) {
      console.error('❌ Exception in getUserSubscription:', error);
      return null;
    }
  },

  // Check if user can use a feature
  async canUseFeature(authUserId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(authUserId);
      
      if (!subscription) {
        console.error('❌ No subscription found for user');
        return false;
      }
      
      const canUse = subscription.usage_count < subscription.usage_limit;
      console.log(`✅ Can use feature: ${canUse} (${subscription.usage_count}/${subscription.usage_limit})`);
      return canUse;
    } catch (error) {
      console.error('❌ Exception in canUseFeature:', error);
      return false;
    }
  },

  // Increment usage count
  async incrementUsage(
    authUserId: string, 
    actionType: 'analysis' | 'export' | 'chat',
    projectName?: string,
    fileCount?: number
  ): Promise<boolean> {
    try {
      // First check if user can use the feature
      const subscription = await this.getUserSubscription(authUserId);
      
      if (!subscription) {
        console.error('❌ No subscription found for user');
        return false;
      }
      
      if (subscription.usage_count >= subscription.usage_limit) {
        console.error('❌ Usage limit reached');
        return false;
      }
      
      // Update usage count
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          usage_count: subscription.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUserId);
      
      if (updateError) {
        console.error('❌ Error updating usage count:', updateError);
        return false;
      }
      
      // Log the usage
      const { error: logError } = await supabase
        .from('usage_logs')
        .insert({
          user_id: authUserId,
          action_type: actionType,
          project_name: projectName,
          file_count: fileCount
        });
      
      if (logError) {
        console.error('❌ Error logging usage:', logError);
        // Don't return false here as the main operation succeeded
      }
      
      console.log('✅ Usage incremented successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in incrementUsage:', error);
      return false;
    }
  },

  // Upgrade user to pro
  async upgradeUserToPro(
    authUserId: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: 'pro',
          usage_limit: 1000, // Pro users get higher limit
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authUserId);
      
      if (error) {
        console.error('❌ Error upgrading user:', error);
        return false;
      }
      
      console.log('✅ User upgraded to pro successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in upgradeUserToPro:', error);
      return false;
    }
  },

  // Get user's usage logs
  async getUserUsageLogs(authUserId: string, limit = 50): Promise<UsageLog[]> {
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', authUserId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Error fetching usage logs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getUserUsageLogs:', error);
      return [];
    }
  },

  // Get user profile
  async getUserProfile(authUserId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Exception in getUserProfile:', error);
      return null;
    }
  },

  // Record payment
  async recordPayment(
    authUserId: string,
    stripePaymentIntentId: string,
    amount: number,
    currency: string = 'usd',
    status: 'pending' | 'succeeded' | 'failed' | 'canceled' = 'pending'
  ): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: authUserId,
          stripe_payment_intent_id: stripePaymentIntentId,
          amount,
          currency,
          status,
          plan_type: 'pro'
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error recording payment:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Exception in recordPayment:', error);
      return null;
    }
  },

  // Update payment status
  async updatePaymentStatus(
    stripePaymentIntentId: string,
    status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', stripePaymentIntentId);
      
      if (error) {
        console.error('❌ Error updating payment status:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Exception in updatePaymentStatus:', error);
      return false;
    }
  },

  // Save project analysis (optional)
  async saveProjectAnalysis(
    authUserId: string,
    projectName: string,
    fileCount: number,
    analysisData?: Record<string, any>,
    documentationContent?: string
  ): Promise<ProjectAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('project_analyses')
        .insert({
          user_id: authUserId,
          project_name: projectName,
          file_count: fileCount,
          analysis_data: analysisData,
          documentation_content: documentationContent
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error saving project analysis:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Exception in saveProjectAnalysis:', error);
      return null;
    }
  }
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to user's subscription changes
  subscribeToUserSubscription(authUserId: string, callback: (subscription: UserSubscription) => void) {
    return supabase
      .channel('user_subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${authUserId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UserSubscription);
          }
        }
      )
      .subscribe();
  },

  // Subscribe to user's usage logs
  subscribeToUsageLogs(authUserId: string, callback: (log: UsageLog) => void) {
    return supabase
      .channel('usage_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_logs',
          filter: `user_id=eq.${authUserId}`
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as UsageLog);
          }
        }
      )
      .subscribe();
  }
};

// Export configured client as default
export default supabase;