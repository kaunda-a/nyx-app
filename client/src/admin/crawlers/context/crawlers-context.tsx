import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CrawlerDetails, CrawlerStatus, CrawlerType, CrawlerBehavior, TargetPlatform } from '../types';
import { crawlersApi, taskToCrawler, CrawlerTask } from '../api/crawlers-api';

// Default performance metrics for new crawlers
const DEFAULT_PERFORMANCE = {
  pagesVisited: 0,
  clicksGenerated: 0,
  impressions: 0,
  adClicks: 0,
  timeSpent: 0,
  bounceRate: 0,
  conversionRate: 0,
  errorRate: 0
};

// Sample data for fallback when API is not available
const SAMPLE_CRAWLERS: CrawlerDetails[] = [
  {
    id: 'crawler-1',
    name: 'Google Search Crawler',
    description: 'Crawls Google search results for specific keywords',
    type: CrawlerType.SEARCH,
    status: CrawlerStatus.ACTIVE,
    behavior: CrawlerBehavior.HUMAN,
    targets: [
      {
        url: 'https://www.google.com',
        platform: TargetPlatform.GOOGLE,
        keywords: ['anti-detection browser', 'browser fingerprinting', 'privacy tools'],
        maxDepth: 3,
        maxPages: 50
      }
    ],
    schedule: {
      frequency: 'daily',
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 1250,
      clicksGenerated: 320,
      impressions: 4500,
      adClicks: 85,
      timeSpent: 18600, // 5 hours and 10 minutes
      bounceRate: 0.25,
      conversionRate: 0.12,
      errorRate: 0.03
    },
    tags: ['search', 'google', 'seo'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  },
  {
    id: 'crawler-2',
    name: 'Facebook Engagement Bot',
    description: 'Automates engagement on Facebook posts and groups',
    type: CrawlerType.SOCIAL,
    status: CrawlerStatus.PAUSED,
    behavior: CrawlerBehavior.BALANCED,
    targets: [
      {
        url: 'https://www.facebook.com',
        platform: TargetPlatform.FACEBOOK,
        keywords: ['digital marketing', 'social media strategy', 'facebook ads'],
        maxDepth: 2,
        maxPages: 30
      }
    ],
    schedule: {
      frequency: 'daily',
      startTime: '10:00',
      endTime: '22:00',
      daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 850,
      clicksGenerated: 420,
      impressions: 3200,
      adClicks: 65,
      timeSpent: 14400, // 4 hours
      bounceRate: 0.18,
      conversionRate: 0.15,
      errorRate: 0.02
    },
    tags: ['social', 'facebook', 'engagement'],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  },
  {
    id: 'crawler-3',
    name: 'Amazon Product Scraper',
    description: 'Scrapes product information and reviews from Amazon',
    type: CrawlerType.ECOMMERCE,
    status: CrawlerStatus.SCHEDULED,
    behavior: CrawlerBehavior.STEALTH,
    targets: [
      {
        url: 'https://www.amazon.com',
        platform: TargetPlatform.AMAZON,
        keywords: ['gaming laptop', 'mechanical keyboard', 'gaming mouse'],
        maxDepth: 4,
        maxPages: 100
      }
    ],
    schedule: {
      frequency: 'weekly',
      startTime: '00:00',
      endTime: '06:00',
      daysOfWeek: ['Sunday'],
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 2100,
      clicksGenerated: 540,
      impressions: 6800,
      adClicks: 120,
      timeSpent: 25200, // 7 hours
      bounceRate: 0.15,
      conversionRate: 0.18,
      errorRate: 0.01
    },
    tags: ['ecommerce', 'amazon', 'product-research'],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  },
  {
    id: 'crawler-4',
    name: 'YouTube View Generator',
    description: 'Generates views and engagement on YouTube videos',
    type: CrawlerType.SOCIAL,
    status: CrawlerStatus.ACTIVE,
    behavior: CrawlerBehavior.HUMAN,
    targets: [
      {
        url: 'https://www.youtube.com',
        platform: TargetPlatform.YOUTUBE,
        keywords: ['tech reviews', 'product unboxing', 'tutorials'],
        maxDepth: 3,
        maxPages: 80
      }
    ],
    schedule: {
      frequency: 'daily',
      startTime: '08:00',
      endTime: '23:00',
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 1800,
      clicksGenerated: 950,
      impressions: 7500,
      adClicks: 210,
      timeSpent: 32400, // 9 hours
      bounceRate: 0.22,
      conversionRate: 0.14,
      errorRate: 0.02
    },
    tags: ['social', 'youtube', 'views'],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  },
  {
    id: 'crawler-5',
    name: 'News Aggregator',
    description: 'Aggregates news from various sources',
    type: CrawlerType.NEWS,
    status: CrawlerStatus.ERROR,
    behavior: CrawlerBehavior.AGGRESSIVE,
    targets: [
      {
        url: 'https://news.google.com',
        platform: TargetPlatform.CUSTOM,
        keywords: ['technology', 'business', 'science'],
        maxDepth: 5,
        maxPages: 200
      }
    ],
    schedule: {
      frequency: 'hourly',
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 4500,
      clicksGenerated: 1200,
      impressions: 9800,
      adClicks: 320,
      timeSpent: 43200, // 12 hours
      bounceRate: 0.28,
      conversionRate: 0.09,
      errorRate: 0.15
    },
    tags: ['news', 'aggregator', 'content'],
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  },
  {
    id: 'crawler-6',
    name: 'TikTok Trend Analyzer',
    description: 'Analyzes trending content on TikTok',
    type: CrawlerType.SOCIAL,
    status: CrawlerStatus.COMPLETED,
    behavior: CrawlerBehavior.BALANCED,
    targets: [
      {
        url: 'https://www.tiktok.com',
        platform: TargetPlatform.TIKTOK,
        keywords: ['trending', 'viral', 'challenge'],
        maxDepth: 3,
        maxPages: 150
      }
    ],
    schedule: {
      frequency: 'weekly',
      startTime: '12:00',
      endTime: '18:00',
      daysOfWeek: ['Monday', 'Thursday'],
      timezone: 'UTC',
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    performance: {
      pagesVisited: 3200,
      clicksGenerated: 1800,
      impressions: 12000,
      adClicks: 450,
      timeSpent: 36000, // 10 hours
      bounceRate: 0.20,
      conversionRate: 0.16,
      errorRate: 0.04
    },
    tags: ['social', 'tiktok', 'trends'],
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'admin'
  }
];

interface CrawlersContextType {
  crawlers: CrawlerDetails[];
  loading: boolean;
  error: string | null;
  selectedCrawler: CrawlerDetails | null;
  modalType: 'create' | 'edit' | 'view' | 'delete' | 'duplicate' | null;
  fetchCrawlers: () => Promise<void>;
  createCrawler: (crawler: Omit<CrawlerDetails, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCrawler: (id: string, crawler: Partial<CrawlerDetails>) => Promise<void>;
  deleteCrawler: (id: string) => Promise<void>;
  duplicateCrawler: (id: string) => Promise<void>;
  startCrawler: (id: string) => Promise<void>;
  pauseCrawler: (id: string) => Promise<void>;
  stopCrawler: (id: string) => Promise<void>;
  scheduleCrawler: (id: string, schedule: CrawlerDetails['schedule']) => Promise<void>;
  setSelectedCrawler: (crawler: CrawlerDetails | null) => void;
  setModalType: (type: 'create' | 'edit' | 'view' | 'delete' | 'duplicate' | null) => void;
  healthCheck: () => Promise<{
    status: string;
    dependencies: {
      browser_use: boolean;
      google_generativeai: boolean;
    };
    active_tasks: number;
    completed_tasks: number;
    total_tasks: number;
  }>;
}

const CrawlersContext = createContext<CrawlersContextType | undefined>(undefined);

export function CrawlersProvider({ children }: { children: ReactNode }) {
  const [crawlers, setCrawlers] = useState<CrawlerDetails[]>(SAMPLE_CRAWLERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrawler, setSelectedCrawler] = useState<CrawlerDetails | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view' | 'delete' | 'duplicate' | null>(null);

  // Fetch crawlers
  const fetchCrawlers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch from the API first
      try {
        const tasks = await crawlersApi.listTasks();
        if (tasks && tasks.length > 0) {
          const convertedCrawlers = tasks.map(task => {
            const crawler = taskToCrawler(task);
            return {
              ...crawler,
              behavior: CrawlerBehavior.HUMAN,
              performance: DEFAULT_PERFORMANCE,
              schedule: {
                frequency: 'once',
                startTime: new Date().toISOString(),
                timezone: 'UTC'
              },
              tags: []
            } as CrawlerDetails;
          });

          setCrawlers(convertedCrawlers);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('Failed to fetch from API, falling back to sample data', apiError);
      }

      // Fallback to sample data if API fails
      setCrawlers(SAMPLE_CRAWLERS);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch crawlers');
      setLoading(false);
    }
  }, []);

  // Create crawler
  const createCrawler = useCallback(async (crawler: Omit<CrawlerDetails, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      // Convert client crawler to server task
      const task: CrawlerTask = {
        task_type: crawler.type === CrawlerType.SOCIAL ? 'social' : 'web',
        url: crawler.targets[0]?.url,
        instructions: crawler.description || 'No instructions provided',
        profile_id: crawler.profile?.id,
        parameters: {
          headless: false,
          max_iterations: 15,
          verbose: true
        }
      };

      try {
        // Create task on server
        const result = await crawlersApi.createTask(task);

        // Create a new crawler with the task ID
        const newCrawler: CrawlerDetails = {
          ...crawler,
          id: result.task_id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setCrawlers(prev => [...prev, newCrawler]);
        setLoading(false);
        return Promise.resolve();
      } catch (apiError) {
        console.warn('API call failed, falling back to mock implementation', apiError);

        // Fallback to mock implementation
        const newCrawler: CrawlerDetails = {
          ...crawler,
          id: `crawler-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setCrawlers(prev => [...prev, newCrawler]);
        setLoading(false);
        return Promise.resolve();
      }
    } catch (err) {
      setError('Failed to create crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Update crawler
  const updateCrawler = useCallback(async (id: string, crawler: Partial<CrawlerDetails>) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      setCrawlers(prev =>
        prev.map(c =>
          c.id === id
            ? { ...c, ...crawler, updatedAt: new Date().toISOString() }
            : c
        )
      );
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to update crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Delete crawler
  const deleteCrawler = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      try {
        // Cancel the task on the server
        await crawlersApi.cancelTask(id);
      } catch (apiError) {
        console.warn('API call failed, continuing with local state update', apiError);
      }

      // Remove from local state
      setCrawlers(prev => prev.filter(c => c.id !== id));
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to delete crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Duplicate crawler
  const duplicateCrawler = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      const crawler = crawlers.find(c => c.id === id);
      if (!crawler) {
        throw new Error('Crawler not found');
      }

      const newCrawler: CrawlerDetails = {
        ...crawler,
        id: `crawler-${Date.now()}`,
        name: `${crawler.name} (Copy)`,
        status: CrawlerStatus.STOPPED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCrawlers(prev => [...prev, newCrawler]);
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to duplicate crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, [crawlers]);

  // Start crawler - execute the task
  const startCrawler = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const crawler = crawlers.find(c => c.id === id);
      if (!crawler) {
        throw new Error('Crawler not found');
      }

      try {
        // Execute the task directly
        const task: CrawlerTask = {
          task_type: crawler.type === CrawlerType.SOCIAL ? 'social' : 'web',
          url: crawler.targets[0]?.url,
          instructions: crawler.description || 'No instructions provided',
          profile_id: crawler.profile?.id,
          parameters: {
            headless: false,
            max_iterations: 15,
            verbose: true
          }
        };

        // Create a new task
        await crawlersApi.createTask(task);
      } catch (apiError) {
        console.warn('API call failed, continuing with local state update', apiError);
      }

      // Update local state
      setCrawlers(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: CrawlerStatus.ACTIVE,
                updatedAt: new Date().toISOString(),
                lastRun: new Date().toISOString()
              }
            : c
        )
      );
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to start crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, [crawlers]);

  // Pause crawler
  const pauseCrawler = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      setCrawlers(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: CrawlerStatus.PAUSED,
                updatedAt: new Date().toISOString()
              }
            : c
        )
      );
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to pause crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Stop crawler - cancel the task
  const stopCrawler = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      try {
        // Cancel the task on the server
        await crawlersApi.cancelTask(id);
      } catch (apiError) {
        console.warn('API call failed, continuing with local state update', apiError);
      }

      // Update local state
      setCrawlers(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: CrawlerStatus.STOPPED,
                updatedAt: new Date().toISOString()
              }
            : c
        )
      );
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to stop crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Schedule crawler
  const scheduleCrawler = useCallback(async (id: string, schedule: CrawlerDetails['schedule']) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an API
      setCrawlers(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                schedule,
                status: CrawlerStatus.SCHEDULED,
                updatedAt: new Date().toISOString()
              }
            : c
        )
      );
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to schedule crawler');
      setLoading(false);
      return Promise.reject(err);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchCrawlers();
  }, [fetchCrawlers]);

  // Health check
  const healthCheck = useCallback(async () => {
    try {
      return await crawlersApi.healthCheck();
    } catch (err) {
      console.error('Health check failed', err);
      return {
        status: 'error',
        dependencies: {
          browser_use: false,
          google_generativeai: false
        },
        active_tasks: 0,
        completed_tasks: 0,
        total_tasks: 0
      };
    }
  }, []);

  const value = {
    crawlers,
    loading,
    error,
    selectedCrawler,
    modalType,
    fetchCrawlers,
    createCrawler,
    updateCrawler,
    deleteCrawler,
    duplicateCrawler,
    startCrawler,
    pauseCrawler,
    stopCrawler,
    scheduleCrawler,
    setSelectedCrawler,
    setModalType,
    healthCheck
  };

  return (
    <CrawlersContext.Provider value={value}>
      {children}
    </CrawlersContext.Provider>
  );
}

export function useCrawlers() {
  const context = useContext(CrawlersContext);
  if (context === undefined) {
    throw new Error('useCrawlers must be used within a CrawlersProvider');
  }
  return context;
}
