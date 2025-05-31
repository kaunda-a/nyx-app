import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  settingsApi,
  UserAccount,
  AccountCreate,
  PasswordChange,
  NotificationSettings,
  TwoFactorSetup,
  TwoFactorDisable,
  TwoFactorVerify,
  AccountDelete,
  SecurityEvent,
  SecurityAnalytics
} from '../api/settings-api';

// Define settings context state
interface SettingsContextState {
  account: UserAccount | null;
  securityEvents: SecurityEvent[];
  securityAnalytics: SecurityAnalytics | null;
  isLoading: boolean;
  error: Error | null;

  // Account CRUD operations
  createAccount: (data: AccountCreate) => Promise<UserAccount>;
  getAccount: () => Promise<UserAccount>;
  deleteAccount: (data: AccountDelete) => Promise<{ status: string; user_id: string }>;

  // Password management
  changePassword: (data: PasswordChange) => Promise<{ status: string; message: string }>;

  // Two-factor authentication
  enableTwoFactor: () => Promise<TwoFactorSetup>;
  disableTwoFactor: (data: TwoFactorDisable) => Promise<{ status: string; message: string }>;
  verifyTwoFactor: (data: TwoFactorVerify) => Promise<{ valid: boolean }>;

  // Notification settings
  updateNotifications: (data: NotificationSettings) => Promise<{ status: string; message: string }>;

  // Account backup/restore
  getAccountBackup: (apiKey: string) => Promise<any>;
  restoreAccount: (backupData: any, newPassword: string) => Promise<{ status: string; message: string; user_id: string }>;

  // Security monitoring
  loadSecurityEvents: (limit?: number) => Promise<void>;
  loadSecurityAnalytics: () => Promise<void>;

  // Refetch data
  refetchAccount: () => Promise<void>;
}

// Create the context
const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

