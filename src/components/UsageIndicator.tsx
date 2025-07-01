import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Crown, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UsageIndicatorProps {
  onUpgrade: () => void;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({ onUpgrade }) => {
  const { subscription } = useAuth();

  if (!subscription) return null;

  const usagePercentage = (subscription.usage_count / subscription.usage_limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = subscription.usage_count >= subscription.usage_limit;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-lg p-4 shadow-sm ${
        isAtLimit ? 'border-red-200 bg-red-50' : 
        isNearLimit ? 'border-amber-200 bg-amber-50' : 
        'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {subscription.plan_type === 'pro' ? (
            <Crown className="w-5 h-5 text-blue-600" />
          ) : (
            <Zap className="w-5 h-5 text-slate-600" />
          )}
          <span className="font-medium text-slate-900">
            {subscription.plan_type === 'pro' ? 'Pro Plan' : 'Free Trial'}
          </span>
        </div>
        
        {isAtLimit && (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-slate-600">Usage</span>
          <span className={`font-medium ${
            isAtLimit ? 'text-red-600' : 
            isNearLimit ? 'text-amber-600' : 
            'text-slate-900'
          }`}>
            {subscription.usage_count} / {subscription.usage_limit}
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              isAtLimit ? 'bg-red-500' : 
              isNearLimit ? 'bg-amber-500' : 
              'bg-blue-500'
            }`}
          />
        </div>
      </div>

      {isAtLimit ? (
        <div className="space-y-2">
          <p className="text-sm text-red-700">
            You've reached your usage limit. Upgrade to continue analyzing projects.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Upgrade for $3
          </motion.button>
        </div>
      ) : isNearLimit ? (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            You're running low on analyses. Consider upgrading soon.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            Upgrade Now
          </motion.button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          {subscription.usage_limit - subscription.usage_count} analyses remaining
        </p>
      )}
    </motion.div>
  );
};

export default UsageIndicator;