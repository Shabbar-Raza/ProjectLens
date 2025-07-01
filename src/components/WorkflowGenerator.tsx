import React, { useState } from 'react';
import { 
  Workflow, 
  Users, 
  FileText, 
  Zap, 
  Download, 
  Eye, 
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  GitBranch,
  Database,
  Shield,
  Globe,
  Code,
  ArrowLeft
} from 'lucide-react';
import { ProjectAnalysis, WorkflowConfig, WorkflowGenerationResult } from '../types';
import { WorkflowAnalyzer } from '../utils/workflowAnalyzer';
import { GeminiWorkflowGenerator } from '../utils/geminiWorkflowGenerator';

interface WorkflowGeneratorProps {
  analysis: ProjectAnalysis;
  onBack: () => void;
}

const WorkflowGenerator: React.FC<WorkflowGeneratorProps> = ({ analysis, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [workflowData, setWorkflowData] = useState<WorkflowGenerationResult | null>(null);
  
  const [config, setConfig] = useState<WorkflowConfig>({
    outputFormat: 'comprehensive',
    includeBusinessValue: true,
    includeTechnicalDetails: true,
    prioritizationMethod: 'automatic',
    exportFormat: 'markdown'
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'stories' | 'capabilities'>('overview');
  const [error, setError] = useState<string | null>(null);

  const generateWorkflows = async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    const steps = [
      'Analyzing codebase structure...',
      'Extracting API endpoints and routes with full code...',
      'Mapping user interface components with implementations...',
      'Identifying data operations with complete queries...',
      'Analyzing authentication flows with code examples...',
      'Extracting business logic patterns with functions...',
      'Sending comprehensive data to Gemini AI...',
      'Generating intelligent user workflows...',
      'Creating detailed user stories with technical specs...',
      'Finalizing professional documentation...'
    ];

    try {
      // Get Gemini API key from environment
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error('Gemini API key not found. Please check your environment configuration.');
      }

      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        setProgress((i / steps.length) * 100);
        
        if (i < 6) {
          // Simulate analysis steps with actual processing
          await new Promise(resolve => setTimeout(resolve, 800));
        } else if (i === 6) {
          // Actual comprehensive analysis with full code extraction
          console.log('🔍 Starting comprehensive code analysis...');
          const analyzer = new WorkflowAnalyzer(analysis);
          const analysisData = await analyzer.analyzeProject();
          
          console.log('📊 Analysis complete, sending to Gemini AI...');
          console.log('Routes found:', analysisData.routes.length);
          console.log('User interactions:', analysisData.userInteractions.length);
          console.log('Data operations:', analysisData.dataOperations.length);
          console.log('Auth methods:', analysisData.authFlow.methods.length);
          console.log('Business logic files:', analysisData.businessLogic.length);
          
          // Generate with Gemini using comprehensive code analysis
          const geminiGenerator = new GeminiWorkflowGenerator(geminiApiKey);
          const workflows = await geminiGenerator.generateWorkflowsAndStories(analysisData, analysis);
          
          setWorkflowData(workflows);
        } else {
          // Final steps
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setProgress(100);
      setGenerationStep('AI workflow generation complete!');
      
    } catch (error) {
      console.error('Error generating workflows:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportWorkflows = (format: string) => {
    if (!workflowData) return;
    
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';
    
    switch (format) {
      case 'markdown':
        content = generateMarkdownExport(workflowData);
        filename = 'ai-workflows-and-user-stories.md';
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = JSON.stringify(workflowData, null, 2);
        filename = 'workflows-and-user-stories.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCSVExport(workflowData);
        filename = 'user-stories.csv';
        mimeType = 'text/csv';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownExport = (data: WorkflowGenerationResult): string => {
    return `# ${data.projectOverview.name} - AI-Generated Workflows & User Stories

## 📊 Project Overview

**Description:** ${data.projectOverview.description}

**Primary Users:** ${data.projectOverview.primaryUsers.join(', ')}

**Core Capabilities:** ${data.projectOverview.coreCapabilities.join(', ')}

**Application Types:** ${data.projectOverview.applicationTypes.join(', ')}

**Business Domain:** ${data.projectOverview.businessDomain}

## 🔄 User Workflows

${data.userWorkflows.map(workflow => `
### ${workflow.workflowName}

**Description:** ${workflow.description}

**User Types:** ${workflow.userTypes.join(', ')}

**Estimated Duration:** ${workflow.estimatedDuration}

**Steps:**
${workflow.steps.map(step => `${step.stepNumber}. **${step.action}**
   - **Trigger:** ${step.trigger}
   - **System Response:** ${step.systemResponse}
   - **Data Involved:** ${step.dataInvolved}
   ${step.userInterface ? `- **User Interface:** ${step.userInterface}` : ''}
   ${step.technicalEndpoint ? `- **Technical Endpoint:** \`${step.technicalEndpoint}\`` : ''}
`).join('\n')}

**Preconditions:** ${workflow.preconditions.join(', ')}

**Postconditions:** ${workflow.postconditions.join(', ')}

**Alternative Flows:** ${workflow.alternativeFlows.join(', ')}

**Error Handling:** ${workflow.errorHandling.join(', ')}
`).join('\n')}

## 📖 User Stories

${data.userStories.map(story => `
### ${story.id}: ${story.title}

**Description:** ${story.description}

**Priority:** ${story.priority} | **Effort:** ${story.estimatedEffort} | **Complexity:** ${story.complexity}

**Acceptance Criteria:**
${story.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Technical Implementation:**
- **Endpoints:** ${story.technicalImplementation.endpoints.join(', ')}
- **Components:** ${story.technicalImplementation.components.join(', ')}
- **Database:** ${story.technicalImplementation.database.join(', ')}

**Test Scenarios:**
${story.testScenarios.map(scenario => `- ${scenario}`).join('\n')}

**Related Workflow:** ${story.relatedWorkflow}
`).join('\n')}

## 🚀 Project Capabilities

${data.capabilities.map(category => `
### ${category.category}

${category.features.map(feature => `
**${feature.name}**
- **Description:** ${feature.description}
- **User Benefit:** ${feature.userBenefit}
${feature.technicalEndpoint ? `- **Technical Endpoint:** \`${feature.technicalEndpoint}\`` : ''}
`).join('\n')}
`).join('\n')}

## 💾 Data Entities

${data.dataEntities.map(entity => `
### ${entity.entityName}

**Description:** ${entity.description}

**Attributes:** ${entity.attributes.join(', ')}

**Relationships:** ${entity.relationships.join(', ')}
`).join('\n')}

---
*Generated by CodeContext Pro - AI Workflow & User Stories Generator*
*Powered by Google Gemini AI with comprehensive code analysis*
`;
  };

  const generateCSVExport = (data: WorkflowGenerationResult): string => {
    const headers = ['ID', 'Title', 'Description', 'Priority', 'Effort', 'Complexity', 'Acceptance Criteria', 'Technical Implementation', 'Test Scenarios'];
    const rows = data.userStories.map(story => [
      story.id,
      story.title,
      story.description,
      story.priority,
      story.estimatedEffort,
      story.complexity,
      story.acceptanceCriteria.join('; '),
      `Endpoints: ${story.technicalImplementation.endpoints.join(', ')}; Components: ${story.technicalImplementation.components.join(', ')}; Database: ${story.technicalImplementation.database.join(', ')}`,
      story.testScenarios.join('; ')
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            🤖 Generating AI Workflows & User Stories
          </h3>
          <p className="text-slate-600 mb-4">{generationStep}</p>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-slate-600">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Code Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4" />
              <span>Workflow Mapping</span>
            </div>
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Function Extraction</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documentation</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Generation Failed</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setError(null);
                generateWorkflows();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (workflowData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                🤖 AI Workflows & User Stories Generated
              </h2>
              <p className="text-slate-600">
                Comprehensive product management documentation for {workflowData.projectOverview.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{workflowData.userStories.length}</div>
                <div className="text-sm text-slate-600">User Stories</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{workflowData.userWorkflows.length}</div>
                <div className="text-sm text-slate-600">Workflows</div>
              </div>
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex space-x-1 p-1">
            {[
              { id: 'overview', label: 'Project Overview', icon: Target },
              { id: 'workflows', label: 'User Workflows', icon: Workflow },
              { id: 'stories', label: 'User Stories', icon: FileText },
              { id: 'capabilities', label: 'Capabilities', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          {activeTab === 'overview' && (
            <ProjectOverviewTab data={workflowData.projectOverview} />
          )}
          {activeTab === 'workflows' && (
            <UserWorkflowsTab workflows={workflowData.userWorkflows} />
          )}
          {activeTab === 'stories' && (
            <UserStoriesTab stories={workflowData.userStories} />
          )}
          {activeTab === 'capabilities' && (
            <CapabilitiesTab capabilities={workflowData.capabilities} />
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📤 Export Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => exportWorkflows('markdown')}
              className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => exportWorkflows('json')}
              className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => exportWorkflows('csv')}
              className="flex items-center space-x-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(generateMarkdownExport(workflowData))}
              className="flex items-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Workflow className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          🤖 AI Workflow & User Stories Generator
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Analyze your codebase with Google Gemini AI to automatically generate comprehensive user workflows, 
          user stories, and project capabilities documentation with full code analysis.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">AI-Powered Analysis</h3>
          <p className="text-sm text-slate-600">
            Uses Google Gemini AI with complete code analysis to understand your codebase and generate intelligent workflows
          </p>
        </div>
        
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <Code className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Full Code Context</h3>
          <p className="text-sm text-slate-600">
            Analyzes complete function implementations, API endpoints, and component code for accurate documentation
          </p>
        </div>
        
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">User-Centric Stories</h3>
          <p className="text-sm text-slate-600">
            Generates professional user stories with acceptance criteria, technical details, and test scenarios
          </p>
        </div>
        
        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Export Ready</h3>
          <p className="text-sm text-slate-600">
            Export to Jira, Linear, Notion, or standard formats for immediate use in project management
          </p>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
            <Database className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Database Analysis</h3>
          <p className="text-sm text-slate-600">
            Analyzes Prisma, Mongoose, SQL queries with complete implementation context
          </p>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Auth Flow Mapping</h3>
          <p className="text-sm text-slate-600">
            Identifies authentication patterns, JWT implementation, and security workflows
          </p>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-slate-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">⚙️ Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Output Format
            </label>
            <select
              value={config.outputFormat}
              onChange={(e) => setConfig(prev => ({ ...prev, outputFormat: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="comprehensive">📋 Comprehensive (All sections)</option>
              <option value="workflows-only">🔄 Workflows Only</option>
              <option value="user-stories-only">📖 User Stories Only</option>
              <option value="jira-format">🎯 Jira-Ready Format</option>
              <option value="notion-format">📝 Notion-Compatible</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prioritization Method
            </label>
            <select
              value={config.prioritizationMethod}
              onChange={(e) => setConfig(prev => ({ ...prev, prioritizationMethod: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="automatic">🤖 Automatic (AI-based)</option>
              <option value="complexity-based">⚙️ Complexity-based</option>
              <option value="manual">✋ Manual Review</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.includeBusinessValue}
              onChange={(e) => setConfig(prev => ({ ...prev, includeBusinessValue: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Include business value analysis</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.includeTechnicalDetails}
              onChange={(e) => setConfig(prev => ({ ...prev, includeTechnicalDetails: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Include technical implementation details with full code</span>
          </label>
        </div>
      </div>

      {/* Project Analysis Summary */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 Project Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{analysis.files.length}</div>
            <div className="text-sm text-slate-600">Source Files</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {analysis.files.filter(f => f.category === 'component').length}
            </div>
            <div className="text-sm text-slate-600">Components</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">
              {analysis.files.filter(f => f.category === 'service').length}
            </div>
            <div className="text-sm text-slate-600">Services</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{analysis.dependencies.length}</div>
            <div className="text-sm text-slate-600">Dependencies</div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <button
          onClick={generateWorkflows}
          className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate AI Workflows & User Stories</span>
        </button>
        <p className="text-sm text-slate-500 mt-3">
          This will analyze your complete codebase and generate comprehensive documentation using Google Gemini AI
        </p>
      </div>
    </div>
  );
};

// Tab Components
const ProjectOverviewTab: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{data.name}</h3>
      <p className="text-slate-700 leading-relaxed">{data.description}</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">👥 Primary Users</h4>
        <ul className="space-y-1">
          {data.primaryUsers.map((user: string, index: number) => (
            <li key={index} className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700">{user}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold text-slate-900 mb-2">⚡ Core Capabilities</h4>
        <ul className="space-y-1">
          {data.coreCapabilities.map((capability: string, index: number) => (
            <li key={index} className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700">{capability}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">🏢 Business Domain</h4>
        <p className="text-slate-700">{data.businessDomain}</p>
      </div>
      
      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">📱 Application Types</h4>
        <p className="text-slate-700">{data.applicationTypes.join(', ')}</p>
      </div>
    </div>
  </div>
);

const UserWorkflowsTab: React.FC<{ workflows: any[] }> = ({ workflows }) => (
  <div className="space-y-6">
    {workflows.map((workflow, index) => (
      <div key={index} className="border border-slate-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{workflow.workflowName}</h3>
            <p className="text-slate-600 mt-1">{workflow.description}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{workflow.estimatedDuration}</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">👥 User Types</h4>
            <div className="flex flex-wrap gap-2">
              {workflow.userTypes.map((type: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {type}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-900 mb-2">📋 Steps</h4>
            <span className="text-slate-600">{workflow.steps.length} steps</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">🔄 Workflow Steps</h4>
          {workflow.steps.slice(0, 3).map((step: any, i: number) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-slate-50 rounded">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {step.stepNumber}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{step.action}</p>
                <p className="text-sm text-slate-600 mt-1">{step.systemResponse}</p>
                {step.technicalEndpoint && (
                  <code className="text-xs bg-slate-200 px-2 py-1 rounded mt-1 inline-block">
                    {step.technicalEndpoint}
                  </code>
                )}
              </div>
            </div>
          ))}
          {workflow.steps.length > 3 && (
            <p className="text-sm text-slate-500 text-center">
              +{workflow.steps.length - 3} more steps
            </p>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-slate-900 mb-1">✅ Preconditions</h5>
            <ul className="text-slate-600 space-y-1">
              {workflow.preconditions.map((condition: string, i: number) => (
                <li key={i}>• {condition}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-slate-900 mb-1">🎯 Postconditions</h5>
            <ul className="text-slate-600 space-y-1">
              {workflow.postconditions.map((condition: string, i: number) => (
                <li key={i}>• {condition}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const UserStoriesTab: React.FC<{ stories: any[] }> = ({ stories }) => (
  <div className="space-y-4">
    {stories.map((story, index) => (
      <div key={index} className="border border-slate-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                {story.id}
              </span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                story.priority === 'High' ? 'bg-red-100 text-red-800' :
                story.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {story.priority}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {story.estimatedEffort}
              </span>
              <span className={`px-2 py-1 rounded text-sm ${
                story.complexity === 'High' ? 'bg-red-100 text-red-800' :
                story.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {story.complexity}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{story.title}</h3>
            <p className="text-slate-700 mb-4">{story.description}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">✅ Acceptance Criteria</h4>
            <ul className="space-y-1">
              {story.acceptanceCriteria.map((criteria: string, i: number) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700 text-sm">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-slate-900 mb-1">🔗 Endpoints</h5>
              <ul className="space-y-1">
                {story.technicalImplementation.endpoints.map((endpoint: string, i: number) => (
                  <li key={i} className="text-slate-600 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                    {endpoint}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-slate-900 mb-1">🧩 Components</h5>
              <ul className="space-y-1">
                {story.technicalImplementation.components.map((component: string, i: number) => (
                  <li key={i} className="text-slate-600">{component}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-slate-900 mb-1">💾 Database</h5>
              <ul className="space-y-1">
                {story.technicalImplementation.database.map((db: string, i: number) => (
                  <li key={i} className="text-slate-600">{db}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-900 mb-2">🧪 Test Scenarios</h4>
            <ul className="space-y-1">
              {story.testScenarios.map((scenario: string, i: number) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-slate-700 text-sm">{scenario}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CapabilitiesTab: React.FC<{ capabilities: any[] }> = ({ capabilities }) => (
  <div className="space-y-6">
    {capabilities.map((category, index) => (
      <div key={index} className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{category.category}</h3>
        <div className="space-y-4">
          {category.features.map((feature: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-slate-900">{feature.name}</h4>
                {feature.technicalEndpoint && (
                  <code className="text-xs bg-slate-200 px-2 py-1 rounded">
                    {feature.technicalEndpoint}
                  </code>
                )}
              </div>
              <p className="text-slate-700 text-sm mb-2">{feature.description}</p>
              <p className="text-slate-600 text-sm">
                <strong>💡 User Benefit:</strong> {feature.userBenefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default WorkflowGenerator;