// Create a provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityAnalytics, setSecurityAnalytics] = useState<SecurityAnalytics | null>(null);

  // Queries
  const {
    data: account = null,
    isLoading: isLoadingAccount,
    error: accountError,
    refetch: refetchAccountQuery
  } = useQuery({
    queryKey: ['settings', 'account'],
    queryFn: async () => {
      try {
        return await settingsApi.getAccount();
      } catch (error) {
        // Don't show toast for initial load failures (user might not be logged in)
        return null;
      }
    },
    retry: false
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: AccountCreate) => settingsApi.createAccount(data),
    onSuccess: () => {
      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Account Creation Failed',
        description: 'Failed to create account. Please check your information and try again.',
      });
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (data: AccountDelete) => settingsApi.deleteAccount(data),
    onSuccess: () => {
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
      queryClient.clear(); // Clear all queries since account is deleted
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Account Deletion Failed',
        description: 'Failed to delete account. Please verify your password and try again.',
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordChange) => settingsApi.changePassword(data),
    onSuccess: () => {
      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: 'Failed to change password. Please verify your current password and try again.',
      });
    }
  });

  const enableTwoFactorMutation = useMutation({
    mutationFn: () => settingsApi.enableTwoFactor(),
    onSuccess: () => {
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '2FA Setup Failed',
        description: 'Failed to enable two-factor authentication. Please try again.',
      });
    }
  });

  const disableTwoFactorMutation = useMutation({
    mutationFn: (data: TwoFactorDisable) => settingsApi.disableTwoFactor(data),
    onSuccess: () => {
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '2FA Disable Failed',
        description: 'Failed to disable 2FA. Please verify your authentication code and try again.',
      });
    }
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: (data: TwoFactorVerify) => settingsApi.verifyTwoFactor(data),
    onSuccess: (result) => {
      if (result.valid) {
        toast({
          title: '2FA Verified',
          description: 'Authentication code verified successfully.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Code',
          description: 'The authentication code is invalid or expired.',
        });
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: '2FA Verification Failed',
        description: 'Failed to verify authentication code. Please try again.',
      });
    }
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationSettings) => settingsApi.updateNotifications(data),
    onSuccess: () => {
      toast({
        title: 'Notifications Updated',
        description: 'Your notification preferences have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update notification settings. Please try again.',
      });
    }
  });

  // Handler functions
  const createAccount = useCallback(async (data: AccountCreate) => {
    return await createAccountMutation.mutateAsync(data);
  }, [createAccountMutation]);

  const getAccount = useCallback(async () => {
    if (account) {
      return account;
    }
    return await settingsApi.getAccount();
  }, [account]);

  const deleteAccount = useCallback(async (data: AccountDelete) => {
    return await deleteAccountMutation.mutateAsync(data);
  }, [deleteAccountMutation]);

  const changePassword = useCallback(async (data: PasswordChange) => {
    return await changePasswordMutation.mutateAsync(data);
  }, [changePasswordMutation]);

  const enableTwoFactor = useCallback(async () => {
    return await enableTwoFactorMutation.mutateAsync();
  }, [enableTwoFactorMutation]);

  const disableTwoFactor = useCallback(async (data: TwoFactorDisable) => {
    return await disableTwoFactorMutation.mutateAsync(data);
  }, [disableTwoFactorMutation]);

  const verifyTwoFactor = useCallback(async (data: TwoFactorVerify) => {
    return await verifyTwoFactorMutation.mutateAsync(data);
  }, [verifyTwoFactorMutation]);

  const updateNotifications = useCallback(async (data: NotificationSettings) => {
    return await updateNotificationsMutation.mutateAsync(data);
  }, [updateNotificationsMutation]);

  const getAccountBackup = useCallback(async (apiKey: string) => {
    try {
      const result = await settingsApi.getAccountBackup(apiKey);
      toast({
        title: 'Backup Retrieved',
        description: 'Your account backup has been generated successfully.',
      });
      return result.backup_data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Backup Failed',
        description: 'Failed to retrieve account backup. Please verify your API key.',
      });
      throw error;
    }
  }, [toast]);

  const restoreAccount = useCallback(async (backupData: any, newPassword: string) => {
    try {
      const result = await settingsApi.restoreAccount(backupData, newPassword);
      toast({
        title: 'Account Restored',
        description: 'Your account has been restored successfully from backup.',
      });
      queryClient.invalidateQueries({ queryKey: ['settings', 'account'] });
      return result;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: 'Failed to restore account. Please check your backup data and try again.',
      });
      throw error;
    }
  }, [queryClient, toast]);

  const loadSecurityEvents = useCallback(async (limit: number = 50) => {
    try {
      const events = await settingsApi.getSecurityEvents(limit);
      setSecurityEvents(events);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Load Events',
        description: 'Unable to fetch security events. Please try again.',
      });
      setSecurityEvents([]);
    }
  }, [toast]);

  const loadSecurityAnalytics = useCallback(async () => {
    try {
      const analytics = await settingsApi.getSecurityAnalytics();
      setSecurityAnalytics(analytics);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analytics Unavailable',
        description: 'Unable to fetch security analytics. Please try again.',
      });
      setSecurityAnalytics(null);
    }
  }, [toast]);

  const refetchAccount = useCallback(async () => {
    await refetchAccountQuery();
  }, [refetchAccountQuery]);

  // Context value
  const value: SettingsContextState = {
    account,
    securityEvents,
    securityAnalytics,
    isLoading: isLoadingAccount,
    error: accountError as Error,

    // Account CRUD operations
    createAccount,
    getAccount,
    deleteAccount,

    // Password management
    changePassword,

    // Two-factor authentication
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,

    // Notification settings
    updateNotifications,

    // Account backup/restore
    getAccountBackup,
    restoreAccount,

    // Security monitoring
    loadSecurityEvents,
    loadSecurityAnalytics,

    // Refetch data
    refetchAccount
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Create a hook to use the context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
