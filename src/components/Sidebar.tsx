import React from 'react';
import { 
  Database, 
  Plus, 
  Download, 
  Upload, 
  Code, 
  Copy,
  Settings,
  FileDown,
  FileUp
} from 'lucide-react';
import { SQLDialect } from '../types';

interface SidebarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onToggleCodePanel: () => void;
  showCodePanel: boolean;
  dialect: SQLDialect;
  onDialectChange: (dialect: SQLDialect) => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onAddTable,
  onExportSQL,
  onExportJSON,
  onImportJSON,
  onToggleCodePanel,
  showCodePanel,
  dialect,
  onDialectChange,
  projectName,
  onProjectNameChange
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportJSON(file);
      event.target.value = '';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          SQL Architect
        </h1>
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Untitled Project"
          />
        </div>
      </div>

      {/* Toolbox */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Toolbox</h2>
        
        <button
          onClick={onAddTable}
          className="w-full flex items-center gap-3 p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Table</span>
        </button>
      </div>

      {/* Settings */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SQL Dialect
            </label>
            <select
              value={dialect}
              onChange={(e) => onDialectChange(e.target.value as SQLDialect)}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Actions</h2>
        
        <button
          onClick={onToggleCodePanel}
          className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors ${
            showCodePanel 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Code className="w-4 h-4" />
          <span className="text-sm font-medium">
            {showCodePanel ? 'Hide' : 'Show'} SQL Code
          </span>
        </button>

        <button
          onClick={onExportSQL}
          className="w-full flex items-center gap-3 p-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          <span className="text-sm font-medium">Export SQL</span>
        </button>

        <button
          onClick={onExportJSON}
          className="w-full flex items-center gap-3 p-2 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Export Project</span>
        </button>

        <button
          onClick={handleImportClick}
          className="w-full flex items-center gap-3 p-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
        >
          <FileUp className="w-4 h-4" />
          <span className="text-sm font-medium">Import Project</span>
        </button>
      </div>
    </div>
  );
};
