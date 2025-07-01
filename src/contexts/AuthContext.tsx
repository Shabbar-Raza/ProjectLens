import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserSubscription, dbHelpers } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: UserSubscription | null;
  loading: boolean;
  emailVerificationSent: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ error: any }>;
  refreshSubscription: () => Promise<void>;
  canUseFeature: () => boolean;
  incrementUsage: (actionType: 'analysis' | 'export' | 'chat', projectName?: string, fileCount?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        }
        
        if (mounted) {
          console.log('📱 Initial session:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('👤 User found, fetching subscription...');
            await fetchSubscription(session.user.id);
          }
          
          console.log('✅ Initial auth setup complete');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        if (!mounted) return;

        // Handle different auth events
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully');
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Wait a moment for the database trigger to complete
            setTimeout(async () => {
              await fetchSubscription(session.user.id);
            }, 1000);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setSession(null);
          setUser(null);
          setSubscription(null);
          setEmailVerificationSent(false);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          // For other events, just update the session
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const fetchSubscription = async (authUserId: string) => {
    try {
      console.log('📊 Fetching subscription for auth user:', authUserId);
      
      // Try multiple times with delays to account for database trigger
      let subscriptionData = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!subscriptionData && attempts < maxAttempts) {
        subscriptionData = await dbHelpers.getUserSubscription(authUserId);
        
        if (!subscriptionData) {
          attempts++;
          console.log(`⏳ Subscription not found yet, attempt ${attempts}/${maxAttempts}`);
          
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }
      
      if (subscriptionData) {
        console.log('✅ Subscription found:', subscriptionData);
        setSubscription(subscriptionData);
      } else {
        console.log('⚠️ No subscription found after all attempts, providing fallback...');
        
        // Provide a fallback subscription
        const fallbackSubscription: UserSubscription = {
          id: `fallback-${authUserId}`,
          user_id: `fallback-${authUserId}`,
          plan_type: 'free',
          usage_count: 0,
          usage_limit: 5,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setSubscription(fallbackSubscription);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchSubscription:', error);
      
      // Always provide a fallback subscription
      const fallbackSubscription: UserSubscription = {
        id: `fallback-${authUserId}`,
        user_id: `fallback-${authUserId}`,
        plan_type: 'free',
        usage_count: 0,
        usage_limit: 5,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setSubscription(fallbackSubscription);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('📝 Starting signup for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        },
      });

      if (error) {
        console.error('❌ Signup error:', error);
        return { error };
      }

      console.log('✅ Signup successful:', data.user?.email);
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email verification required');
        setEmailVerificationSent(true);
      }
      
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔑 Starting signin for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        return { error };
      }

      console.log('✅ Signin successful');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected signin error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Signing out user');
      await supabase.auth.signOut();
      setSubscription(null);
      setEmailVerificationSent(false);
    } catch (error) {
      console.error('❌ Signout error:', error);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      console.log('📧 Resending verification email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`
        }
      });

      if (error) {
        console.error('❌ Error resending verification:', error);
        return { error };
      }

      console.log('✅ Verification email resent successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error resending verification:', error);
      return { error };
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      console.log('🔄 Refreshing subscription for user:', user.id);
      await fetchSubscription(user.id);
    }
  };

  const canUseFeature = () => {
    if (!subscription) {
      console.log('⚠️ No subscription found, cannot use feature');
      return false;
    }
    
    const canUse = subscription.usage_count < subscription.usage_limit;
    console.log(`✅ Can use feature: ${canUse} (${subscription.usage_count}/${subscription.usage_limit})`);
    return canUse;
  };

  const incrementUsage = async (
    actionType: 'analysis' | 'export' | 'chat',
    projectName?: string,
    fileCount?: number
  ): Promise<boolean> => {
    if (!user || !subscription) {
      console.error('❌ No user or subscription found');
      return false;
    }

    console.log(`📈 Incrementing usage: ${actionType} for user ${user.id}`);

    try {
      // If using a fallback subscription, just update locally
      if (subscription.id.startsWith('fallback-')) {
        console.log('⚠️ Using fallback subscription, updating locally');
        
        if (subscription.usage_count >= subscription.usage_limit) {
          return false;
        }
        
        setSubscription(prev => prev ? {
          ...prev,
          usage_count: prev.usage_count + 1
        } : null);
        
        return true;
      }
      
      // Try database increment
      const success = await dbHelpers.incrementUsage(
        user.id,
        actionType,
        projectName,
        fileCount
      );

      if (success) {
        console.log('✅ Usage incremented successfully');
        await refreshSubscription();
        return true;
      } else {
        console.error('❌ Failed to increment usage - likely at limit');
        return false;
      }
    } catch (error) {
      console.error('❌ Error in incrementUsage:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    subscription,
    loading,
    emailVerificationSent,
    signUp,
    signIn,
    signOut,
    resendVerification,
    refreshSubscription,
    canUseFeature,
    incrementUsage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};