import { useReducer, useCallback } from 'react';
import { 
  TableData, 
  RelationshipData, 
  ProjectData, 
  SQLDialect, 
  DatabaseData, 
  IndexData, 
  ViewData, 
  StoredProcedureData, 
  TriggerData, 
  UserData 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

const initialProjectState: ProjectData = {
  databases: [{
    id: 'default_db_id',
    name: 'default_db',
    charset: 'utf8mb4',
    collation: 'utf8mb4_general_ci'
  }],
  tables: [],
  relationships: [],
  indexes: [],
  views: [],
  procedures: [],
  triggers: [],
  users: [],
  name: 'SQL Architect Project',
  dialect: 'mysql',
  currentDatabase: 'default_db_id'
};

type ProjectAction =
  | { type: 'SET_PROJECT'; payload: ProjectData }
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_DIALECT'; payload: SQLDialect }
  | { type: 'SET_CURRENT_DATABASE'; payload: string }
  | { type: 'ADD_DATABASE'; payload: DatabaseData }
  | { type: 'ADD_TABLE'; payload: TableData }
  | { type: 'UPDATE_TABLE'; payload: TableData }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'UPDATE_TABLE_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'ADD_RELATIONSHIP'; payload: RelationshipData }
  | { type: 'UPDATE_RELATIONSHIP'; payload: RelationshipData }
  | { type: 'DELETE_RELATIONSHIP'; payload: string }
  | { type: 'ADD_INDEX'; payload: IndexData }
  | { type: 'ADD_VIEW'; payload: ViewData }
  | { type: 'ADD_PROCEDURE'; payload: StoredProcedureData }
  | { type: 'ADD_TRIGGER'; payload: TriggerData }
  | { type: 'ADD_USER'; payload: UserData }
  | { type: 'CLEAR_PROJECT' };

const projectReducer = (state: ProjectData, action: ProjectAction): ProjectData => {
  switch (action.type) {
    case 'SET_PROJECT':
      return action.payload;
    case 'SET_PROJECT_NAME':
      return { ...state, name: action.payload };
    case 'SET_DIALECT':
      return { ...state, dialect: action.payload };
    case 'SET_CURRENT_DATABASE':
      return { ...state, currentDatabase: action.payload };
    case 'ADD_DATABASE':
      return { ...state, databases: [...state.databases, action.payload] };
    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.payload] };
    case 'UPDATE_TABLE':
      return { ...state, tables: state.tables.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(t => t.id !== action.payload),
        relationships: state.relationships.filter(r => r.sourceTable !== action.payload && r.targetTable !== action.payload),
        indexes: state.indexes.filter(i => i.tableId !== action.payload),
        triggers: state.triggers.filter(t => t.tableId !== action.payload),
      };
    case 'UPDATE_TABLE_POSITION':
      return { ...state, tables: state.tables.map(t => t.id === action.payload.id ? { ...t, position: action.payload.position } : t) };
    case 'ADD_RELATIONSHIP': {
      const newState = { ...state, relationships: [...state.relationships, action.payload] };
      // Automatically mark the column as a foreign key
      const targetTable = newState.tables.find(t => t.id === action.payload.targetTable);
      if (targetTable) {
        targetTable.columns = targetTable.columns.map(c => 
          c.id === action.payload.targetColumn 
            ? { ...c, isForeignKey: true, referencesTable: action.payload.sourceTable, referencesColumn: action.payload.sourceColumn }
            : c
        );
      }
      return newState;
    }
    case 'UPDATE_RELATIONSHIP':
      return { ...state, relationships: state.relationships.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RELATIONSHIP': {
      const relToDelete = state.relationships.find(r => r.id === action.payload);
      const newState = { ...state, relationships: state.relationships.filter(r => r.id !== action.payload) };
      // Unset foreign key properties
      if (relToDelete) {
        const targetTable = newState.tables.find(t => t.id === relToDelete.targetTable);
        if (targetTable) {
          targetTable.columns = targetTable.columns.map(c => 
            c.id === relToDelete.targetColumn 
              ? { ...c, isForeignKey: false, referencesTable: undefined, referencesColumn: undefined }
              : c
          );
        }
      }
      return newState;
    }
    case 'ADD_INDEX':
      return { ...state, indexes: [...state.indexes, action.payload] };
    case 'ADD_VIEW':
      return { ...state, views: [...state.views, action.payload] };
    case 'ADD_PROCEDURE':
      return { ...state, procedures: [...state.procedures, action.payload] };
    case 'ADD_TRIGGER':
      return { ...state, triggers: [...state.triggers, action.payload] };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'CLEAR_PROJECT':
      return initialProjectState;
    default:
      return state;
  }
};

