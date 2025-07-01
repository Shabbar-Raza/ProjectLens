import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FolderOpen } from 'lucide-react';
import { ProjectFile } from '../types';

interface FileTreeProps {
  structure: ProjectFile;
  onFileSelect?: (file: ProjectFile) => void;
  selectedFile?: ProjectFile;
}

interface FileTreeNodeProps {
  node: ProjectFile;
  level: number;
  onFileSelect?: (file: ProjectFile) => void;
  selectedFile?: ProjectFile;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ 
  node, 
  level, 
  onFileSelect, 
  selectedFile 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first two levels
  
  const handleToggle = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else if (onFileSelect) {
      onFileSelect(node);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js': case 'jsx': return '⚡';
      case 'ts': case 'tsx': return '🔷';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'css': case 'scss': case 'less': return '🎨';
      case 'html': return '🌐';
      case 'py': return '🐍';
      case 'java': return '☕';
      default: return '📄';
    }
  };

  const isSelected = selectedFile && selectedFile.path === node.path;

  return (
    <div>
      <div
        className={`flex items-center space-x-2 py-1 px-2 cursor-pointer hover:bg-slate-100 rounded transition-colors ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleToggle}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-xs">{getFileIcon(node.name)}</span>
            </div>
          </>
        )}
        
        <span className={`text-sm ${
          node.type === 'directory' 
            ? 'text-slate-700 font-medium' 
            : 'text-slate-600'
        }`}>
          {node.name}
        </span>
        
        {node.type === 'file' && node.size && (
          <span className="text-xs text-slate-400 ml-auto">
            {Math.round(node.size / 1024)}KB
          </span>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'directory' ? -1 : 1;
            })
            .map((child, index) => (
              <FileTreeNode
                key={`${child.path}-${index}`}
                node={child}
                level={level + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))
          }
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ structure, onFileSelect, selectedFile }) => {
  if (!structure.children || structure.children.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No files to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 max-h-96 overflow-y-auto shadow-sm">
      <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
        <Folder className="w-4 h-4 mr-2" />
        Project Structure
      </h3>
      <div className="space-y-1">
        {structure.children
          .sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
          })
          .map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={0}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))
        }
      </div>
    </div>
  );
};

export default FileTree;