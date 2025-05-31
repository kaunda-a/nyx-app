import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  profilesApi,
  Profile,
  ProfileCreate,
  ProfileUpdate,
  ProfileStats,
  FingerprintData,
  ProxyConfig
} from '../api';
import { proxiesApi, ProxyResponse } from '../api';

// Define filter and pagination types
export interface ProfileFilters {

  search?: string;
  os?: string;
  browser?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  hasProxy?: boolean;
}

// Define launch options type
export interface ProfileLaunchOptions {
  headless?: boolean;
  useProxy?: boolean;
  geoip?: boolean;
  humanize?: boolean;
}

// Define profile context state
interface ProfileContextState {
  profiles: Profile[];
  selectedProfile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  filters: ProfileFilters;
  proxies: ProxyResponse[];
  activeProfiles: Record<string, {
    isRunning: boolean;
    hasProxy: boolean;
    launchTime?: Date;
  }>;

  // Profile CRUD operations
  createProfile: (data: ProfileCreate) => Promise<Profile>;
  updateProfile: (id: string, data: ProfileUpdate) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<void>;
  getProfile: (id: string) => Promise<Profile>;

  // Profile actions
  launchProfile: (id: string, options?: ProfileLaunchOptions) => Promise<Record<string, any>>;
  closeBrowser: (id: string) => Promise<Record<string, any>>;
  getFingerprint: (id: string) => Promise<FingerprintData>;
  getProfileStats: (id: string) => Promise<ProfileStats>;

  // Proxy operations
  assignProxyToProfile: (profileId: string, proxyId?: string) => Promise<void>;
  removeProxyFromProfile: (profileId: string) => Promise<void>;

  // UI state
  setFilters: (filters: ProfileFilters) => void;
  selectProfile: (profile: Profile | null) => void;

  // Refetch data
  refetchProfiles: () => Promise<void>;
  refetchProxies: () => Promise<void>;
}

// Create the context
const ProfileContext = createContext<ProfileContextState | undefined>(undefined);

