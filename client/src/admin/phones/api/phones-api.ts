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
import {
  deviceListSchema,
  virtualDeviceSchema,
  type VirtualDevice,
  type CreateDeviceInput,
  type Protection,
  type DeviceStatus
} from '../data/schema'

// Define the DeviceSpecs interface based on the schema
interface DeviceSpecs {
  cpu: number
  memory: number
  storage: number
}

interface UpdateDeviceInput {
  name?: string
  status?: DeviceStatus
  specs?: Partial<DeviceSpecs>
  protection?: Partial<Protection>
}

export const phonesApi = {
  // Core Device Operations
  getDevices: async () => {
    const response = await api.get<VirtualDevice[]>('/api/phones/devices')
    return deviceListSchema.parse(response)
  },

  getDevice: async (id: string) => {
    const response = await api.get<VirtualDevice>(`/api/phones/devices/${id}`)
    return virtualDeviceSchema.parse(response)
  },

  createDevice: async (input: CreateDeviceInput) => {
    const response = await api.post<VirtualDevice>('/api/phones/devices', input)
    return virtualDeviceSchema.parse(response)
  },

  updateDevice: async (id: string, input: UpdateDeviceInput) => {
    const response = await api.patch<VirtualDevice>(`/api/phones/devices/${id}`, input)
    return virtualDeviceSchema.parse(response)
  },

  deleteDevice: async (id: string) => {
    await api.delete(`/api/phones/devices/${id}`)
  },

  // Device Status Operations
  startDevice: async (id: string) => {
    return phonesApi.updateDevice(id, { status: 'running' })
  },

  stopDevice: async (id: string) => {
    return phonesApi.updateDevice(id, { status: 'stopped' })
  },

  getDeviceStatus: async (id: string) => {
    return api.get<{
      status: DeviceStatus
      systemCheck: boolean
      containerRunning: boolean
      initStatus: boolean
    }>(`/api/phones/devices/${id}/status`)
  },

  // Protection and Specs Updates
  updateDeviceProtection: async (id: string, protection: Partial<Protection>) => {
    return phonesApi.updateDevice(id, { protection })
  },

  updateDeviceSpecs: async (id: string, specs: Partial<DeviceSpecs>) => {
    return phonesApi.updateDevice(id, { specs })
  },

  // App Operations
  installApp: async (id: string, appUrl: string) => {
    await api.post(`/api/phones/devices/${id}/apps`, { appUrl })
  },

  launchApp: async (id: string, packageName: string) => {
    await api.post(`/api/phones/devices/${id}/apps/${packageName}/launch`)
  },

  // Screenshot
  takeScreenshot: async (id: string) => {
    const response = await api.post<{ screenshotUrl: string }>(`/api/phones/devices/${id}/screenshot`)
    return response.screenshotUrl
  },

  // Device Control
  controlDevice: async (id: string, action: string, params?: Record<string, any>) => {
    await api.post(`/api/phones/devices/${id}/control`, { action, params })
  },

  // Catalog Operations
  getAndroidPhones: async (manufacturer?: string) => {
    return api.get(`/api/phones/catalog/android-phones${manufacturer ? `?manufacturer=${manufacturer}` : ''}`)
  },

  getAndroidVersions: async () => {
    return api.get('/api/phones/catalog/android-versions')
  },

  getScreenResolutions: async () => {
    return api.get('/api/phones/catalog/screen-resolutions')
  },

  getRandomDevice: async () => {
    return api.get('/api/phones/catalog/random-device')
  },

  // Network Configuration
  configureNetwork: async (id: string, proxyId?: string) => {
    return api.post(`/api/phones/devices/${id}/network`, { proxy_id: proxyId })
  }
}
