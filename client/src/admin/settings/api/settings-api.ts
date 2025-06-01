import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Inline API client to avoid import issues during build
const getApiUrl = (): string => {
  // Try runtime configuration first
  const runtimeApiUrl = window.localStorage.getItem('RUNTIME_API_URL');
  if (runtimeApiUrl) {
    return runtimeApiUrl;
  }

  // Try build-time environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Default fallback
  return 'http://localhost:8080';
};

// Inline supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token from Supabase to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

/**
 * Types for security-focused user account settings
 */
export interface UserAccount {
  user_id: string;
  username: string;
  email: string;
  two_factor_enabled: boolean;
  login_notifications: boolean;
  security_alerts: boolean;
  failed_login_alerts: boolean;
  session_timeout_minutes: number;
  max_failed_logins: number;
  account_locked: boolean;
  locked_until?: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  password_changed_at?: string;
}

export interface AccountCreate {
  username: string;
  email: string;
  password: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface NotificationSettings {
  login_notifications?: boolean;
  security_alerts?: boolean;
  failed_login_alerts?: boolean;
}

export interface TwoFactorSetup {
  status: string;
  secret: string;
  backup_codes: string[];
  qr_code_url: string;
}

export interface TwoFactorDisable {
  verification_code: string;
}

export interface TwoFactorVerify {
  code: string;
}

export interface AccountDelete {
  password: string;
  confirmation: string;
}

export interface BackupData {
  backup_data: any;
  exported_at: string;
}

export interface SecurityEvent {
  user_id: string;
  event_type: string;
  details: any;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface SecurityAnalytics {
  total_accounts: number;
  two_factor_enabled: number;
  two_factor_disabled: number;
  accounts_with_security_notifications: number;
  recent_password_changes: number;
  recent_logins: number;
  recent_security_events?: number;
}

/**
 * API client for security-focused user account settings
 *
 * This handles all server API calls related to user account security,
 * authentication, and account management.
 */
export const settingsApi = {
  // ===== CORE ACCOUNT METHODS =====

  /**
   * Create a new user account
   */
  createAccount: async (account: AccountCreate): Promise<UserAccount> => {
    const response = await api.post<UserAccount>('/api/settings/account', account);
    return response.data;
  },

  /**
   * Get user account information
   */
  getAccount: async (): Promise<UserAccount> => {
    const response = await api.get<UserAccount>('/api/settings/account');
    return response.data;
  },

  /**
   * Delete user account
   */
  deleteAccount: async (deleteRequest: AccountDelete): Promise<{ status: string; user_id: string }> => {
    const response = await api.delete<{ status: string; user_id: string }>('/api/settings/account', {
      data: deleteRequest
    });
    return response.data;
  },

  // ===== PASSWORD MANAGEMENT =====

  /**
   * Change user password
   */
  changePassword: async (passwordChange: PasswordChange): Promise<{ status: string; message: string }> => {
    const response = await api.put<{ status: string; message: string }>('/api/settings/password', passwordChange);
    return response.data;
  },

  // ===== TWO-FACTOR AUTHENTICATION =====

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor: async (): Promise<TwoFactorSetup> => {
    const response = await api.post<TwoFactorSetup>('/api/settings/2fa/enable');
    return response.data;
  },

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor: async (disableRequest: TwoFactorDisable): Promise<{ status: string; message: string }> => {
    const response = await api.post<{ status: string; message: string }>('/api/settings/2fa/disable', disableRequest);
    return response.data;
  },

  /**
   * Verify two-factor authentication code
   */
  verifyTwoFactor: async (verifyRequest: TwoFactorVerify): Promise<{ valid: boolean }> => {
    const response = await api.post<{ valid: boolean }>('/api/settings/2fa/verify', verifyRequest);
    return response.data;
  },

  // ===== NOTIFICATION SETTINGS =====

  /**
   * Update security notification settings
   */
  updateNotifications: async (notifications: NotificationSettings): Promise<{ status: string; message: string }> => {
    const response = await api.put<{ status: string; message: string }>('/api/settings/notifications', notifications);
    return response.data;
  },

  // ===== ACCOUNT BACKUP/RESTORE =====

  /**
   * Get account backup data
   */
  getAccountBackup: async (apiKey: string): Promise<BackupData> => {
    const response = await api.get<BackupData>(`/api/settings/backup?api_key=${apiKey}`);
    return response.data;
  },

  /**
   * Restore account from backup
   */
  restoreAccount: async (backupData: any, newPassword: string): Promise<{ status: string; message: string; user_id: string }> => {
    const response = await api.post<{ status: string; message: string; user_id: string }>('/api/settings/restore', {
      backup_data: backupData,
      new_password: newPassword
    });
    return response.data;
  },

  // ===== SECURITY MONITORING =====

  /**
   * Get security events for the user
   */
  getSecurityEvents: async (limit: number = 50): Promise<SecurityEvent[]> => {
    const response = await api.get<SecurityEvent[]>(`/api/settings/security/events?limit=${limit}`);
    return response.data;
  },

  /**
   * Get security analytics (admin only)
   */
  getSecurityAnalytics: async (): Promise<SecurityAnalytics> => {
    const response = await api.get<SecurityAnalytics>('/api/settings/security/analytics');
    return response.data;
  },
};
