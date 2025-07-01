import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Sparkles, 
  Settings, 
  MessageCircle, 
  LogOut,
  User,
  Crown,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import FileUploader from './FileUploader';
import FileTree from './FileTree';
import ProcessingIndicator from './ProcessingIndicator';
import DocumentViewer from './DocumentViewer';
import FilterControls from './FilterControls';
import CodebaseChatbot from './CodebaseChatbot';
import UsageIndicator from './UsageIndicator';
import UpgradeModal from './UpgradeModal';
import { FileProcessor } from '../utils/fileProcessor';
import { FileFilter } from '../utils/fileFilter';
import { CodeParser } from '../utils/codeParser';
import { DocumentGenerator } from '../utils/documentGenerator';
import { DependencyAnalyzer } from '../utils/dependencyAnalyzer';
import { ProjectFile, ProjectAnalysis, GeneratedDoc, FilterOptions } from '../types';
import { sampleProject } from '../data/sampleData';

type AppState = 'idle' | 'processing' | 'complete';

const AppPage: React.FC = () => {
  const { user, subscription, signOut, canUseFeature, incrementUsage, refreshSubscription } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [state, setState] = useState<AppState>('idle');
  const [projectStructure, setProjectStructure] = useState<ProjectFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(FileFilter.getDefaultOptions());
  const [showFilters, setShowFilters] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle URL parameters for payment success/cancel
  useEffect(() => {
    const upgrade = searchParams.get('upgrade');
    const success = searchParams.get('success');
    
    if (upgrade === 'success' || success === 'true') {
      setShowSuccessMessage(true);
      // Refresh subscription data after successful payment
      refreshSubscription();
      // Clean up URL parameters
      setSearchParams({});
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } else if (upgrade === 'canceled') {
      // Clean up URL parameters
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleFilesSelected = async (files: FileList) => {
    console.log('handleFilesSelected called with', files.length, 'files');
    
    // Check usage limit
    if (!canUseFeature()) {
      console.log('Usage limit reached, showing upgrade modal');
      setShowUpgradeModal(true);
      return;
    }

    console.log('Starting file processing...');
    setState('processing');
    setProgress(0);
    setProcessingMessage('Processing uploaded files...');

    try {
      // Increment usage count
      const usageIncremented = await incrementUsage('analysis', 'Uploaded Project', files.length);
      if (!usageIncremented) {
        console.log('Failed to increment usage, showing upgrade modal');
        setShowUpgradeModal(true);
        setState('idle');
        return;
      }

      console.log('Usage incremented successfully');

      // Step 1: Process and filter files
      setProgress(15);
      console.log('Processing files with filter options:', filterOptions);
      const structure = await FileProcessor.processFiles(files, filterOptions);
      console.log('File structure created:', structure);
      setProjectStructure(structure);

      // Step 2: Analyze code
      setProgress(35);
      setProcessingMessage('Analyzing code structure and dependencies...');
      
      console.log('Starting project analysis...');
      const analysis = await analyzeProject(structure);
      console.log('Project analysis complete:', analysis);
      setProjectAnalysis(analysis);
      
      // Step 3: Generate documentation
      setProgress(75);
      setProcessingMessage('Generating AI-optimized documentation...');
      
      console.log('Generating documentation...');
      const doc = DocumentGenerator.generate(analysis);
      console.log('Documentation generated:', doc);
      setGeneratedDoc(doc);
      
      setProgress(100);
      setProcessingMessage('Analysis complete!');
      
      setTimeout(() => {
        console.log('Setting state to complete');
        setState('complete');
      }, 500);
    } catch (error) {
      console.error('Error processing files:', error);
      setState('idle');
      setProcessingMessage('Error processing files. Please try again.');
    }
  };

  const analyzeProject = async (structure: ProjectFile): Promise<ProjectAnalysis> => {
    console.log('Analyzing project structure...');
    const packageInfo = FileProcessor.extractPackageJson(structure);
    const sourceFiles = FileProcessor.getSourceFiles(structure);
    
    console.log('Package info:', packageInfo);
    console.log('Source files found:', sourceFiles.length);
    
    // Detect project type and architecture
    const projectType = FileProcessor.detectProjectType(structure, packageInfo);
    const { dependencies, devDependencies } = packageInfo 
      ? DependencyAnalyzer.analyzeDependencies(packageInfo)
      : { dependencies: [], devDependencies: [] };
    
    const buildTool = packageInfo ? DependencyAnalyzer.detectBuildTool(packageInfo) : undefined;
    
    const analysis: ProjectAnalysis = {
      name: packageInfo?.name || structure.name || 'Unknown Project',
      type: projectType as any,
      structure,
      files: [],
      dependencies,
      devDependencies,
      packageInfo,
      entryPoints: [],
      architecture: {
        patterns: [],
        technologies: [],
        buildTool
      }
    };

    console.log('Base analysis created:', analysis.name, analysis.type);

    // Analyze each source file with enhanced content access
    setProgress(45);
    for (const file of sourceFiles) {
      if (!FileFilter.shouldAnalyzeFile(file)) continue;
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      let fileAnalysis;
      
      if (ext === 'ts' || ext === 'tsx') {
        fileAnalysis = CodeParser.parseTypeScriptFile(file.content, file.path);
      } else {
        fileAnalysis = CodeParser.parseJavaScriptFile(file.content, file.path);
      }
      
      // Add content to file analysis for workflow generation
      fileAnalysis.content = file.content;
      
      analysis.files.push(fileAnalysis);
      
      // Collect entry points
      if (fileAnalysis.isEntryPoint) {
        analysis.entryPoints.push(fileAnalysis.path);
      }
    }

    console.log('File analysis complete. Files analyzed:', analysis.files.length);

    // Detect architecture patterns and technologies
    setProgress(60);
    analysis.architecture.patterns = DependencyAnalyzer.detectArchitecturePatterns(
      dependencies, 
      analysis.files
    );
    
    // Extract technologies from dependencies
    analysis.architecture.technologies = [
      ...dependencies.filter(d => d.category === 'framework').map(d => d.name),
      ...dependencies.filter(d => d.category === 'ui').map(d => d.name),
      buildTool || ''
    ].filter(Boolean);

    console.log('Architecture analysis complete:', analysis.architecture);

    return analysis;
  };

  const handleUseSampleProject = async () => {
    console.log('Using sample project...');
    
    // Check usage limit
    if (!canUseFeature()) {
      setShowUpgradeModal(true);
      return;
    }

    setState('processing');
    setProgress(0);
    setProcessingMessage('Loading sample project...');

    try {
      // Increment usage count
      const usageIncremented = await incrementUsage('analysis', 'Sample Project', 10);
      if (!usageIncremented) {
        setShowUpgradeModal(true);
        setState('idle');
        return;
      }

      setProgress(25);
      
      // Apply filters to sample project
      const filteredSample = FileFilter.filterProject(sampleProject, filterOptions);
      setProjectStructure(filteredSample);

      setProgress(50);
      setProcessingMessage('Analyzing sample code...');
      
      const analysis = await analyzeProject(filteredSample);
      setProjectAnalysis(analysis);
      
      setProgress(80);
      setProcessingMessage('Generating documentation...');
      
      const doc = DocumentGenerator.generate(analysis);
      setGeneratedDoc(doc);
      
      setProgress(100);
      setState('complete');
    } catch (error) {
      console.error('Error processing sample project:', error);
      setState('idle');
    }
  };

  const handleExport = async (format: 'markdown' | 'copy' | 'ai-copy') => {
    if (!generatedDoc) return;
    
    // Increment usage for export
    await incrementUsage('export', projectAnalysis?.name);
    
    if (format === 'markdown') {
      const blob = new Blob([generatedDoc.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project-documentation.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    console.log('Resetting application state...');
    setState('idle');
    setProjectStructure(null);
    setSelectedFile(null);
    setGeneratedDoc(null);
    setProjectAnalysis(null);
    setProgress(0);
    setShowFilters(false);
    setShowChatbot(false);
  };

  const handleChatbotToggle = async () => {
    if (!showChatbot && projectAnalysis) {
      // Increment usage for chatbot
      await incrementUsage('chat', projectAnalysis.name);
    }
    setShowChatbot(!showChatbot);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Payment Successful! 🎉</h4>
                <p className="text-sm text-green-800 mt-1">
                  Welcome to Pro! You now have access to additional project analyses.
                </p>
              </div>
              <button
                onClick={() => setShowSuccessMessage(false)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-slate-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Project Lens</h1>
                <p className="text-sm text-slate-600">AI Documentation Generator</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    {subscription?.plan_type === 'pro' ? (
                      <Crown className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">{user?.email}</div>
                    <div className="text-slate-500">
                      {subscription?.plan_type === 'pro' ? 'Pro Plan' : 'Free Trial'}
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Indicator */}
        <div className="mb-6">
          <UsageIndicator onUpgrade={() => setShowUpgradeModal(true)} />
        </div>

        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-12"
            >
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8 border border-slate-200">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">
                    Generate Perfect AI Documentation
                  </h2>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                    Upload your project files and get comprehensive documentation 
                    ready for AI coding assistants with full code analysis.
                  </p>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="mb-8 flex justify-center">
                <FilterControls
                  options={filterOptions}
                  onChange={setFilterOptions}
                  isVisible={showFilters}
                  onToggle={() => setShowFilters(!showFilters)}
                />
              </div>

              <div className="mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUseSampleProject}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-white font-medium transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Try Sample Project</span>
                </motion.button>
                <p className="text-sm text-slate-500 mt-2">
                  See how it works with a demo React project
                </p>
              </div>

              <FileUploader onFilesSelected={handleFilesSelected} isProcessing={state === 'processing'} />
              
              {/* Features List */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    icon: Settings,
                    title: "Smart Filtering",
                    description: "Automatically ignores build artifacts, dependencies, and minified files."
                  },
                  {
                    icon: Eye,
                    title: "Deep Analysis",
                    description: "Extracts functions, classes, interfaces, and relationships."
                  },
                  {
                    icon: Sparkles,
                    title: "AI Optimized",
                    description: "Generates documentation in formats designed for AI assistants."
                  },
                  {
                    icon: MessageCircle,
                    title: "Smart Chatbot",
                    description: "Ask questions about your codebase and get instant answers."
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ProcessingIndicator message={processingMessage} progress={progress} />
            </motion.div>
          )}

          {state === 'complete' && projectStructure && generatedDoc && projectAnalysis && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900">Project Analysis Complete</h2>
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChatbotToggle}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask AI</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium transition-colors shadow-sm"
                  >
                    New Project
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <FileTree
                    structure={projectStructure}
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </div>

                <div className="lg:col-span-2">
                  <DocumentViewer
                    document={generatedDoc}
                    onExport={handleExport}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Chatbot */}
      {projectAnalysis && (
        <CodebaseChatbot
          analysis={projectAnalysis}
          isVisible={showChatbot}
          onToggle={handleChatbotToggle}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default AppPage;