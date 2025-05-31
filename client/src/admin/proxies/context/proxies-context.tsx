import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  proxiesApi,
  ProxyResponse,
  ProxyCreate,
  ProxyUpdate
} from '../api';

// Define filter and pagination types
export interface ProxyFilters {
  search?: string;
  protocol?: string;
  status?: string;
  country?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Define proxy context state
interface ProxyContextState {
  proxies: ProxyResponse[];
  selectedProxy: ProxyResponse | null;
  isLoading: boolean;
  error: Error | null;
  filters: ProxyFilters;

  // Proxy CRUD operations
  createProxy: (data: ProxyCreate) => Promise<ProxyResponse>;
  updateProxy: (id: string, data: ProxyUpdate) => Promise<ProxyResponse>;
  deleteProxy: (id: string) => Promise<void>;
  getProxy: (id: string) => Promise<ProxyResponse>;

  // Proxy actions
  checkProxyHealth: (id: string) => Promise<Record<string, any>>;
  assignProxyToProfile: (profileId: string, proxyId?: string, country?: string) => Promise<void>;

  // UI state
  setFilters: (filters: ProxyFilters) => void;
  selectProxy: (proxy: ProxyResponse | null) => void;

  // Refetch data
  refetchProxies: () => Promise<void>;
}

// Create the context
const ProxyContext = createContext<ProxyContextState | undefined>(undefined);

// Create a provider component
export const ProxiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [selectedProxy, setSelectedProxy] = useState<ProxyResponse | null>(null);
  const [filters, setFilters] = useState<ProxyFilters>({
    sortBy: 'host',
    sortOrder: 'asc'
  });

  // Queries
  const {
    data: proxies = [],
    isLoading: isLoadingProxies,
    error: proxiesError,
    refetch: refetchProxiesQuery
  } = useQuery({
    queryKey: ['proxies', filters],
    queryFn: async () => {
      const allProxies = await proxiesApi.list();

      // Apply filters
      return allProxies.filter(proxy => {
        // Search filter
        if (filters.search && !proxy.host.toLowerCase().includes(filters.search.toLowerCase()) &&
            !proxy.port.toString().includes(filters.search) &&
            !proxy.geolocation?.country?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        // Protocol filter
        if (filters.protocol && proxy.protocol !== filters.protocol) {
          return false;
        }

        // Status filter
        if (filters.status && proxy.status !== filters.status) {
          return false;
        }

        // Country filter
        if (filters.country && proxy.geolocation?.country !== filters.country) {
          return false;
        }

        return true;
      }).sort((a, b) => {
        // Sort by the specified field
        const sortBy = filters.sortBy || 'host';
        const sortOrder = filters.sortOrder || 'asc';

        // Handle different field types
        if (sortBy === 'host') {
          return sortOrder === 'asc'
            ? a.host.localeCompare(b.host)
            : b.host.localeCompare(a.host);
        }

        if (sortBy === 'port') {
          return sortOrder === 'asc' ? a.port - b.port : b.port - a.port;
        }

        if (sortBy === 'protocol') {
          return sortOrder === 'asc'
            ? a.protocol.localeCompare(b.protocol)
            : b.protocol.localeCompare(a.protocol);
        }

        if (sortBy === 'status') {
          return sortOrder === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }

        if (sortBy === 'response_time') {
          return sortOrder === 'asc'
            ? a.average_response_time - b.average_response_time
            : b.average_response_time - a.average_response_time;
        }

        return 0;
      });
    }
  });

  // Mutations
  const createProxyMutation = useMutation({
    mutationFn: (data: ProxyCreate) => proxiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast({
        title: 'Proxy created',
        description: 'The proxy has been created successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create proxy',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateProxyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProxyUpdate }) =>
      proxiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast({
        title: 'Proxy updated',
        description: 'The proxy has been updated successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update proxy',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteProxyMutation = useMutation({
    mutationFn: (id: string) => proxiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      toast({
        title: 'Proxy deleted',
        description: 'The proxy has been deleted successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete proxy',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const assignProxyMutation = useMutation({
    mutationFn: ({ profileId, proxyId, country }: { profileId: string; proxyId?: string; country?: string }) =>
      proxiesApi.assignToProfile(profileId, proxyId, country),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Proxy assigned',
        description: 'The proxy has been assigned to the profile successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to assign proxy',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handler functions
  const createProxy = useCallback(async (data: ProxyCreate) => {
    return await createProxyMutation.mutateAsync(data);
  }, [createProxyMutation]);

  const updateProxy = useCallback(async (id: string, data: ProxyUpdate) => {
    return await updateProxyMutation.mutateAsync({ id, data });
  }, [updateProxyMutation]);

  const deleteProxy = useCallback(async (id: string) => {
    await deleteProxyMutation.mutateAsync(id);
  }, [deleteProxyMutation]);

  const getProxy = useCallback(async (id: string) => {
    return proxiesApi.get(id);
  }, []);

  const checkProxyHealth = useCallback(async (id: string) => {
    try {
      const result = await proxiesApi.checkHealth(id);

      // Refresh the proxies list to get updated status
      queryClient.invalidateQueries({ queryKey: ['proxies'] });

      toast({
        title: 'Proxy health check completed',
        description: result.message || 'Health check completed successfully.',
        variant: 'default'
      });

      return result;
    } catch (error) {
      toast({
        title: 'Health check failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      throw error;
    }
  }, [queryClient, toast]);

  const assignProxyToProfile = useCallback(async (profileId: string, proxyId?: string, country?: string) => {
    await assignProxyMutation.mutateAsync({ profileId, proxyId, country });
  }, [assignProxyMutation]);

  const refetchProxies = useCallback(async () => {
    await refetchProxiesQuery();
  }, [refetchProxiesQuery]);

  const selectProxy = useCallback((proxy: ProxyResponse | null) => {
    setSelectedProxy(proxy);
  }, []);

  // Context value
  const value: ProxyContextState = {
    proxies,
    selectedProxy,
    isLoading: isLoadingProxies,
    error: proxiesError as Error,
    filters,

    // Proxy CRUD operations
    createProxy,
    updateProxy,
    deleteProxy,
    getProxy,

    // Proxy actions
    checkProxyHealth,
    assignProxyToProfile,

    // UI state
    setFilters,
    selectProxy,

    // Refetch data
    refetchProxies
  };

  return (
    <ProxyContext.Provider value={value}>
      {children}
    </ProxyContext.Provider>
  );
};

// Create a hook to use the context
export const useProxies = () => {
  const context = useContext(ProxyContext);
  if (context === undefined) {
    throw new Error('useProxies must be used within a ProxiesProvider');
  }
  return context;
};