export const useProject = () => {
  const [project, dispatch] = useReducer(projectReducer, initialProjectState);

  const setProjectName = useCallback((name: string) => dispatch({ type: 'SET_PROJECT_NAME', payload: name }), []);
  const setDialect = useCallback((dialect: SQLDialect) => dispatch({ type: 'SET_DIALECT', payload: dialect }), []);
  const setCurrentDatabase = useCallback((id: string) => dispatch({ type: 'SET_CURRENT_DATABASE', payload: id }), []);

  const addDatabase = useCallback((db: Omit<DatabaseData, 'id'>) => {
    const newDb = { ...db, id: uuidv4() };
    dispatch({ type: 'ADD_DATABASE', payload: newDb });
    return newDb;
  }, []);

  const addTable = useCallback((position: { x: number; y: number }) => {
    const newTable: TableData = {
      id: uuidv4(),
      name: 'new_table',
      columns: [],
      position,
      engine: 'InnoDB',
      charset: 'utf8mb4',
      collation: 'utf8mb4_general_ci'
    };
    dispatch({ type: 'ADD_TABLE', payload: newTable });
    return newTable;
  }, []);
  
  const updateTable = useCallback((table: TableData) => dispatch({ type: 'UPDATE_TABLE', payload: table }), []);
  const deleteTable = useCallback((id: string) => dispatch({ type: 'DELETE_TABLE', payload: id }), []);
  const updateTablePosition = useCallback((id: string, position: { x: number; y: number }) => dispatch({ type: 'UPDATE_TABLE_POSITION', payload: { id, position } }), []);

  const addRelationship = useCallback((rel: Omit<RelationshipData, 'id'>) => {
    const newRel = { ...rel, id: uuidv4() };
    dispatch({ type: 'ADD_RELATIONSHIP', payload: newRel });
    return newRel;
  }, []);
  const updateRelationship = useCallback((rel: RelationshipData) => dispatch({ type: 'UPDATE_RELATIONSHIP', payload: rel }), []);
  const deleteRelationship = useCallback((id: string) => dispatch({ type: 'DELETE_RELATIONSHIP', payload: id }), []);

  const addIndex = useCallback((index: Omit<IndexData, 'id'>) => {
    const newIndex = { ...index, id: uuidv4() };
    dispatch({ type: 'ADD_INDEX', payload: newIndex });
    return newIndex;
  }, []);

  const addView = useCallback((view: Omit<ViewData, 'id'>) => {
    const newView = { ...view, id: uuidv4() };
    dispatch({ type: 'ADD_VIEW', payload: newView });
    return newView;
  }, []);

  const addProcedure = useCallback((proc: Omit<StoredProcedureData, 'id'>) => {
    const newProc = { ...proc, id: uuidv4() };
    dispatch({ type: 'ADD_PROCEDURE', payload: newProc });
    return newProc;
  }, []);

  const addTrigger = useCallback((trigger: Omit<TriggerData, 'id'>) => {
    const newTrigger = { ...trigger, id: uuidv4() };
    dispatch({ type: 'ADD_TRIGGER', payload: newTrigger });
    return newTrigger;
  }, []);

  const addUser = useCallback((user: Omit<UserData, 'id'>) => {
    const newUser = { ...user, id: uuidv4() };
    dispatch({ type: 'ADD_USER', payload: newUser });
    return newUser;
  }, []);
  
  const exportProject = useCallback((): ProjectData => project, [project]);
  const importProject = useCallback((data: ProjectData) => dispatch({ type: 'SET_PROJECT', payload: data }), []);
  const clearProject = useCallback(() => dispatch({ type: 'CLEAR_PROJECT' }), []);

  return {
    project,
    setProjectName,
    setDialect,
    setCurrentDatabase,
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
    exportProject,
    importProject,
    clearProject,
  };
};
