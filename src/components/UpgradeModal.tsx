import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, CreditCard, Loader2, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createCheckoutSession } from '../lib/stripe-client';
import { STRIPE_CONFIG } from '../stripe-config';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const product = STRIPE_CONFIG.products[0]; // Get the project lens product

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('Starting upgrade process for user:', user.id);
      
      await createCheckoutSession({
        priceId: product.priceId,
        mode: product.mode,
        successUrl: `${window.location.origin}/app?upgrade=success`,
        cancelUrl: `${window.location.origin}/app?upgrade=canceled`
      });
      
    } catch (err) {
      console.error('Upgrade error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Upgrade to Pro</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Current Usage */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Usage Limit Reached</span>
                </div>
                <p className="text-amber-800 text-sm">
                  You've used {subscription.usage_count} of {subscription.usage_limit} analyses. 
                  Upgrade to get {product.features[0]}.
                </p>
              </div>

              {/* Product Benefits */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">${product.price}</div>
                  <p className="text-slate-600 text-sm">One-time payment</p>
                </div>

                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <motion.li 
                      key={index} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
                >
                  {error}
                </motion.div>
              )}

              {/* Upgrade Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Redirecting to checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Upgrade Now - ${product.price}</span>
                  </>
                )}
              </motion.button>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500 text-center">
                  Secure payment powered by Stripe. Your card information is never stored.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;