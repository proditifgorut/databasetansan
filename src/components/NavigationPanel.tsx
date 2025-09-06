import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  ListTree, 
  Eye, 
  Settings, 
  Users, 
  Zap, 
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { DatabaseData, TableData, IndexData, ViewData, StoredProcedureData, TriggerData, UserData } from '../types';

interface NavigationPanelProps {
  databases: DatabaseData[];
  tables: TableData[];
  indexes: IndexData[];
  views: ViewData[];
  procedures: StoredProcedureData[];
  triggers: TriggerData[];
  users: UserData[];
  currentDatabase: string;
  onDatabaseSelect: (databaseId: string) => void;
  onCreateDatabase: () => void;
  onCreateTable: () => void;
  onCreateIndex: () => void;
  onCreateView: () => void;
  onCreateProcedure: () => void;
  onCreateTrigger: () => void;
  onCreateUser: () => void;
  onEditItem: (type: string, item: any) => void;
  onDeleteItem: (type: string, item: any) => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  databases,
  tables,
  indexes,
  views,
  procedures,
  triggers,
  users,
  currentDatabase,
  onDatabaseSelect,
  onCreateDatabase,
  onCreateTable,
  onCreateIndex,
  onCreateView,
  onCreateProcedure,
  onCreateTrigger,
  onCreateUser,
  onEditItem,
  onDeleteItem
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    databases: true,
    tables: true,
    indexes: false,
    views: false,
    procedures: false,
    triggers: false,
    users: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const NavigationItem = ({ 
    icon: Icon, 
    label, 
    count, 
    onAdd, 
    children, 
    expanded, 
    onToggle 
  }: {
    icon: React.ComponentType<any>;
    label: string;
    count: number;
    onAdd: () => void;
    children?: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
  }) => (
    <div className="mb-1">
      <div className="flex items-center justify-between p-2 hover:bg-gray-700 rounded-md group text-gray-300 hover:text-white">
        <div className="flex items-center gap-2 cursor-pointer flex-grow" onClick={onToggle}>
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs bg-gray-600 px-2 py-0.5 rounded-full ml-auto mr-2">
            {count}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {expanded && <div className="pl-4 mt-1">{children}</div>}
    </div>
  );

  const ItemRow = ({ 
    item,
    type,
    onEdit, 
    onDelete, 
    selected = false 
  }: {
    item: { id: string, name: string, host?: string };
    type: string;
    onEdit: (type: string, item: any) => void;
    onDelete: (type: string, item: any) => void;
    selected?: boolean;
  }) => (
    <div className={`flex items-center justify-between p-1.5 pl-5 hover:bg-gray-700 rounded-md group text-gray-400 ${
      selected ? 'bg-blue-900/50 text-white' : ''
    }`}>
      <span className="text-sm truncate flex-1 cursor-default">{item.host ? `${item.name}@${item.host}` : item.name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(type, item)}
          className="p-1 hover:bg-gray-600 rounded"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(type, item)}
          className="p-1 hover:bg-red-800/50 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          DB Navigator
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Databases */}
        <NavigationItem
          icon={Database}
          label="Databases"
          count={databases.length}
          onAdd={onCreateDatabase}
          expanded={expandedSections.databases}
          onToggle={() => toggleSection('databases')}
        >
          <div className="space-y-1">
            {databases.map(db => (
              <div key={db.id} onClick={() => onDatabaseSelect(db.id)} className="cursor-pointer">
                <ItemRow
                  item={db}
                  type="database"
                  selected={db.id === currentDatabase}
                  onEdit={onEditItem}
                  onDelete={onDeleteItem}
                />
              </div>
            ))}
          </div>
        </NavigationItem>

        {/* Tables */}
        <NavigationItem
          icon={Table}
          label="Tables"
          count={tables.length}
          onAdd={onCreateTable}
          expanded={expandedSections.tables}
          onToggle={() => toggleSection('tables')}
        >
          <div className="space-y-1">
            {tables.map(table => (
              <ItemRow
                key={table.id}
                item={table}
                type="table"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>

        {/* Indexes */}
        <NavigationItem
          icon={ListTree}
          label="Indexes"
          count={indexes.length}
          onAdd={onCreateIndex}
          expanded={expandedSections.indexes}
          onToggle={() => toggleSection('indexes')}
        >
          <div className="space-y-1">
            {indexes.map(index => (
              <ItemRow
                key={index.id}
                item={index}
                type="index"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>

        {/* Views */}
        <NavigationItem
          icon={Eye}
          label="Views"
          count={views.length}
          onAdd={onCreateView}
          expanded={expandedSections.views}
          onToggle={() => toggleSection('views')}
        >
          <div className="space-y-1">
            {views.map(view => (
              <ItemRow
                key={view.id}
                item={view}
                type="view"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>

        {/* Stored Procedures */}
        <NavigationItem
          icon={Settings}
          label="Procedures"
          count={procedures.length}
          onAdd={onCreateProcedure}
          expanded={expandedSections.procedures}
          onToggle={() => toggleSection('procedures')}
        >
          <div className="space-y-1">
            {procedures.map(proc => (
              <ItemRow
                key={proc.id}
                item={proc}
                type="procedure"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>

        {/* Triggers */}
        <NavigationItem
          icon={Zap}
          label="Triggers"
          count={triggers.length}
          onAdd={onCreateTrigger}
          expanded={expandedSections.triggers}
          onToggle={() => toggleSection('triggers')}
        >
          <div className="space-y-1">
            {triggers.map(trigger => (
              <ItemRow
                key={trigger.id}
                item={trigger}
                type="trigger"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>

        {/* Users */}
        <NavigationItem
          icon={Users}
          label="Users"
          count={users.length}
          onAdd={onCreateUser}
          expanded={expandedSections.users}
          onToggle={() => toggleSection('users')}
        >
          <div className="space-y-1">
            {users.map(user => (
              <ItemRow
                key={user.id}
                item={{ id: user.id, name: user.username, host: user.host }}
                type="user"
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </NavigationItem>
      </div>
    </div>
  );
};
