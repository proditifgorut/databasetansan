import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Toaster, toast } from 'react-hot-toast';
import { Menu, Github, Cloud, Link } from 'lucide-react';

import { TableNode } from './components/TableNode';
import { AdvancedTableEditor } from './components/AdvancedTableEditor';
import { SQLCodePanel } from './components/SQLCodePanel';
import { NavigationPanel } from './components/NavigationPanel';
import { QueryEditor } from './components/QueryEditor';
import { SettingsModal } from './components/SettingsModal';
import { RelationshipEditorModal } from './components/RelationshipEditorModal';
import { useProject } from './hooks/useProject';
import { useSupabase } from './hooks/useSupabase';
import { useGitHub } from './hooks/useGitHub';
import { TableData, RelationshipData } from './types';
import { SQLGenerator } from './utils/sqlGenerator';

const nodeTypes = {
  table: TableNode,
};

function App() {
  const {
    project,
    addDatabase,
    addTable,
    updateTable,
    deleteTable,
    updateTablePosition,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    addIndex,
    addView,
    addProcedure,
    addTrigger,
    addUser,
    setProjectName,
    setDialect,
    setCurrentDatabase,
    exportProject,
    importProject
  } = useProject();

  const {
    databases,
    tables,
    relationships,
    indexes,
    views,
    procedures,
    triggers,
    users,
    projectName,
    dialect,
    currentDatabase,
  } = project;

  const supabase = useSupabase();
  const github = useGitHub();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<Partial<RelationshipData> | null>(null);
  const [isTableEditorOpen, setIsTableEditorOpen] = useState(false);
  const [isRelationshipEditorOpen, setIsRelationshipEditorOpen] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [showQueryEditor, setShowQueryEditor] = useState(false);
  const [showNavigationPanel, setShowNavigationPanel] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Convert tables to nodes
  React.useEffect(() => {
    const newNodes: Node[] = tables.map(table => ({
      id: table.id,
      type: 'table',
      position: table.position,
      data: {
        name: table.name,
        columns: table.columns,
        onEdit: () => {
          setEditingTable(table);
          setIsTableEditorOpen(true);
        }
      }
    }));
    setNodes(newNodes);
  }, [tables, setNodes]);

  // Convert relationships to edges
  React.useEffect(() => {
    const newEdges: Edge[] = relationships.map(rel => ({
      id: rel.id,
      source: rel.sourceTable,
      target: rel.targetTable,
      sourceHandle: rel.sourceColumn,
      targetHandle: rel.targetColumn,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
      label: rel.type === 'one-to-many' ? '1:N' : '1:1',
      data: rel,
      style: { strokeWidth: 2, stroke: '#6b7280' },
    }));
    setEdges(newEdges);
  }, [relationships, setEdges]);
  
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    changes.forEach(change => {
      if (change.type === 'position' && change.position && !change.dragging) {
        updateTablePosition(change.id, change.position);
      }
    });
  }, [onNodesChange, updateTablePosition]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target && connection.sourceHandle && connection.targetHandle) {
      setEditingRelationship({
        sourceTable: connection.source,
        targetTable: connection.target,
        sourceColumn: connection.sourceHandle,
        targetColumn: connection.targetHandle,
      });
      setIsRelationshipEditorOpen(true);
    }
  }, []);

  const handleAddTable = useCallback(() => {
    const position = { x: Math.random() * 500 + 100, y: Math.random() * 300 + 100 };
    const newTable = addTable(position);
    setEditingTable(newTable);
    setIsTableEditorOpen(true);
  }, [addTable]);

  const handleSaveTable = useCallback((table: TableData) => {
    updateTable(table);
    toast.success('Table saved successfully!');
  }, [updateTable]);
  
  const handleDeleteTable = useCallback((tableId: string) => {
    deleteTable(tableId);
    toast.success('Table deleted successfully!');
  }, [deleteTable]);

  const handleSaveRelationship = useCallback((relationship: RelationshipData) => {
    if (relationship.id) {
      updateRelationship(relationship);
      toast.success('Relationship updated successfully!');
    } else {
      addRelationship(relationship);
      toast.success('Relationship created successfully!');
    }
  }, [addRelationship, updateRelationship]);

  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    deleteRelationship(relationshipId);
    toast.success('Relationship deleted successfully!');
  }, [deleteRelationship]);

  const handleExportSQL = useCallback(() => {
    const generator = new SQLGenerator(dialect);
    const sql = generator.generateFullSQL(tables, relationships);
    
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('SQL exported successfully!');
  }, [tables, relationships, dialect, projectName]);

  const handleExportJSON = useCallback(() => {
    const projectData = exportProject();
    const json = JSON.stringify(projectData, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Project exported successfully!');
  }, [exportProject, projectName]);

  const handleImportJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        importProject(projectData);
        toast.success('Project imported successfully!');
      } catch (error) {
        toast.error('Failed to import project. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }, [importProject]);

  const handleExecuteQuery = useCallback(async (query: string) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    if (query.toLowerCase().includes('select')) {
      return [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Smith' }];
    }
    return 'Query executed successfully';
  }, []);

  const handleNavigationAction = useCallback((type: string, item?: any) => {
    switch (type) {
      case 'createDatabase':
        const dbName = prompt('Enter database name:');
        if (dbName) {
          addDatabase({ name: dbName, charset: 'utf8mb4', collation: 'utf8mb4_general_ci' });
          toast.success('Database created!');
        }
        break;
      case 'createTable':
        handleAddTable();
        break;
      case 'edit':
        if (item.type === 'table') {
          setEditingTable(item.data);
          setIsTableEditorOpen(true);
        }
        break;
      case 'delete':
        if (item.type === 'table' && confirm(`Are you sure you want to delete table "${item.data.name}"?`)) {
          handleDeleteTable(item.data.id);
        }
        break;
    }
  }, [addDatabase, handleAddTable, handleDeleteTable]);

  const onEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    setEditingRelationship(edge.data);
    setIsRelationshipEditorOpen(true);
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Toaster position="top-right" toastOptions={{
          className: 'dark:bg-gray-700 dark:text-white',
        }} />
        
        {showNavigationPanel && (
          <NavigationPanel
            databases={databases}
            tables={tables}
            indexes={indexes}
            views={views}
            procedures={procedures}
            triggers={triggers}
            users={users}
            currentDatabase={currentDatabase || ''}
            onDatabaseSelect={(id) => setCurrentDatabase(id)}
            onCreateDatabase={() => handleNavigationAction('createDatabase')}
            onCreateTable={() => handleNavigationAction('createTable')}
            onCreateIndex={() => toast.info('Index editor coming soon!')}
            onCreateView={() => toast.info('View editor coming soon!')}
            onCreateProcedure={() => toast.info('Procedure editor coming soon!')}
            onCreateTrigger={() => toast.info('Trigger editor coming soon!')}
            onCreateUser={() => toast.info('User management coming soon!')}
            onEditItem={(type, item) => handleNavigationAction('edit', { type, data: item })}
            onDeleteItem={(type, item) => handleNavigationAction('delete', { type, data: item })}
          />
        )}

        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNavigationPanel(!showNavigationPanel)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300"
              >
                <Menu className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-xl font-bold text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {databases.find(db => db.id === currentDatabase)?.name || 'No DB selected'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                Integrations
              </button>
              <button
                onClick={() => setShowQueryEditor(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                SQL Editor
              </button>
              <button
                onClick={() => setShowCodePanel(!showCodePanel)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  showCodePanel 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                View Code
              </button>
            </div>
          </div>

          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-50 dark:bg-gray-800/50"
            >
              <Background />
              <Controls />
              <MiniMap 
                nodeStrokeWidth={3}
                nodeColor={(node) => (node.type === 'table' ? '#3b82f6' : '#64748b')}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              
              <Panel position="bottom-center" className="bg-white dark:bg-gray-700 rounded-lg shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-600">
                <div className="text-center flex items-center gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {tables.length} table{tables.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                    {dialect.toUpperCase()}
                  </p>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        <AdvancedTableEditor
          table={editingTable}
          isOpen={isTableEditorOpen}
          onClose={() => {
            setIsTableEditorOpen(false);
            setEditingTable(null);
          }}
          onSave={handleSaveTable}
          onDelete={editingTable ? () => handleDeleteTable(editingTable.id) : undefined}
          dialect={dialect}
        />

        {editingRelationship && (
          <RelationshipEditorModal
            isOpen={isRelationshipEditorOpen}
            onClose={() => {
              setIsRelationshipEditorOpen(false);
              setEditingRelationship(null);
            }}
            onSave={handleSaveRelationship}
            onDelete={handleDeleteRelationship}
            relationship={editingRelationship}
            tables={tables}
          />
        )}

        <SQLCodePanel
          tables={tables}
          relationships={relationships}
          dialect={dialect}
          isOpen={showCodePanel}
          onClose={() => setShowCodePanel(false)}
        />

        <QueryEditor
          dialect={dialect}
          onExecuteQuery={handleExecuteQuery}
          isOpen={showQueryEditor}
          onClose={() => setShowQueryEditor(false)}
        />
        
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          supabase={supabase}
          github={github}
          projectData={exportProject()}
          onProjectLoad={importProject}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
