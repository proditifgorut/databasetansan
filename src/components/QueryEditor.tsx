import React, { useState, useRef } from 'react';
import { Play, Save, FileText, Download, Upload, Database, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SQLDialect } from '../types';
import { SQLGenerator } from '../utils/sqlGenerator';

interface QueryEditorProps {
  dialect: SQLDialect;
  onExecuteQuery: (query: string) => Promise<any>;
  isOpen: boolean;
  onClose: () => void;
}

interface QueryResult {
  id: string;
  query: string;
  result: any;
  executionTime: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  dialect,
  onExecuteQuery,
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [savedQueries, setSavedQueries] = useState<{ name: string; query: string }[]>([]);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const executeQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const result = await onExecuteQuery(query);
      const executionTime = Date.now() - startTime;

      const queryResult: QueryResult = {
        id: Date.now().toString(),
        query,
        result,
        executionTime,
        success: true,
        timestamp: new Date()
      };

      setResults(prev => [queryResult, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      const queryResult: QueryResult = {
        id: Date.now().toString(),
        query,
        result: null,
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };

      setResults(prev => [queryResult, ...prev.slice(0, 9)]);
    } finally {
      setIsExecuting(false);
    }
  };

  const saveQuery = () => {
    const name = prompt('Enter a name for this query:');
    if (name && query.trim()) {
      setSavedQueries(prev => [...prev, { name, query }]);
    }
  };

  const loadQuery = (savedQuery: string) => {
    setQuery(savedQuery);
    setShowSavedQueries(false);
  };

  const exportQueries = () => {
    const data = JSON.stringify(savedQueries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved_queries.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importQueries = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSavedQueries(prev => [...prev, ...imported]);
        } catch (error) {
          alert('Failed to import queries. Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const generateExampleQueries = () => {
    const examples = [
      'SELECT * FROM users LIMIT 10;',
      'SHOW TABLES;',
      'DESCRIBE users;',
      'SELECT COUNT(*) FROM products;',
      'SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);',
      'CREATE INDEX idx_user_email ON users(email);',
      'SHOW INDEX FROM users;'
    ];
    
    return examples.map(q => ({ name: `Example: ${q.split(' ').slice(0, 3).join(' ')}`, query: q }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <input
          type="file"
          ref={fileInputRef}
          onChange={importQueries}
          accept=".json"
          className="hidden"
        />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            SQL Query Editor - {dialect.toUpperCase()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedQueries(!showSavedQueries)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              Saved Queries
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Saved Queries Panel */}
          {showSavedQueries && (
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3">Saved Queries</h3>
                <div className="flex gap-2">
                  <button
                    onClick={exportQueries}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                  >
                    <Upload className="w-3 h-3" />
                    Import
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Examples</h4>
                  {generateExampleQueries().map((item, index) => (
                    <button
                      key={`example-${index}`}
                      onClick={() => loadQuery(item.query)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-sm"
                    >
                      <div className="font-medium text-gray-700">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">{item.query}</div>
                    </button>
                  ))}
                  
                  {savedQueries.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium text-gray-600 mb-2 mt-4">Your Saved Queries</h4>
                      {savedQueries.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => loadQuery(item.query)}
                          className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-sm"
                        >
                          <div className="font-medium text-gray-700">{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">{item.query}</div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Query Editor */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">Query Editor</h3>
                <div className="flex gap-2">
                  <button
                    onClick={saveQuery}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={executeQuery}
                    disabled={isExecuting || !query.trim()}
                    className="flex items-center gap-2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Play className="w-4 h-4" />
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </button>
                </div>
              </div>
              
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Enter your SQL query here..."
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="font-medium text-gray-800 mb-3">Query Results</h3>
              
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No queries executed yet. Enter a query above and click Execute.
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`p-3 flex items-center justify-between ${
                        result.success ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {result.success ? 'Success' : 'Error'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {result.executionTime}ms
                          </span>
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="text-sm text-gray-600 mb-2 font-mono bg-gray-100 p-2 rounded">
                          {result.query}
                        </div>
                        
                        {result.success ? (
                          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                            {typeof result.result === 'object' ? (
                              <pre>{JSON.stringify(result.result, null, 2)}</pre>
                            ) : (
                              <div>{result.result || 'Query executed successfully'}</div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-800">
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
