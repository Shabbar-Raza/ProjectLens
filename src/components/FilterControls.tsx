import React from 'react';
import { Settings, Filter } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterControlsProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
  isVisible: boolean;
  onToggle: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ options, onChange, isVisible, onToggle }) => {
  const handleChange = (key: keyof FilterOptions, value: any) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium transition-colors shadow-sm"
      >
        <Filter className="w-4 h-4" />
        <span>Filter Options</span>
      </button>

      {isVisible && (
        <div className="absolute top-12 right-0 z-10 bg-white border border-slate-200 rounded-lg p-4 min-w-80 shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-slate-900">Analysis Options</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Include test files</label>
              <input
                type="checkbox"
                checked={options.includeTests}
                onChange={(e) => handleChange('includeTests', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Include style files</label>
              <input
                type="checkbox"
                checked={options.includeStyles}
                onChange={(e) => handleChange('includeStyles', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">Include config files</label>
              <input
                type="checkbox"
                checked={options.includeConfig}
                onChange={(e) => handleChange('includeConfig', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">
                Max file size (KB): {options.maxFileSize}
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={options.maxFileSize}
                onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">
                Custom ignore patterns (comma-separated)
              </label>
              <input
                type="text"
                value={options.customIgnore.join(', ')}
                onChange={(e) => handleChange('customIgnore', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                placeholder="e.g., temp, backup, old"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-900 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => onChange({
                includeTests: false,
                includeStyles: true,
                includeConfig: true,
                maxFileSize: 1024,
                customIgnore: []
              })}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;