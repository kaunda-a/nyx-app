import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { IconRefresh, IconCamera, IconDeviceMobile } from '@tabler/icons-react'
// Inline WebSocket service to avoid import issues during build
enum MessageType {
  PHONE_SCREEN = 'phone_screen',
  PHONE_CONTROL = 'phone_control',
}

enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  debug?: boolean;
}

const useWebSocket = (url: string, options: WebSocketOptions = {}) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  const connect = (token?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus(ConnectionStatus.CONNECTING);
    const wsUrl = token ? `${url}?token=${token}` : url;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => setStatus(ConnectionStatus.CONNECTED);
    wsRef.current.onclose = () => setStatus(ConnectionStatus.DISCONNECTED);
    wsRef.current.onerror = () => setStatus(ConnectionStatus.ERROR);
    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const listeners = listenersRef.current.get(message.type) || [];
        listeners.forEach(listener => listener(message));
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
    setStatus(ConnectionStatus.DISCONNECTED);
  };

  const send = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const on = (type: string, listener: Function) => {
    const listeners = listenersRef.current.get(type) || [];
    listeners.push(listener);
    listenersRef.current.set(type, listeners);
  };

  const off = (type: string, listener: Function) => {
    const listeners = listenersRef.current.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      listenersRef.current.set(type, listeners);
    }
  };

  return { status, connect, disconnect, send, on, off };
};
import { useToast } from '@/hooks/use-toast'
import { usePhone } from '../context/phone-context'

interface PhoneScreenViewerProps {
  phoneId: string
  onScreenshot?: (imageUrl: string) => void
}

export function PhoneScreenViewer({ phoneId, onScreenshot }: PhoneScreenViewerProps) {
  const { toast } = useToast()
  const { takeScreenshot } = usePhone()
  
  // WebSocket connection
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/phone/${phoneId}`
  const { status, connect, disconnect, send, on, off } = useWebSocket(wsUrl, {
    reconnectInterval: 2000,
    maxReconnectAttempts: 5,
    pingInterval: 30000,
    debug: false,
  })
  
  // Screen state
  const [screenImage, setScreenImage] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  // Connect to WebSocket on mount
  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token')
    
    // Connect to WebSocket
    connect(token || undefined)
    
    // Clean up on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect, phoneId])
  
  // Handle WebSocket status changes
  useEffect(() => {
    if (status === ConnectionStatus.CONNECTED) {
      setError(null)
      // Request initial screenshot
      requestScreenshot()
    } else if (status === ConnectionStatus.ERROR) {
      setError('Connection error. Please try again.')
    } else if (status === ConnectionStatus.DISCONNECTED) {
      // Only show error if we had a screen before
      if (screenImage) {
        setError('Connection lost. Reconnecting...')
      }
    }
  }, [status])
  
  // Handle screen updates
  useEffect(() => {
    const handleScreenUpdate = (message: any) => {
      if (message.phone_id === phoneId && message.image) {
        setScreenImage(`data:image/jpeg;base64,${message.image}`)
        setLastUpdate(new Date())
        setError(null)
      }
    }
    
    // Register message handler
    on(MessageType.PHONE_SCREEN, handleScreenUpdate)
    
    // Clean up
    return () => {
      off(MessageType.PHONE_SCREEN, handleScreenUpdate)
    }
  }, [on, off, phoneId])
  
  // Request a new screenshot
  const requestScreenshot = async () => {
    setIsLoading(true)
    
    try {
      // First try WebSocket
      if (status === ConnectionStatus.CONNECTED) {
        send({
          type: MessageType.PHONE_CONTROL,
          phone_id: phoneId,
          action: 'screenshot',
        })
        
        // Set a timeout to fall back to API if WebSocket doesn't respond
        setTimeout(() => {
          if (isLoading) {
            fallbackToApi()
          }
        }, 3000)
      } else {
        // Fall back to API immediately
        fallbackToApi()
      }
    } catch (err) {
      fallbackToApi()
    }
  }
  
  // Fall back to API for screenshots
  const fallbackToApi = async () => {
    try {
      const screenshotUrl = await takeScreenshot(phoneId)
      setScreenImage(screenshotUrl)
      setLastUpdate(new Date())
      setError(null)
      
      if (onScreenshot) {
        onScreenshot(screenshotUrl)
      }
    } catch (err) {
      setError('Failed to take screenshot')
      toast({
        variant: 'destructive',
        title: 'Screenshot failed',
        description: 'Could not capture device screen',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle manual screenshot request
  const handleTakeScreenshot = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      const screenshotUrl = await takeScreenshot(phoneId)
      
      if (onScreenshot) {
        onScreenshot(screenshotUrl)
      }
      
      toast({
        title: 'Screenshot taken',
        description: 'Device screenshot has been captured',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Screenshot failed',
        description: 'Could not capture device screen',
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Render loading state
  if (!screenImage && isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <Skeleton className="w-full aspect-[9/16] max-w-[300px] rounded-lg" />
          <p className="text-sm text-muted-foreground mt-4">Loading device screen...</p>
        </CardContent>
      </Card>
    )
  }
  
  // Render error state
  if (!screenImage && error) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <IconDeviceMobile className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Screen Unavailable</h3>
          <p className="text-muted-foreground max-w-md mb-6 text-center">{error}</p>
          <Button onClick={requestScreenshot} disabled={isLoading}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Render screen
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="relative group">
          {screenImage ? (
            <img
              src={screenImage}
              alt="Device Screen"
              className="max-w-full rounded-lg border shadow-sm"
              style={{ maxHeight: '70vh' }}
            />
          ) : (
            <div className="w-full aspect-[9/16] max-w-[300px] bg-muted rounded-lg flex items-center justify-center">
              <IconDeviceMobile className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 opacity-80 hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTakeScreenshot}
              disabled={isLoading}
            >
              <IconCamera className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>
        
        <div className="w-full flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            {lastUpdate
              ? `Last updated: ${lastUpdate.toLocaleTimeString()}`
              : 'No screen data available'}
          </p>
          
          <Button
            variant="outline"
            size="sm"
            onClick={requestScreenshot}
            disabled={isLoading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
