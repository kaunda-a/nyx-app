import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { NumberDetails, Message, NumberCreateData } from '../types'

// Inline API client to avoid import issues during build
const getApiUrl = () => {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'
  return serverUrl
}

// Inline supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token from Supabase to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      supabase.auth.signOut()
    }
    return Promise.reject(error)
  }
)

interface ExportOptions {
  format: 'csv' | 'json'
  numbers: NumberDetails[]
}

interface VerifyOptions {
  service?: string
}

export const numbersApi = {
  list: () => 
    api.get<NumberDetails[]>('/api/numbers'),
  
  getMessages: (numberId: string) => 
    api.get<Message[]>(`/api/numbers/${numberId}/messages`),
  
  release: (numberId: string) => 
    api.delete(`/api/numbers/${numberId}`),
  
  export: ({ format, numbers }: ExportOptions) => 
    api.post('/api/numbers/export', 
      { format, numbers }, 
      { responseType: 'blob' }
    ),

  verify: (numberId: string, options: VerifyOptions = {}) =>
    api.post(`/api/numbers/${numberId}/verify`, {
      service: options.service || 'default'
    }),

  refresh: (numberId: string) =>
    api.post(`/api/numbers/${numberId}/refresh`),

  acquire: (data: NumberCreateData) =>
    api.post<NumberDetails>('/api/numbers/acquire', data)
}
