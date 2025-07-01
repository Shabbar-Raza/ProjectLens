import React, { useState } from 'react';
import { 
  FileText, 
  Settings, 
  Download, 
  Eye, 
  CheckCircle, 
  Building, 
  Shield, 
  Database,
  Globe,
  Users,
  BookOpen,
  Zap,
  Palette
} from 'lucide-react';
import { 
  ProfessionalDocConfig, 
  DocumentType, 
  DocumentationStandard, 
  OutputFormat,
  BrandingConfig,
  ComplianceRequirement,
  ProjectAnalysis 
} from '../types';

interface ProfessionalDocGeneratorProps {
  analysis: ProjectAnalysis;
  onGenerate: (config: ProfessionalDocConfig) => void;
}

const ProfessionalDocGenerator: React.FC<ProfessionalDocGeneratorProps> = ({ 
  analysis, 
  onGenerate 
}) => {
  const [config, setConfig] = useState<ProfessionalDocConfig>({
    documentTypes: getDefaultDocumentTypes(),
    standard: 'enterprise',
    outputFormat: 'html',
    branding: {},
    compliance: []
  });

  const [activeTab, setActiveTab] = useState<'types' | 'standards' | 'branding' | 'compliance'>('types');

  const documentationStandards = [
    {
      id: 'enterprise' as DocumentationStandard,
      name: 'Enterprise Standard',
      description: 'Confluence/SharePoint style for large organizations',
      icon: Building,
      features: ['Executive summaries', 'Approval workflows', 'Compliance sections', 'Professional formatting']
    },
    {
      id: 'engineering' as DocumentationStandard,
      name: 'Engineering Standard',
      description: 'GitBook/Notion style for technical teams',
      icon: Zap,
      features: ['Code-focused', 'Interactive examples', 'API documentation', 'Developer-friendly']
    },
    {
      id: 'opensource' as DocumentationStandard,
      name: 'Open Source Standard',
      description: 'GitHub wiki style for open source projects',
      icon: Globe,
      features: ['Community-focused', 'Contribution guides', 'Issue templates', 'Public documentation']
    },
    {
      id: 'corporate' as DocumentationStandard,
      name: 'Corporate Standard',
      description: 'MS Word/PDF style for formal documentation',
      icon: FileText,
      features: ['Print-ready', 'Formal structure', 'Legal compliance', 'Version control']
    },
    {
      id: 'startup' as DocumentationStandard,
      name: 'Startup Standard',
      description: 'Minimal/Agile style for fast-moving teams',
      icon: Users,
      features: ['Lean documentation', 'Quick setup', 'Agile-friendly', 'Minimal overhead']
    }
  ];

  const outputFormats = [
    { id: 'html' as OutputFormat, name: 'HTML', description: 'Interactive web documentation' },
    { id: 'markdown' as OutputFormat, name: 'Markdown', description: 'Universal format for developers' },
    { id: 'pdf' as OutputFormat, name: 'PDF', description: 'Professional print-ready documents' },
    { id: 'confluence' as OutputFormat, name: 'Confluence XML', description: 'Direct Confluence import' },
    { id: 'notion' as OutputFormat, name: 'Notion', description: 'Notion-compatible format' },
    { id: 'sharepoint' as OutputFormat, name: 'SharePoint', description: 'SharePoint-ready HTML' },
    { id: 'docx' as OutputFormat, name: 'Word Document', description: 'Microsoft Word format' }
  ];

  const complianceOptions = [
    { id: 'gdpr' as ComplianceRequirement, name: 'GDPR', description: 'EU data protection compliance' },
    { id: 'hipaa' as ComplianceRequirement, name: 'HIPAA', description: 'Healthcare data protection' },
    { id: 'sox' as ComplianceRequirement, name: 'SOX', description: 'Financial reporting compliance' },
    { id: 'iso27001' as ComplianceRequirement, name: 'ISO 27001', description: 'Information security management' },
    { id: 'pci-dss' as ComplianceRequirement, name: 'PCI DSS', description: 'Payment card industry security' }
  ];

  const handleDocumentTypeSelect = (typeId: string) => {
    setConfig(prev => ({
      ...prev,
      documentTypes: prev.documentTypes.map(type => ({
        ...type,
        enabled: type.id === typeId // Only enable the selected type, disable all others
      }))
    }));
  };

  const handleStandardChange = (standard: DocumentationStandard) => {
    setConfig(prev => ({ ...prev, standard }));
  };

  const handleOutputFormatChange = (format: OutputFormat) => {
    setConfig(prev => ({ ...prev, outputFormat: format }));
  };

  const handleBrandingChange = (branding: Partial<BrandingConfig>) => {
    setConfig(prev => ({
      ...prev,
      branding: { ...prev.branding, ...branding }
    }));
  };

  const handleComplianceToggle = (requirement: ComplianceRequirement) => {
    setConfig(prev => ({
      ...prev,
      compliance: prev.compliance?.includes(requirement)
        ? prev.compliance.filter(c => c !== requirement)
        : [...(prev.compliance || []), requirement]
    }));
  };

  const handleGenerate = () => {
    onGenerate(config);
  };

  const getSelectedDocumentType = () => {
    return config.documentTypes.find(type => type.enabled);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Professional Documentation Generator</h2>
          <p className="text-slate-600">Generate enterprise-grade documentation following industry standards</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-slate-100 rounded-lg p-1">
        {[
          { id: 'types', label: 'Document Type', icon: FileText },
          { id: 'standards', label: 'Standards', icon: Settings },
          { id: 'branding', label: 'Branding', icon: Palette },
          { id: 'compliance', label: 'Compliance', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Document Types Tab */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select Document Type</h3>
            <p className="text-slate-600 mb-6">Choose one document type to generate professional documentation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.documentTypes.map(docType => (
              <div
                key={docType.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  docType.enabled
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => handleDocumentTypeSelect(docType.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name="documentType"
                        checked={docType.enabled}
                        onChange={() => handleDocumentTypeSelect(docType.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <h3 className="font-semibold text-slate-900">{docType.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{docType.description}</p>
                    <div className="text-xs text-slate-500">
                      {docType.sections.length} sections included
                    </div>
                  </div>
                  <div className="ml-4">
                    {getDocumentTypeIcon(docType.id)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standards Tab */}
      {activeTab === 'standards' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Documentation Standard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentationStandards.map(standard => (
                <div
                  key={standard.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    config.standard === standard.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => handleStandardChange(standard.id)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <standard.icon className="w-6 h-6 text-blue-600" />
                    <h4 className="font-semibold text-slate-900">{standard.name}</h4>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{standard.description}</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    {standard.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Output Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {outputFormats.map(format => (
                <button
                  key={format.id}
                  onClick={() => handleOutputFormatChange(format.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    config.outputFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">{format.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Branding</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={config.branding?.companyName || ''}
                onChange={(e) => handleBrandingChange({ companyName: e.target.value })}
                placeholder="Enter company name"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={config.branding?.logo || ''}
                onChange={(e) => handleBrandingChange({ logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Primary Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={config.branding?.primaryColor || '#2563eb'}
                  onChange={(e) => handleBrandingChange({ primaryColor: e.target.value })}
                  className="w-12 h-10 rounded border border-slate-300"
                />
                <input
                  type="text"
                  value={config.branding?.primaryColor || '#2563eb'}
                  onChange={(e) => handleBrandingChange({ primaryColor: e.target.value })}
                  placeholder="#2563eb"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Secondary Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={config.branding?.secondaryColor || '#64748b'}
                  onChange={(e) => handleBrandingChange({ secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded border border-slate-300"
                />
                <input
                  type="text"
                  value={config.branding?.secondaryColor || '#64748b'}
                  onChange={(e) => handleBrandingChange({ secondaryColor: e.target.value })}
                  placeholder="#64748b"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Header Template
            </label>
            <textarea
              value={config.branding?.headerTemplate || ''}
              onChange={(e) => handleBrandingChange({ headerTemplate: e.target.value })}
              placeholder="Custom HTML header template (optional)"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Custom Footer Template
            </label>
            <textarea
              value={config.branding?.footerTemplate || ''}
              onChange={(e) => handleBrandingChange({ footerTemplate: e.target.value })}
              placeholder="Custom HTML footer template (optional)"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Compliance Requirements</h3>
          <p className="text-slate-600 mb-6">
            Select compliance standards to include relevant documentation sections and requirements.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceOptions.map(compliance => (
              <div
                key={compliance.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  config.compliance?.includes(compliance.id)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => handleComplianceToggle(compliance.id)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={config.compliance?.includes(compliance.id) || false}
                    onChange={() => handleComplianceToggle(compliance.id)}
                    className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <h4 className="font-semibold text-slate-900">{compliance.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{compliance.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {getSelectedDocumentType() ? (
              <>Selected: {getSelectedDocumentType()?.name} • {config.standard} standard • {config.outputFormat.toUpperCase()} format</>
            ) : (
              'Please select a document type to continue'
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!getSelectedDocumentType()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Generate Professional Documentation</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function getDefaultDocumentTypes(): DocumentType[] {
  return [
    {
      id: 'technical-architecture',
      name: 'Technical Architecture Document',
      description: 'System architecture overview with component diagrams and technology stack',
      enabled: false, // Changed to false by default
      sections: [
        { id: 'executive-summary', title: 'Executive Summary', required: true, template: 'executive-summary', order: 1 },
        { id: 'system-overview', title: 'System Overview', required: true, template: 'system-overview', order: 2 },
        { id: 'architecture-diagrams', title: 'Architecture Diagrams', required: true, template: 'architecture-diagrams', order: 3 },
        { id: 'technology-stack', title: 'Technology Stack', required: true, template: 'technology-stack', order: 4 },
        { id: 'data-architecture', title: 'Data Architecture', required: false, template: 'data-architecture', order: 5 },
        { id: 'security-architecture', title: 'Security Architecture', required: false, template: 'security-architecture', order: 6 },
        { id: 'performance-considerations', title: 'Performance Considerations', required: false, template: 'performance-considerations', order: 7 },
        { id: 'deployment-architecture', title: 'Deployment Architecture', required: false, template: 'deployment-architecture', order: 8 }
      ]
    },
    {
      id: 'api-documentation',
      name: 'API Documentation',
      description: 'Comprehensive API reference with endpoints, authentication, and examples',
      enabled: false,
      sections: [
        { id: 'api-overview', title: 'API Overview', required: true, template: 'api-overview', order: 1 },
        { id: 'authentication', title: 'Authentication', required: true, template: 'authentication', order: 2 },
        { id: 'endpoints-reference', title: 'Endpoints Reference', required: true, template: 'endpoints-reference', order: 3 },
        { id: 'error-handling', title: 'Error Handling', required: true, template: 'error-handling', order: 4 },
        { id: 'rate-limiting', title: 'Rate Limiting', required: false, template: 'rate-limiting', order: 5 },
        { id: 'sdks-examples', title: 'SDKs & Examples', required: false, template: 'sdks-examples', order: 6 },
        { id: 'changelog', title: 'Changelog', required: false, template: 'changelog', order: 7 }
      ]
    },
    {
      id: 'developer-onboarding',
      name: 'Developer Onboarding Guide',
      description: 'Complete setup guide for new developers joining the project',
      enabled: false,
      sections: [
        { id: 'quick-start', title: 'Quick Start Guide', required: true, template: 'quick-start', order: 1 },
        { id: 'environment-setup', title: 'Development Environment Setup', required: true, template: 'environment-setup', order: 2 },
        { id: 'code-standards', title: 'Code Standards & Style Guide', required: true, template: 'code-standards', order: 3 },
        { id: 'git-workflow', title: 'Git Workflow', required: true, template: 'git-workflow', order: 4 },
        { id: 'testing-guidelines', title: 'Testing Guidelines', required: false, template: 'testing-guidelines', order: 5 },
        { id: 'debugging-handbook', title: 'Debugging Handbook', required: false, template: 'debugging-handbook', order: 6 }
      ]
    },
    {
      id: 'project-requirements',
      name: 'Project Requirements Document',
      description: 'Business objectives, user stories, and functional requirements',
      enabled: false,
      sections: [
        { id: 'business-objectives', title: 'Business Objectives', required: true, template: 'business-objectives', order: 1 },
        { id: 'user-stories', title: 'User Stories & Use Cases', required: true, template: 'user-stories', order: 2 },
        { id: 'functional-requirements', title: 'Functional Requirements', required: true, template: 'functional-requirements', order: 3 },
        { id: 'non-functional-requirements', title: 'Non-Functional Requirements', required: true, template: 'non-functional-requirements', order: 4 },
        { id: 'acceptance-criteria', title: 'Acceptance Criteria', required: false, template: 'acceptance-criteria', order: 5 },
        { id: 'risk-assessment', title: 'Risk Assessment', required: false, template: 'risk-assessment', order: 6 }
      ]
    },
    {
      id: 'database-documentation',
      name: 'Database Documentation',
      description: 'Schema documentation, data dictionary, and migration procedures',
      enabled: false,
      sections: [
        { id: 'schema-documentation', title: 'Schema Documentation', required: true, template: 'schema-documentation', order: 1 },
        { id: 'data-dictionary', title: 'Data Dictionary', required: true, template: 'data-dictionary', order: 2 },
        { id: 'migration-scripts', title: 'Migration Scripts', required: false, template: 'migration-scripts', order: 3 },
        { id: 'backup-recovery', title: 'Backup & Recovery Procedures', required: false, template: 'backup-recovery', order: 4 },
        { id: 'performance-optimization', title: 'Performance Optimization', required: false, template: 'performance-optimization', order: 5 }
      ]
    },
    {
      id: 'deployment-operations',
      name: 'Deployment & Operations Guide',
      description: 'CI/CD pipeline, environment configuration, and monitoring setup',
      enabled: false,
      sections: [
        { id: 'cicd-pipeline', title: 'CI/CD Pipeline Documentation', required: true, template: 'cicd-pipeline', order: 1 },
        { id: 'environment-configuration', title: 'Environment Configuration', required: true, template: 'environment-configuration', order: 2 },
        { id: 'monitoring-logging', title: 'Monitoring & Logging', required: false, template: 'monitoring-logging', order: 3 },
        { id: 'backup-disaster-recovery', title: 'Backup & Disaster Recovery', required: false, template: 'backup-disaster-recovery', order: 4 },
        { id: 'troubleshooting-runbook', title: 'Troubleshooting Runbook', required: false, template: 'troubleshooting-runbook', order: 5 }
      ]
    },
    {
      id: 'security-documentation',
      name: 'Security Documentation',
      description: 'Security assessment, compliance measures, and incident response procedures',
      enabled: false,
      sections: [
        { id: 'security-assessment', title: 'Security Assessment', required: true, template: 'security-assessment', order: 1 },
        { id: 'data-privacy-compliance', title: 'Data Privacy Compliance', required: true, template: 'data-privacy-compliance', order: 2 },
        { id: 'access-control-matrix', title: 'Access Control Matrix', required: false, template: 'access-control-matrix', order: 3 },
        { id: 'incident-response', title: 'Security Incident Response', required: false, template: 'incident-response', order: 4 },
        { id: 'penetration-testing', title: 'Penetration Testing Results', required: false, template: 'penetration-testing', order: 5 }
      ]
    },
    {
      id: 'user-documentation',
      name: 'User Documentation',
      description: 'End-user guides, admin documentation, and feature explanations',
      enabled: false,
      sections: [
        { id: 'user-manual', title: 'User Manual', required: true, template: 'user-manual', order: 1 },
        { id: 'admin-documentation', title: 'Admin Documentation', required: false, template: 'admin-documentation', order: 2 },
        { id: 'faq-section', title: 'FAQ Section', required: false, template: 'faq-section', order: 3 },
        { id: 'video-tutorials', title: 'Video Tutorials', required: false, template: 'video-tutorials', order: 4 },
        { id: 'feature-documentation', title: 'Feature Documentation', required: false, template: 'feature-documentation', order: 5 }
      ]
    }
  ];
}

function getDocumentTypeIcon(typeId: string) {
  const iconMap = {
    'technical-architecture': <Building className="w-6 h-6 text-blue-600" />,
    'api-documentation': <Globe className="w-6 h-6 text-emerald-600" />,
    'developer-onboarding': <Users className="w-6 h-6 text-indigo-600" />,
    'project-requirements': <FileText className="w-6 h-6 text-amber-600" />,
    'database-documentation': <Database className="w-6 h-6 text-cyan-600" />,
    'deployment-operations': <Zap className="w-6 h-6 text-orange-600" />,
    'security-documentation': <Shield className="w-6 h-6 text-red-600" />,
    'user-documentation': <BookOpen className="w-6 h-6 text-purple-600" />
  };
  
  return iconMap[typeId] || <FileText className="w-6 h-6 text-slate-600" />;
}

export default ProfessionalDocGenerator;