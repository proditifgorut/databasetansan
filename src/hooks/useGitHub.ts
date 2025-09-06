import { useState, useCallback } from 'react';
import { Octokit } from 'octokit';
import { toast } from 'react-hot-toast';
import { ProjectData } from '../types';

export const useGitHub = () => {
  const [octokit, setOctokit] = useState<Octokit | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const connect = useCallback(async (token: string) => {
    if (!token) {
      toast.error('Personal Access Token is required.');
      return;
    }
    setIsLoading(true);
    try {
      const client = new Octokit({ auth: token });
      const { data: userData } = await client.rest.users.getAuthenticated();
      setOctokit(client);
      setUser(userData);
      setIsConnected(true);
      toast.success(`Connected to GitHub as ${userData.login}!`);
    } catch (e) {
      toast.error('Failed to connect to GitHub. Check your token.');
      setIsConnected(false);
      setOctokit(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setOctokit(null);
    setIsConnected(false);
    setUser(null);
    toast.success('Disconnected from GitHub.');
  }, []);

  const listRepos = useCallback(async () => {
    if (!octokit) return [];
    setIsLoading(true);
    try {
      const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser);
      return repos;
    } catch (e) {
      toast.error('Failed to fetch repositories.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [octokit]);

  const saveProjectToRepo = useCallback(async (repoFullName: string, path: string, projectData: ProjectData) => {
    if (!octokit) throw new Error('Not connected to GitHub');
    
    const [owner, repo] = repoFullName.split('/');
    const content = Buffer.from(JSON.stringify(projectData, null, 2)).toString('base64');
    
    setIsLoading(true);
    try {
      let sha;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path });
        if ('sha' in fileData) {
            sha = fileData.sha;
        }
      } catch (error: any) {
        if (error.status !== 404) throw error;
      }

      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `feat: Update SQL Architect project - ${new Date().toISOString()}`,
        content,
        sha,
      });
    } finally {
      setIsLoading(false);
    }
  }, [octokit]);

  const loadProjectFromRepo = useCallback(async (repoFullName: string, path: string): Promise<ProjectData | null> => {
    if (!octokit) throw new Error('Not connected to GitHub');

    const [owner, repo] = repoFullName.split('/');
    setIsLoading(true);
    try {
        const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
        if ('content' in data) {
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            return JSON.parse(fileContent);
        }
        return null;
    } finally {
        setIsLoading(false);
    }
  }, [octokit]);

  return {
    octokit,
    isConnected,
    isLoading,
    user,
    connect,
    disconnect,
    listRepos,
    saveProjectToRepo,
    loadProjectFromRepo,
  };
};
