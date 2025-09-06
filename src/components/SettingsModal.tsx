import React, { useState, useMemo } from 'react';
import { X, Cloud, Github, Database, Copy, Check, ExternalLink } from 'lucide-react';
import { useSupabase } from '../hooks/useSupabase';
import { useGitHub } from '../hooks/useGitHub';
import { ProjectData } from '../types';
import { SQLGenerator } from '../utils/sqlGenerator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabase: ReturnType<typeof useSupabase>;
  github: ReturnType<typeof useGitHub>;
  projectData: ProjectData;
  onProjectLoad: (data: ProjectData) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  supabase,
  github,
  projectData,
  onProjectLoad
}) => {
  const [activeTab, setActiveTab] = useState('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showSql, setShowSql] = useState(false);
  const [copied, setCopied] = useState(false);

  const sqlCode = useMemo(() => {
    if (!showSql) return '';
    const generator = new SQLGenerator('postgresql'); // Supabase uses PostgreSQL
    return generator.generateFullSQL(projectData.tables, projectData.relationships);
  }, [showSql, projectData]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToGitHub = async () => {
    const repoName = prompt('Enter repository name (e.g., username/repo):');
    const filePath = prompt('Enter file path (e.g., sql-architect.json):', 'sql-architect.json');
    if (repoName && filePath) {
      try {
        await github.saveProjectToRepo(repoName, filePath, projectData);
        alert('Project saved successfully!');
      } catch (e) {
        alert(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  };
  
  const handleLoadFromGitHub = async () => {
    const repoName = prompt('Enter repository name (e.g., username/repo):');
    const filePath = prompt('Enter file path (e.g., sql-architect.json):', 'sql-architect.json');
    if (repoName && filePath) {
      try {
        const data = await github.loadProjectFromRepo(repoName, filePath);
        if (data) {
          onProjectLoad(data);
          alert('Project loaded successfully!');
          onClose();
        }
      } catch (e) {
        alert(`Failed to load: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'supabase', label: 'Supabase', icon: Database },
    { id: 'github', label: 'GitHub', icon: Github },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Cloud className="w-5 h-5" /> Integrations
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Connect to Supabase</h3>
              {supabase.isConnected ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-medium">Connected to Supabase project.</p>
                  <button
                    onClick={supabase.disconnect}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project-ref.supabase.co"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anon (public) Key</label>
                    <input
                      type="password"
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="your-anon-key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <button
                    onClick={() => supabase.connect(supabaseUrl, supabaseKey)}
                    disabled={supabase.isLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {supabase.isLoading ? 'Connecting...' : 'Connect to Supabase'}
                  </button>
                </div>
              )}

              {supabase.isConnected && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Sync Schema</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate the SQL for your current schema and run it in your Supabase project's SQL Editor.
                  </p>
                  <button
                    onClick={() => setShowSql(!showSql)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {showSql ? 'Hide' : 'Generate'} SQL Schema
                  </button>
                  {showSql && (
                    <div className="mt-4 p-4 bg-gray-900 text-white rounded-lg relative">
                      <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-gray-700 rounded-md hover:bg-gray-600">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <pre className="text-sm whitespace-pre-wrap font-mono">{sqlCode}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Connect to GitHub</h3>
              {github.isConnected ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-green-800 font-medium">Connected as {github.user?.login}.</p>
                  <button
                    onClick={github.disconnect}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                     <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1">
                        Generate a new token (with 'repo' scope) <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <button
                    onClick={() => github.connect(githubToken)}
                    disabled={github.isLoading}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-black disabled:opacity-50"
                  >
                    {github.isLoading ? 'Connecting...' : 'Connect to GitHub'}
                  </button>
                </div>
              )}

              {github.isConnected && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Repository Actions</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleSaveToGitHub}
                      disabled={github.isLoading}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      Save Project to Repo
                    </button>
                    <button
                      onClick={handleLoadFromGitHub}
                      disabled={github.isLoading}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      Load Project from Repo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
