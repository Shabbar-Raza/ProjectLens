import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, resendVerification } = useAuth();
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendLoading(true);
    const { error } = await resendVerification(user.email);
    
    if (!error) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    }
    
    setResendLoading(false);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-slate-600">Loading your account...</span>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Email Verification Required
            </h2>
            <p className="text-slate-600">
              Please verify your email address to access Project Lens
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                We sent a verification link to <strong>{user.email}</strong>. 
                Please check your email and click the link to verify your account.
              </p>
            </div>

            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2"
              >
                <span>Verification email sent successfully!</span>
              </motion.div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.location.href = '/auth'}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;