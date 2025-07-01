import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, user, loading: authLoading, emailVerificationSent, resendVerification } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Check if user just verified their email
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setIsVerified(true);
      // Clear the URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('verified');
      navigate(`/auth?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Only redirect if we have a user and auth is not loading
    if (user && !authLoading) {
      console.log('✅ User authenticated, redirecting to app');
      navigate('/app');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      console.log('⚠️ Form already submitting, ignoring');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        console.log('📝 Attempting signup for:', formData.email);
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        
        if (error) {
          console.error('❌ Signup error:', error);
          setError(error.message);
          setLoading(false);
        } else {
          console.log('✅ Signup successful, waiting for redirect...');
          // Don't set loading to false, let the auth context handle the redirect
        }
      } else {
        console.log('🔑 Attempting signin for:', formData.email);
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          console.error('❌ Signin error:', error);
          setError(error.message);
          setLoading(false);
        } else {
          console.log('✅ Signin successful, waiting for redirect...');
          // Don't set loading to false, let the auth context handle the redirect
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setError('');

    const { error } = await resendVerification(formData.email);
    
    if (error) {
      setError(error.message);
    } else {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    }
    
    setResendLoading(false);
  };

  // Show loading spinner while auth is being processed
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-slate-600">
            {mode === 'signup' ? 'Creating your account...' : 'Signing you in...'}
          </span>
          <p className="text-sm text-slate-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Show email verification message
  if (emailVerificationSent && mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Project Lens</h1>
                  <p className="text-sm text-slate-600">AI Documentation Generator</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-slate-600">
                  We've sent a verification link to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>Return here to sign in to your account</li>
                  </ol>
                </div>

                {resendSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Verification email sent successfully!</span>
                  </motion.div>
                )}

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
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
                    onClick={() => {
                      setMode('signin');
                      setError('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Project Lens</h1>
                <p className="text-sm text-slate-600">AI Documentation Generator</p>
              </div>
            </Link>
            
            <Link
              to="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Email Verification Success Message */}
            {isVerified && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Email verified successfully! You can now sign in.</span>
              </motion.div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-600 mt-2">
                {mode === 'signin' 
                  ? 'Sign in to continue to Project Lens' 
                  : 'Start your free trial with 5 project analyses'
                }
              </p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-600">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                {' '}
                <button
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={loading}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {mode === 'signup' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What you get with your free trial:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 5 project analyses</li>
                  <li>• Full documentation export</li>
                  <li>• AI-optimized formatting</li>
                  <li>• Email verification required</li>
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;