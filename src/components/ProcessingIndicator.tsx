import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingIndicatorProps {
  message: string;
  progress?: number;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ message, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="relative mb-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        {progress !== undefined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
      <p className="text-slate-700 text-lg font-medium text-center max-w-md mb-4">
        {message}
      </p>
      {progress !== undefined && (
        <div className="w-64 bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProcessingIndicator;