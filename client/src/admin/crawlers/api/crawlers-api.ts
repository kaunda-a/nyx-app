import { CrawlerDetails, CrawlerSchedule } from '../types';
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

// Types that match the server implementation
export interface CrawlerTask {
  task_id?: string;
  task_type: 'web' | 'youtube' | 'social';
  url?: string;
  instructions: string;
  profile_id?: string;
  max_duration?: number;
  parameters?: Record<string, any>;
  created_at?: string;
  status?: string;
}

export interface CrawlerResult {
  task_id: string;
  success: boolean;
  result?: any;
  error?: string;
  screenshots?: string[];
  completed_at?: string;
}

// Real API implementation that matches the server routes
export const crawlersApi = {
  // Create a new crawler task
  createTask: async (task: CrawlerTask): Promise<{ task_id: string; status: string }> => {
    return api.post('/crawlers/tasks', task);
  },

  // Get a task by ID
  getTask: async (taskId: string): Promise<CrawlerTask> => {
    return api.get(`/crawlers/tasks/${taskId}`);
  },

  // Get task result
  getTaskResult: async (taskId: string): Promise<CrawlerResult | { status: string; task_id: string }> => {
    return api.get(`/crawlers/tasks/${taskId}/result`);
  },

  // List all tasks
  listTasks: async (): Promise<CrawlerTask[]> => {
    return api.get('/crawlers/tasks');
  },

  // Cancel a task
  cancelTask: async (taskId: string): Promise<{ status: string; task_id: string }> => {
    return api.delete(`/crawlers/tasks/${taskId}`);
  },

  // Execute a crawler task directly and wait for result
  executeCrawler: async (
    instructions: string,
    url?: string,
    profile_id?: string,
    task_type: 'web' | 'youtube' | 'social' = 'web'
  ): Promise<{ task_id: string; success: boolean; result?: any; error?: string }> => {
    return api.post('/crawlers/execute', {
      instructions,
      url,
      profile_id,
      task_type
    });
  },

  // Check the health of the crawler service
  healthCheck: async (): Promise<{
    status: string;
    dependencies: {
      browser_use: boolean;
      google_generativeai: boolean;
    };
    active_tasks: number;
    completed_tasks: number;
    total_tasks: number;
  }> => {
    return api.get('/crawlers/health');
  },

  // Legacy API methods for backward compatibility
  list: async (): Promise<{ data: CrawlerDetails[] }> => {
    const tasks = await crawlersApi.listTasks();
    const crawlers = tasks.map(task => taskToCrawler(task));
    return { data: crawlers };
  },

  get: async (id: string): Promise<{ data: CrawlerDetails }> => {
    const task = await crawlersApi.getTask(id);
    return { data: taskToCrawler(task) as CrawlerDetails };
  },

  create: async (crawler: Omit<CrawlerDetails, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: CrawlerDetails }> => {
    const task: CrawlerTask = {
      task_type: crawler.type === 'social' ? 'social' : 'web',
      url: crawler.targets[0]?.url,
      instructions: crawler.description || 'No instructions provided',
      profile_id: crawler.profile?.id,
      parameters: {
        headless: false,
        max_iterations: 15,
        verbose: true
      }
    };

    const result = await crawlersApi.createTask(task);

    return {
      data: {
        ...crawler,
        id: result.task_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as CrawlerDetails
    };
  },

  update: async (_id: string, _crawler: Partial<CrawlerDetails>): Promise<{ data: CrawlerDetails }> => {
    // Not directly supported by the API, would need to create a new task
    throw new Error('Not implemented in the current API');
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    await crawlersApi.cancelTask(id);
    return { success: true };
  },

  start: async (id: string): Promise<{ success: boolean }> => {
    const task = await crawlersApi.getTask(id);
    await crawlersApi.createTask(task);
    return { success: true };
  },

  pause: async (_id: string): Promise<{ success: boolean }> => {
    // Not directly supported by the API
    return { success: false };
  },

  stop: async (id: string): Promise<{ success: boolean }> => {
    await crawlersApi.cancelTask(id);
    return { success: true };
  },

  schedule: async (_id: string, _schedule: CrawlerSchedule): Promise<{ success: boolean }> => {
    // Not directly supported by the API
    return { success: false };
  },

  getStats: async (): Promise<{ data: any }> => {
    const health = await crawlersApi.healthCheck();
    return {
      data: {
        totalCrawlers: health.total_tasks || 0,
        activeCrawlers: health.active_tasks || 0,
        totalPagesVisited: 0,
        totalClicks: 0,
        totalImpressions: 0,
        totalAdClicks: 0,
        totalTimeSpent: 0,
        averageBounceRate: 0,
        averageConversionRate: 0,
        averageErrorRate: 0
      }
    };
  },

  getPerformance: async (id: string): Promise<{ data: any }> => {
    const result = await crawlersApi.getTaskResult(id);
    return {
      data: {
        pagesVisited: 0,
        clicksGenerated: 0,
        impressions: 0,
        adClicks: 0,
        timeSpent: 0,
        bounceRate: 0,
        conversionRate: 0,
        errorRate: 0,
        result: result
      }
    };
  }
};

// Helper function to convert server task to client crawler format
export const taskToCrawler = (task: CrawlerTask) => {
  return {
    id: task.task_id || '',
    name: `Task ${task.task_id?.substring(0, 8) || ''}`,
    description: task.instructions,
    type: mapTaskTypeToClientType(task.task_type),
    status: mapTaskStatusToClientStatus(task.status || 'pending'),
    targets: [
      {
        url: task.url || '',
        platform: mapTaskTypeToPlatform(task.task_type),
        maxDepth: task.parameters?.max_depth || 3,
        maxPages: task.parameters?.max_pages || 10
      }
    ],
    profile: task.profile_id ? { id: task.profile_id, name: `Profile ${task.profile_id}` } : undefined,
    createdAt: task.created_at || new Date().toISOString(),
    updatedAt: task.created_at || new Date().toISOString(),
    performance: {
      pagesVisited: 0,
      clicksGenerated: 0,
      impressions: 0,
      adClicks: 0,
      timeSpent: 0,
      bounceRate: 0,
      conversionRate: 0,
      errorRate: 0
    },
    behavior: 'human',
    schedule: {
      frequency: 'once',
      startTime: new Date().toISOString(),
      timezone: 'UTC'
    },
    tags: []
  };
};

// Helper functions to map server types to client types
function mapTaskTypeToClientType(taskType: string) {
  switch (taskType) {
    case 'youtube':
      return 'social';
    case 'social':
      return 'social';
    case 'web':
    default:
      return 'search';
  }
}

function mapTaskStatusToClientStatus(status: string) {
  switch (status) {
    case 'running':
      return 'active';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'stopped';
    case 'pending':
    default:
      return 'scheduled';
  }
}

function mapTaskTypeToPlatform(taskType: string) {
  switch (taskType) {
    case 'youtube':
      return 'youtube';
    case 'social':
      return 'custom';
    case 'web':
    default:
      return 'google';
  }
}
