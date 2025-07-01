import React, { useCallback, useState } from 'react';
import { Upload, FileText, Archive, X } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      console.log('Files dropped:', files.length);
      setSelectedFiles(files);
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      console.log('Files selected:', files.length, files.map(f => f.name));
      setSelectedFiles(files);
      onFilesSelected(e.target.files);
    }
  }, [onFilesSelected]);

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    // Create new FileList
    const dt = new DataTransfer();
    newFiles.forEach(file => dt.items.add(file));
    onFilesSelected(dt.files);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.zip')) return <Archive className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 bg-white'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) {
            const input = document.getElementById('file-upload') as HTMLInputElement;
            input?.click();
          }
        }}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.json,.md,.zip,.vue,.py,.java,.cpp,.c,.go,.rs,.php,.rb,.css,.scss,.sass,.less,.html,.yml,.yaml"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
          style={{ zIndex: -1 }}
        />
        
        <div className="flex flex-col items-center space-y-4 pointer-events-none">
          <div className={`p-4 rounded-full transition-colors ${
            dragActive ? 'bg-blue-600' : 'bg-slate-100'
          }`}>
            <Upload className={`w-8 h-8 ${dragActive ? 'text-white' : 'text-slate-600'}`} />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-slate-900 mb-1">
              Drop your project files here
            </p>
            <p className="text-sm text-slate-600">
              or click to browse files (.js, .jsx, .ts, .tsx, .json, .zip, and more)
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-slate-900 mb-3">Selected Files:</h3>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="text-slate-500">
                  {getFileIcon(file.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;