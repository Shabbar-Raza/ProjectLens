import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  Code, 
  FileText, 
  Copy, 
  CheckCircle, 
  Search,
  Filter,
  BookOpen,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { ProfessionalDoc, OutputFormat } from '../types';

interface ProfessionalDocViewerProps {
  documents: ProfessionalDoc[];
  onExport: (docId: string, format: OutputFormat) => void;
  onBack?: () => void; // Add back button callback
}

const ProfessionalDocViewer: React.FC<ProfessionalDocViewerProps> = ({ 
  documents, 
  onExport,
  onBack
}) => {
  const [selectedDoc, setSelectedDoc] = useState<string>(documents[0]?.id || '');
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const currentDoc = documents.find(doc => doc.id === selectedDoc);

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getFilteredContent = () => {
    if (!currentDoc) return '';
    
    let content = currentDoc.content;
    
    if (searchTerm) {
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      );
      content = filteredLines.join('\n');
    }
    
    return content;
  };

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-slate-900 mb-6 mt-8">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-semibold text-slate-800 mb-4 mt-6">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-medium text-slate-700 mb-3 mt-5">{line.substring(4)}</h3>;
        }
        if (line.startsWith('#### ')) {
          return <h4 key={index} className="text-lg font-medium text-slate-600 mb-2 mt-4">{line.substring(5)}</h4>;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
          return null; // Handle in a more sophisticated way if needed
        }
        
        // Lists
        if (line.startsWith('- ')) {
          const content = line.substring(2);
          return (
            <li key={index} className="text-slate-700 ml-4 mb-1">
              <span className="text-blue-600 mr-2">•</span>
              <span dangerouslySetInnerHTML={{ 
                __html: content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
              }} />
            </li>
          );
        }
        
        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const content = line.replace(/^\d+\.\s/, '');
          return (
            <li key={index} className="text-slate-700 ml-4 mb-1 list-decimal">
              <span dangerouslySetInnerHTML={{ 
                __html: content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                  .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
              }} />
            </li>
          );
        }
        
        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-slate-700 italic mb-3">
              {line.substring(2)}
            </blockquote>
          );
        }
        
        // Horizontal rules
        if (line.trim() === '---') {
          return <hr key={index} className="border-slate-300 my-6" />;
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-slate-700 mb-3 leading-relaxed" 
             dangerouslySetInnerHTML={{ 
               __html: line
                 .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                 .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
                 .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>')
             }} 
          />
        );
      });
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Documents Generated</h3>
        <p className="text-slate-500">Generate professional documentation to view it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Generator</span>
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-900">Professional Documentation</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">{documents.length} document{documents.length !== 1 ? 's' : ''} generated</span>
        </div>
      </div>

      {/* Document Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Generated Documents</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">{documents.length} documents</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedDoc === doc.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-medium text-slate-900 text-sm">{doc.title}</div>
              <div className="text-xs text-slate-600 mt-1">
                {doc.sections.length} sections • {doc.metadata.approvalStatus}
              </div>
            </button>
          ))}
        </div>
      </div>

      {currentDoc && (
        <>
          {/* Document Metadata */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{currentDoc.sections.length}</div>
                <div className="text-sm text-slate-600">Sections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{currentDoc.metadata.version}</div>
                <div className="text-sm text-slate-600">Version</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{currentDoc.metadata.approvalStatus}</div>
                <div className="text-sm text-slate-600">Status</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {new Date(currentDoc.metadata.generatedAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-600">Generated</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              {/* View Mode Selector */}
              <div className="flex bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'preview' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === 'raw' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={() => handleCopy(currentDoc.content, 'content')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
              >
                {copied === 'content' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="p-2 min-w-48">
                    {(['html', 'markdown', 'pdf', 'confluence', 'notion', 'sharepoint', 'docx'] as OutputFormat[]).map(format => (
                      <button
                        key={format}
                        onClick={() => onExport(currentDoc.id, format)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      >
                        Export as {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Section Filter */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-900">Filter Sections</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentDoc.sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => handleSectionToggle(section.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedSections.length === 0 || selectedSections.includes(section.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {section.title}
                </button>
              ))}
              {selectedSections.length > 0 && (
                <button
                  onClick={() => setSelectedSections([])}
                  className="px-3 py-1 rounded-full text-xs bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="max-h-[800px] overflow-y-auto">
              {viewMode === 'preview' ? (
                <div className="prose prose-slate max-w-none">
                  {renderMarkdown(getFilteredContent())}
                </div>
              ) : (
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {getFilteredContent()}
                </pre>
              )}
            </div>
          </div>

          {/* Document Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Document Sections</h4>
            <div className="space-y-2">
              {currentDoc.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-500 w-6">{index + 1}</span>
                    <span className="text-sm text-slate-700">{section.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {section.codeExamples && section.codeExamples.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        {section.codeExamples.length} examples
                      </span>
                    )}
                    {section.diagrams && section.diagrams.length > 0 && (
                      <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                        {section.diagrams.length} diagrams
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfessionalDocViewer;