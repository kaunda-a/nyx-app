/**
 * Server Status Component
 * Shows server connection status and provides controls
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  RefreshCw, 
  Play, 
  FolderOpen, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Inline server health and config functions to avoid import issues during build
const isTauriApp = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

const getApiUrl = (): string => {
  const runtimeApiUrl = window.localStorage.getItem('RUNTIME_API_URL');
  if (runtimeApiUrl) return runtimeApiUrl;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'http://localhost:8080';
};

interface ServerStatus {
  isRunning: boolean;
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

const checkServerHealth = async (timeout = 5000): Promise<ServerStatus> => {
  const startTime = Date.now();
  const apiUrl = getApiUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { isRunning: true, responseTime, lastChecked: new Date() };
    } else {
      return {
        isRunning: false,
        error: `Server responded with status ${response.status}`,
        lastChecked: new Date()
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isRunning: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date()
    };
  }
};

const waitForServer = async (
  maxAttempts = 30,
  intervalMs = 1000,
  onProgress?: (attempt: number, status: ServerStatus) => void
): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await checkServerHealth();

    if (onProgress) {
      onProgress(attempt, status);
    }

    if (status.isRunning) {
      return true;
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return false;
};

export function ServerStatusComponent() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Check server health
  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const status = await checkServerHealth();
      setServerStatus(status);
    } catch (error) {
      console.error('Error checking server health:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Start server (Tauri only)
  const startServer = async () => {
    if (!isTauriApp()) {
      toast({
        variant: 'destructive',
        title: 'Not available',
        description: 'Server management is only available in the desktop app'
      });
      return;
    }

    setIsStarting(true);
    try {
      const result = await invoke<string>('start_server');
      toast({
        title: 'Server starting',
        description: result
      });

      // Wait for server to become available
      const isRunning = await waitForServer(30, 2000, (attempt, status) => {
        console.log(`Waiting for server... Attempt ${attempt}`);
      });

      if (isRunning) {
        toast({
          title: 'Server started successfully',
          description: 'The server is now running and ready to accept connections'
        });
        await checkHealth();
      } else {
        toast({
          variant: 'destructive',
          title: 'Server start timeout',
          description: 'The server was started but did not respond within the expected time'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to start server',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Open server folder (Tauri only)
  const openServerFolder = async () => {
    if (!isTauriApp()) {
      toast({
        variant: 'destructive',
        title: 'Not available',
        description: 'This feature is only available in the desktop app'
      });
      return;
    }

    try {
      await invoke('open_server_folder');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to open folder',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Initial health check
  useEffect(() => {
    checkHealth();
    
    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (!serverStatus) {
      return <Badge variant="outline">Unknown</Badge>;
    }

    if (serverStatus.isRunning) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Running
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Not Running
        </Badge>
      );
    }
  };

  const getStatusIcon = () => {
    if (!serverStatus) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }

    return serverStatus.isRunning ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Server Status
        </CardTitle>
        <CardDescription>
          Monitor and manage the backend server connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">
              {serverStatus?.isRunning ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Response Time */}
        {serverStatus?.responseTime && (
          <div className="text-sm text-muted-foreground">
            Response time: {serverStatus.responseTime}ms
          </div>
        )}

        {/* Last Checked */}
        {serverStatus?.lastChecked && (
          <div className="text-sm text-muted-foreground">
            Last checked: {serverStatus.lastChecked.toLocaleTimeString()}
          </div>
        )}

        {/* Error Message */}
        {serverStatus?.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {serverStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Check Status
          </Button>

          {isTauriApp() && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={startServer}
                disabled={isStarting || serverStatus?.isRunning}
              >
                <Play className={`h-4 w-4 mr-2 ${isStarting ? 'animate-pulse' : ''}`} />
                {isStarting ? 'Starting...' : 'Start Server'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={openServerFolder}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Open Folder
              </Button>
            </>
          )}
        </div>

        {/* Instructions for non-Tauri environments */}
        {!isTauriApp() && !serverStatus?.isRunning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              To start the server manually, run: <code className="bg-muted px-1 rounded">python main.py</code> in the server directory
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
