import { useState, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export const useSupabase = () => {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connect = useCallback(async (projectUrl: string, anonKey: string) => {
    if (!projectUrl || !anonKey) {
      toast.error('Project URL and Anon Key are required.');
      return;
    }

    setIsLoading(true);
    try {
      const client = createClient(projectUrl, anonKey);
      
      // Test connection by fetching a small amount of data
      const { error } = await client.from('tables').select('id').limit(1);

      // Supabase returns an error if the 'tables' table doesn't exist, but that's ok.
      // We just want to see if the credentials are valid. A specific auth error is what we check for.
      if (error && (error.message.includes('Invalid API key') || error.message.includes('failed to fetch'))) {
        throw new Error(error.message);
      }
      
      setSupabaseClient(client);
      setIsConnected(true);
      toast.success('Successfully connected to Supabase!');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Connection failed: ${errorMessage}`);
      setIsConnected(false);
      setSupabaseClient(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setSupabaseClient(null);
    setIsConnected(false);
    toast.success('Disconnected from Supabase.');
  }, []);

  return {
    supabaseClient,
    isConnected,
    isLoading,
    connect,
    disconnect,
  };
};
