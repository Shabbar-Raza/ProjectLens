import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Sparkles, 
  FileText, 
  Settings, 
  Code, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Clock,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Project Lens</h1>
                <p className="text-sm text-slate-600">AI Documentation Generator</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=signup"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Documentation</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Transform Your Code into
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}Perfect Documentation
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Upload your project files and get comprehensive, AI-optimized documentation 
                ready for coding assistants like Cursor, GitHub Copilot, and ChatGPT.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
            >
              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="text-sm text-slate-500">
                <span className="font-medium">5 free analyses</span> • No credit card required
              </div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex items-center justify-center space-x-8 text-slate-400"
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Instant Results</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">Developer Friendly</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need for Perfect Documentation
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed specifically for developers and AI-assisted coding workflows.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Settings,
                title: "Smart Code Analysis",
                description: "Deep parsing of functions, classes, and relationships across React, Vue, Node.js, and more frameworks.",
                color: "blue"
              },
              {
                icon: Sparkles,
                title: "AI-Optimized Output",
                description: "Documentation formatted specifically for AI coding assistants with perfect context windows.",
                color: "indigo"
              },
              {
                icon: Code,
                title: "Intelligent Chatbot",
                description: "Ask questions about your codebase and get instant, accurate answers with code examples.",
                color: "emerald"
              },
              {
                icon: FileText,
                title: "Multiple Export Formats",
                description: "Export to Markdown, HTML, PDF, or copy directly to your AI assistant.",
                color: "amber"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Process entire codebases in seconds with our optimized analysis engine.",
                color: "purple"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your code never leaves your browser. All processing happens locally and securely.",
                color: "red"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Start free, upgrade when you need more. No hidden fees.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-slate-900 mb-2">$0</div>
                <p className="text-slate-600">Perfect for trying out Project Lens</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "5 project analyses",
                  "Basic documentation export",
                  "Standard support",
                  "All core features"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth?mode=signup"
                className="w-full block text-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition-colors"
              >
                Start Free Trial
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-2xl shadow-lg text-white relative"
            >
              <div className="absolute top-4 right-4">
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold mb-2">$3</div>
                <p className="text-blue-100">One-time payment for 15 more analyses</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "20 total project analyses (5 free + 15 pro)",
                  "Advanced AI documentation",
                  "Priority support",
                  "Export to multiple formats",
                  "Codebase chatbot",
                  "All future features"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-white" />
                    <span className="text-blue-100">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth?mode=signup"
                className="w-full block text-center px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Get Pro Access
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Documentation?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join developers who are already using Project Lens to create perfect documentation for their AI-assisted workflows.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/auth?mode=signup"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="text-blue-100 text-sm">
                No credit card required • 5 free analyses
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Project Lens</span>
            </div>
            <p className="text-slate-400 mb-6">
              AI-powered documentation generator for modern developers
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
              <span>© 2024 Project Lens. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;