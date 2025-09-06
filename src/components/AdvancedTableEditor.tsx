import React, { useState, useEffect } from 'react';
import { X, Plus, Key, Link, Hash, Trash2, Settings, Database, ListTree, Zap } from 'lucide-react';
import { TableData, Column, DATA_TYPES, ENGINES, CHARSETS, COLLATIONS, IndexData, TriggerData } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AdvancedTableEditorProps {
  table: TableData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (table: TableData) => void;
  onDelete?: () => void;
  dialect: string;
}

export const AdvancedTableEditor: React.FC<AdvancedTableEditorProps> = ({
  table,
  isOpen,
  onClose,
  onSave,
  onDelete,
  dialect
}) => {
  const [activeTab, setActiveTab] = useState('columns');
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [tableOptions, setTableOptions] = useState({
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collation: 'utf8mb4_general_ci',
    comment: '',
    autoIncrement: 1
  });

  const availableDataTypes = DATA_TYPES[dialect as keyof typeof DATA_TYPES] || DATA_TYPES.mysql;

  useEffect(() => {
    if (table) {
      setTableName(table.name);
      setColumns([...table.columns]);
      setTableOptions({
        engine: table.engine || 'InnoDB',
        charset: table.charset || 'utf8mb4',
        collation: table.collation || 'utf8mb4_general_ci',
        comment: table.comment || '',
        autoIncrement: table.autoIncrement || 1
      });
    } else {
      setTableName('new_table');
      setColumns([]);
      setTableOptions({
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collation: 'utf8mb4_general_ci',
        comment: '',
        autoIncrement: 1
      });
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
      defaultValue: '',
      comment: '',
      collation: tableOptions.collation,
      charset: tableOptions.charset
    };
    setColumns([...columns, newColumn]);
  };

  const addPredefinedColumn = (type: 'id' | 'timestamp' | 'uuid') => {
    let newColumn: Column;
    
    switch (type) {
      case 'id':
        newColumn = {
          id: uuidv4(),
          name: 'id',
          dataType: 'INT',
          isPrimaryKey: true,
          isNotNull: true,
          isAutoIncrement: true,
          isUnique: false,
          comment: 'Primary key'
        };
        break;
      case 'timestamp':
        newColumn = {
          id: uuidv4(),
          name: 'created_at',
          dataType: 'TIMESTAMP',
          isNotNull: true,
          isPrimaryKey: false,
          isAutoIncrement: false,
          isUnique: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: 'Record creation timestamp'
        };
        break;
      case 'uuid':
        newColumn = {
          id: uuidv4(),
          name: 'uuid',
          dataType: 'VARCHAR',
          length: '36',
          isPrimaryKey: true,
          isNotNull: true,
          isAutoIncrement: false,
          isUnique: true,
          comment: 'UUID primary key'
        };
        break;
    }
    
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

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    const index = columns.findIndex(col => col.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;
    
    const newColumns = [...columns];
    [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
    setColumns(newColumns);
  };

  const handleSave = () => {
    if (!tableName.trim()) return;

    const updatedTable: TableData = {
      id: table?.id || uuidv4(),
      name: tableName,
      columns,
      position: table?.position || { x: 100, y: 100 },
      ...tableOptions
    };

    onSave(updatedTable);
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'columns', label: 'Columns', icon: Database },
    { id: 'options', label: 'Table Options', icon: Settings },
    { id: 'indexes', label: 'Indexes', icon: ListTree },
    { id: 'triggers', label: 'Triggers', icon: Zap }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {table ? `Edit Table: ${table.name}` : 'Create New Table'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
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

          {/* Tab Content */}
          {activeTab === 'columns' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-800">Columns</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => addPredefinedColumn('id')}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                  >
                    + ID Column
                  </button>
                  <button
                    onClick={() => addPredefinedColumn('timestamp')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                  >
                    + Timestamp
                  </button>
                  <button
                    onClick={() => addPredefinedColumn('uuid')}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                  >
                    + UUID
                  </button>
                  <button
                    onClick={addColumn}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Column
                  </button>
                </div>
              </div>

              {columns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No columns defined. Click "Add Column" to start.
                </div>
              ) : (
                <div className="space-y-4">
                  {columns.map((column, index) => (
                    <div key={column.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            {availableDataTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        {/* Length/Values */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Length/Values
                          </label>
                          <input
                            type="text"
                            value={column.length || ''}
                            onChange={(e) => updateColumn(column.id, { length: e.target.value })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 255, 10,2"
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

                      {/* Column Comment */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comment
                        </label>
                        <input
                          type="text"
                          value={column.comment || ''}
                          onChange={(e) => updateColumn(column.id, { comment: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Column description"
                        />
                      </div>

                      {/* Constraints and Actions */}
                      <div className="flex flex-wrap gap-4 mt-4 items-center">
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

                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => moveColumn(column.id, 'up')}
                            disabled={index === 0}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveColumn(column.id, 'down')}
                            disabled={index === columns.length - 1}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeColumn(column.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-6">
              <h3 className="text-md font-medium text-gray-800">Table Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Engine
                  </label>
                  <select
                    value={tableOptions.engine}
                    onChange={(e) => setTableOptions(prev => ({ ...prev, engine: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {ENGINES.map(engine => (
                      <option key={engine} value={engine}>{engine}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Character Set
                  </label>
                  <select
                    value={tableOptions.charset}
                    onChange={(e) => setTableOptions(prev => ({ ...prev, charset: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CHARSETS.map(charset => (
                      <option key={charset} value={charset}>{charset}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collation
                  </label>
                  <select
                    value={tableOptions.collation}
                    onChange={(e) => setTableOptions(prev => ({ ...prev, collation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {(COLLATIONS[tableOptions.charset as keyof typeof COLLATIONS] || []).map(collation => (
                      <option key={collation} value={collation}>{collation}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Increment
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tableOptions.autoIncrement}
                    onChange={(e) => setTableOptions(prev => ({ ...prev, autoIncrement: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Comment
                </label>
                <textarea
                  value={tableOptions.comment}
                  onChange={(e) => setTableOptions(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Table description or notes"
                />
              </div>
            </div>
          )}

          {activeTab === 'indexes' && (
            <div className="text-center py-8 text-gray-500">
              Index management will be available in the dedicated Index Editor.
            </div>
          )}

          {activeTab === 'triggers' && (
            <div className="text-center py-8 text-gray-500">
              Trigger management will be available in the dedicated Trigger Editor.
            </div>
          )}
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
