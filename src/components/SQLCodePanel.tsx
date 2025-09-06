import React, { useMemo } from 'react';
import { Copy, X, Check } from 'lucide-react';
import { TableData, RelationshipData, SQLDialect } from '../types';
import { SQLGenerator } from '../utils/sqlGenerator';

interface SQLCodePanelProps {
  tables: TableData[];
  relationships: RelationshipData[];
  dialect: SQLDialect;
  isOpen: boolean;
  onClose: () => void;
}

export const SQLCodePanel: React.FC<SQLCodePanelProps> = ({
  tables,
  relationships,
  dialect,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  const sqlCode = useMemo(() => {
    const generator = new SQLGenerator(dialect);
    return generator.generateFullSQL(tables, relationships);
  }, [tables, relationships, dialect]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-1/2 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Generated SQL</h3>
          <p className="text-sm text-gray-600">Dialect: {dialect.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {sqlCode ? (
          <pre className="p-4 text-sm text-gray-800 font-mono whitespace-pre-wrap">
            {sqlCode}
          </pre>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No tables created yet.</p>
            <p className="text-sm mt-1">Add tables to see generated SQL code.</p>
          </div>
        )}
      </div>
    </div>
  );
};
