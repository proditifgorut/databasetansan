import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Key, Link, Hash } from 'lucide-react';
import { Column } from '../types';

interface TableNodeProps {
  data: {
    name: string;
    columns: Column[];
    onEdit: () => void;
  };
  selected: boolean;
}

export const TableNode: React.FC<TableNodeProps> = ({ data, selected }) => {
  const { name, columns, onEdit } = data;

  const getColumnIcon = (column: Column) => {
    if (column.isPrimaryKey) return <Key className="w-3 h-3 text-yellow-500" />;
    if (column.isForeignKey) return <Link className="w-3 h-3 text-blue-500" />;
    if (column.isUnique) return <Hash className="w-3 h-3 text-green-500" />;
    return <div className="w-3 h-3" />; // Placeholder for alignment
  };

  const getDataTypeDisplay = (column: Column) => {
    let display = column.dataType;
    if (column.length && ['VARCHAR', 'CHAR', 'DECIMAL', 'VARBINARY', 'BINARY'].includes(column.dataType.toUpperCase())) {
      display += `(${column.length})`;
    }
    return display;
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 min-w-64 ${
        selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      } hover:shadow-xl transition-shadow`}
      onDoubleClick={onEdit}
    >
      {/* Table Header */}
      <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg flex items-center gap-2">
        <Database className="w-4 h-4" />
        <span className="font-semibold text-sm">{name}</span>
      </div>
      
      {/* Columns */}
      <div className="p-0">
        {columns.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm italic">
            No columns defined
          </div>
        ) : (
          columns.map((column) => (
            <div 
              key={column.id} 
              className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between relative"
            >
              <Handle type="source" position={Position.Right} id={column.id} className="!w-3 !h-3 !bg-blue-500" />
              <Handle type="target" position={Position.Left} id={column.id} className="!w-3 !h-3 !bg-green-500" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getColumnIcon(column)}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {column.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                {getDataTypeDisplay(column)}
              </span>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg text-xs text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
        {columns.length} column{columns.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
