import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Inline API client to avoid import issues during build
const getApiUrl = (): string => {
  const runtimeApiUrl = window.localStorage.getItem('RUNTIME_API_URL');
  if (runtimeApiUrl) return runtimeApiUrl;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'http://localhost:8080';
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) supabase.auth.signOut();
    return Promise.reject(error);
  }
);

// Types
export interface ProxyCreate {
  host: string;
  port: number;
  protocol: string;
  username?: string;
  password?: string;
  verify?: boolean;
}

export interface ProxyResponse {
  id: string;
  host: string;
  port: number;
  protocol: string;
  username?: string;
  status: string;
  failure_count: number;
  success_count: number;
  average_response_time: number;
  assigned_profiles: string[];
  geolocation?: Record<string, any>;
  ip?: string;
}

export interface ProxyAssignmentResponse {
  profile_id: string;
  proxy_id: string;
  success: boolean;
  message: string;
}

/**
 * Proxies API client for interacting with the proxies endpoints
 */
export const proxiesApi = {
  /**
   * Get a list of all proxies
   */
  list: async (): Promise<ProxyResponse[]> => {
    return api.get('/api/proxies');
  },

  /**
   * Create a new proxy
   * 
   * @param proxyData - The proxy data to create
   */
  create: async (proxyData: ProxyCreate): Promise<ProxyResponse> => {
    return api.post('/api/proxies', proxyData);
  },

  /**
   * Get a specific proxy by ID
   * 
   * @param proxyId - The ID of the proxy to get
   */
  get: async (proxyId: string): Promise<ProxyResponse> => {
    return api.get(`/api/proxies/${proxyId}`);
  },

  /**
   * Check if a proxy is working properly
   * 
   * @param proxyId - The ID of the proxy to check
   */
  checkHealth: async (proxyId: string): Promise<Record<string, any>> => {
    return api.post(`/api/proxies/${proxyId}/check`);
  },

  /**
   * Assign a proxy to a profile
   * 
   * @param profileId - The ID of the profile to assign the proxy to
   * @param proxyId - The ID of the proxy to assign (optional)
   * @param country - The country code for geolocation (optional)
   */
  assignToProfile: async (
    profileId: string,
    proxyId?: string,
    country?: string
  ): Promise<ProxyAssignmentResponse> => {
    let url = `/api/proxies/assign?profile_id=${profileId}`;
    
    if (proxyId) {
      url += `&proxy_id=${proxyId}`;
    }
    
    if (country) {
      url += `&country=${country}`;
    }
    
    return api.post(url);
  },

  /**
   * Delete a proxy
   * 
   * @param proxyId - The ID of the proxy to delete
   */
  delete: async (proxyId: string): Promise<{ success: boolean }> => {
    return api.delete(`/api/proxies/${proxyId}`);
  }
};
