import React, { useState, useEffect } from 'react';
import { Search, Copy, Download, Eye, Code, CheckCircle, Sparkles, FileText } from 'lucide-react';
import { GeneratedDoc } from '../types';

interface DocumentViewerProps {
  document: GeneratedDoc;
  onExport: (format: 'markdown' | 'copy' | 'ai-copy') => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onExport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'raw' | 'ai'>('preview');
  
  const handleCopy = async (format: 'copy' | 'ai-copy') => {
    try {
      const content = format === 'ai-copy' ? document.aiOptimized : document.content;
      await navigator.clipboard.writeText(content);
      setCopied(format);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const content = viewMode === 'ai' ? document.aiOptimized : document.content;
    const filename = viewMode === 'ai' ? 'ai-context.md' : 'project-documentation.md';
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentContent = () => {
    switch (viewMode) {
      case 'ai': return document.aiOptimized;
      case 'raw': return document.content;
      default: return document.content;
    }
  };

  const filteredContent = searchTerm
    ? getCurrentContent()
        .split('\n')
        .filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
        .join('\n')
    : getCurrentContent();

  const renderMarkdown = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-slate-900 mb-4 mt-6">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-slate-800 mb-3 mt-5">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium text-slate-700 mb-2 mt-4">{line.substring(4)}</h3>;
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
        
        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-slate-700 italic mb-2">
              {line.substring(2)}
            </blockquote>
          );
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-slate-700 mb-2" 
             dangerouslySetInnerHTML={{ 
               __html: line
                 .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                 .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-blue-600">$1</code>')
             }} 
          />
        );
      });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Stats Bar */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{document.metadata.fileCount}</div>
            <div className="text-sm text-slate-600">Files Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">{document.metadata.componentCount}</div>
            <div className="text-sm text-slate-600">Components</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{document.metadata.serviceCount}</div>
            <div className="text-sm text-slate-600">Services</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{Math.round(document.metadata.totalLines / 100)}K</div>
            <div className="text-sm text-slate-600">Est. Lines</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            <button
              onClick={() => setViewMode('ai')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'ai' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          
          {/* Copy Buttons */}
          <button
            onClick={() => handleCopy('copy')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            {copied === 'copy' ? (
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

          {viewMode !== 'ai' && (
            <button
              onClick={() => handleCopy('ai-copy')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-white transition-colors"
            >
              {copied === 'ai-copy' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>AI Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Copy AI Format</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Mode Description */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-2 text-sm">
          {viewMode === 'preview' && (
            <>
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-slate-700">Preview Mode - Formatted documentation for reading</span>
            </>
          )}
          {viewMode === 'raw' && (
            <>
              <Code className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700">Raw Mode - Markdown source code</span>
            </>
          )}
          {viewMode === 'ai' && (
            <>
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-700">AI Mode - Optimized format for AI coding assistants</span>
            </>
          )}
        </div>
      </div>

      {/* Document Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-h-[600px] overflow-y-auto shadow-sm">
        {viewMode === 'preview' ? (
          <div className="prose prose-slate max-w-none">
            {renderMarkdown(filteredContent)}
          </div>
        ) : (
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
            {filteredContent}
          </pre>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;