// Create a provider component
export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [filters, setFilters] = useState<ProfileFilters>({
    sortBy: 'updated_at',
    sortOrder: 'desc'
  });
  const [activeProfiles, setActiveProfiles] = useState<Record<string, {
    isRunning: boolean;
    hasProxy: boolean;
    launchTime?: Date;
  }>>({});

  // Queries
  const {
    data: profiles = [],
    isLoading: isLoadingProfiles,
    error: profilesError,
    refetch: refetchProfilesQuery
  } = useQuery({
    queryKey: ['profiles', filters],
    queryFn: async () => {
      const allProfiles = await profilesApi.list();

      // Apply filters
      return allProfiles.filter(profile => {
        // Search filter
        if (filters.search && !profile.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }

        // OS filter
        if (filters.os && profile.config.os !== filters.os) {
          return false;
        }

        // Browser filter
        if (filters.browser && profile.config.browser !== filters.browser) {
          return false;
        }

        // Proxy filter
        if (filters.hasProxy !== undefined) {
          const hasProxy = !!profile.config.proxy;
          if (filters.hasProxy !== hasProxy) {
            return false;
          }
        }

        return true;
      }).sort((a, b) => {
        // Sort by the specified field
        const sortBy = filters.sortBy || 'updated_at';
        const sortOrder = filters.sortOrder || 'desc';

        // Handle different field types
        if (sortBy === 'name') {
          return sortOrder === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        }

        // Date fields
        if (sortBy === 'created_at' || sortBy === 'updated_at') {
          const aDate = new Date(a[sortBy] || 0).getTime();
          const bDate = new Date(b[sortBy] || 0).getTime();
          return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
        }

        return 0;
      });
    }
  });

  const {
    data: proxies = [],
    refetch: refetchProxiesQuery
  } = useQuery({
    queryKey: ['proxies'],
    queryFn: () => proxiesApi.list()
  });

  // Mutations
  const createProfileMutation = useMutation({
    mutationFn: (data: ProfileCreate) => profilesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Profile created',
        description: 'The profile has been created successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProfileUpdate }) =>
      profilesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Profile updated',
        description: 'The profile has been updated successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: string) => profilesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast({
        title: 'Profile deleted',
        description: 'The profile has been deleted successfully.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const assignProxyMutation = useMutation({
    mutationFn: ({ profileId, proxyId }: { profileId: string; proxyId?: string }) =>
      proxiesApi.assignToProfile(profileId, proxyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['proxies'] });
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
  const createProfile = useCallback(async (data: ProfileCreate) => {
    // Create profile on the server first
    const profile = await createProfileMutation.mutateAsync(data);

    // Note: Additional metadata storage can be added here if needed
    // For now, we rely on the server-side storage

    return profile;
  }, [createProfileMutation]);

  const updateProfile = useCallback(async (id: string, data: ProfileUpdate) => {
    // Update profile on the server first
    const profile = await updateProfileMutation.mutateAsync({ id, data });

    // Note: Additional metadata updates can be added here if needed
    // For now, we rely on the server-side storage

    return profile;
  }, [updateProfileMutation]);

  const deleteProfile = useCallback(async (id: string) => {
    // Delete profile on the server first
    await deleteProfileMutation.mutateAsync(id);

    // Note: Additional cleanup can be added here if needed
    // For now, we rely on the server-side deletion
  }, [deleteProfileMutation]);

  const getProfile = useCallback(async (id: string) => {
    return profilesApi.get(id);
  }, []);

  const launchProfile = useCallback(async (id: string, options: ProfileLaunchOptions = {}) => {
    try {
      // Call the API with the correct parameters
      const result = await profilesApi.launch(id, {
        headless: options.headless ?? false,
        useProxy: options.useProxy ?? true,
        geoip: options.geoip,
        humanize: options.humanize
      });

      // Update active profiles state
      setActiveProfiles(prev => ({
        ...prev,
        [id]: {
          isRunning: true,
          hasProxy: result.has_proxy || false,
          launchTime: new Date()
        }
      }));

      // Note: Status updates can be added here if needed
      // For now, we rely on the server-side status management

      toast({
        title: 'Profile launched',
        description: 'The browser has been launched successfully.',
        variant: 'default'
      });

      return result;
    } catch (error) {
      toast({
        title: 'Failed to launch profile',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const closeBrowser = useCallback(async (id: string) => {
    try {
      const result = await profilesApi.closeBrowser(id);

      // Update active profiles state
      setActiveProfiles(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      // Note: Status updates can be added here if needed
      // For now, we rely on the server-side status management

      toast({
        title: 'Browser closed',
        description: 'The browser has been closed successfully.',
        variant: 'default'
      });

      return result;
    } catch (error) {
      toast({
        title: 'Failed to close browser',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const getFingerprint = useCallback(async (id: string) => {
    // Get fingerprint from server
    const fingerprint = await profilesApi.getFingerprint(id);

    // Note: Fingerprint storage can be added here if needed
    // For now, we rely on the server-side storage

    return fingerprint;
  }, []);

  const getProfileStats = useCallback(async (id: string) => {
    return profilesApi.getStats(id);
  }, []);

  const assignProxyToProfile = useCallback(async (profileId: string, proxyId?: string) => {
    await assignProxyMutation.mutateAsync({ profileId, proxyId });
  }, [assignProxyMutation]);

  const removeProxyFromProfile = useCallback(async (profileId: string) => {
    // To remove a proxy, we update the profile with an empty proxy config
    await updateProfileMutation.mutateAsync({
      id: profileId,
      data: {
        config: {
          proxy: null
        }
      }
    });
  }, [updateProfileMutation]);

  const refetchProfiles = useCallback(async () => {
    await refetchProfilesQuery();
  }, [refetchProfilesQuery]);

  const refetchProxies = useCallback(async () => {
    await refetchProxiesQuery();
  }, [refetchProxiesQuery]);

  const selectProfile = useCallback((profile: Profile | null) => {
    setSelectedProfile(profile);
  }, []);

  // Context value
  const value: ProfileContextState = {
    profiles,
    selectedProfile,
    isLoading: isLoadingProfiles,
    error: profilesError as Error,
    filters,
    proxies,
    activeProfiles,

    // Profile CRUD operations
    createProfile,
    updateProfile,
    deleteProfile,
    getProfile,

    // Profile actions
    launchProfile,
    closeBrowser,
    getFingerprint,
    getProfileStats,

    // Proxy operations
    assignProxyToProfile,
    removeProxyFromProfile,

    // UI state
    setFilters,
    selectProfile,

    // Refetch data
    refetchProfiles,
    refetchProxies
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Create a hook to use the context
export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};