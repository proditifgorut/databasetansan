import React, { useState, useEffect } from 'react';
import { X, Plus, Key, Link, Hash, Trash2 } from 'lucide-react';
import { TableData, Column, DATA_TYPES } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TableEditorProps {
  table: TableData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: TableData) => void;
  onDelete?: () => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  table,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);

  useEffect(() => {
    if (table) {
      setTableName(table.name);
      setColumns([...table.columns]);
    } else {
      setTableName('new_table');
      setColumns([]);
    }
  }, [table]);

  const addColumn = () => {
    const newColumn: Column = {
      id: uuidv4(),
      name: 'new_column',
      dataType: 'VARCHAR',
      length: '255',
      isPrimaryKey: false,
      isNotNull: false,
      isAutoIncrement: false,
      isUnique: false,
      defaultValue: ''
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => 
      col.id === id ? { ...col, ...updates } : col
    ));
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const handleSave = () => {
    if (!tableName.trim()) return;

    const updatedTable: TableData = {
      id: table?.id || uuidv4(),
      name: tableName,
      columns,
      position: table?.position || { x: 100, y: 100 }
    };

    onSave(updatedTable);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {table ? 'Edit Table' : 'Create New Table'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Table Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter table name"
            />
          </div>

          {/* Columns */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-800">Columns</h3>
              <button
                onClick={addColumn}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            </div>

            {columns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No columns defined. Click "Add Column" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Column Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Column Name
                        </label>
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Data Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Type
                        </label>
                        <select
                          value={column.dataType}
                          onChange={(e) => updateColumn(column.id, { dataType: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {DATA_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Length */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Length/Values
                        </label>
                        <input
                          type="text"
                          value={column.length || ''}
                          onChange={(e) => updateColumn(column.id, { length: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 255"
                        />
                      </div>

                      {/* Default Value */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Value
                        </label>
                        <input
                          type="text"
                          value={column.defaultValue || ''}
                          onChange={(e) => updateColumn(column.id, { defaultValue: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="NULL, NOW(), etc."
                        />
                      </div>
                    </div>

                    {/* Constraints */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={column.isPrimaryKey}
                          onChange={(e) => updateColumn(column.id, { isPrimaryKey: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Key className="w-4 h-4 text-yellow-500" />
                        Primary Key
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={column.isNotNull}
                          onChange={(e) => updateColumn(column.id, { isNotNull: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Not Null
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={column.isAutoIncrement}
                          onChange={(e) => updateColumn(column.id, { isAutoIncrement: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Auto Increment
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={column.isUnique}
                          onChange={(e) => updateColumn(column.id, { isUnique: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Hash className="w-4 h-4 text-green-500" />
                        Unique
                      </label>

                      <button
                        onClick={() => removeColumn(column.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div>
            {table && onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Table
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!tableName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
