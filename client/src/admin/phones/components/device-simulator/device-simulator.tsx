import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IconDeviceMobile, 
  IconRotate, 
  IconRefresh, 
  IconVolume, 
  IconVolumeOff,
  IconBrandAndroid,
  IconBrandApple,
  IconPower,
  IconCamera,
  IconDownload,
  IconClipboard,
  IconDeviceFloppy,
  IconDeviceIpad
} from '@tabler/icons-react';
import { PhoneDevice } from '../device-models/phone-device';
import { VirtualDevice } from '../../data/schema';
import { cn } from '@/lib/utils';

interface DeviceSimulatorProps {
  device: VirtualDevice;
  onScreenshot?: (imageData: string) => void;
  onRestart?: () => void;
  onClose?: () => void;
  className?: string;
}

export function DeviceSimulator({ 
  device, 
  onScreenshot, 
  onRestart, 
  onClose,
  className 
}: DeviceSimulatorProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [activeTab, setActiveTab] = useState('device');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate connection to device
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      // In a real implementation, this would be the WebRTC stream URL from Waydroid
      setStreamUrl('https://example.com/stream');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Handle device interaction
  const handleDeviceInteraction = (type: 'power' | 'volume-up' | 'volume-down' | 'home' | 'back' | 'screen') => {
    console.log(`Device interaction: ${type}`);
    
    // In a real implementation, these would send commands to the Waydroid instance
    switch (type) {
      case 'power':
        // Toggle device power
        break;
      case 'volume-up':
        setVolume(Math.min(volume + 10, 100));
        break;
      case 'volume-down':
        setVolume(Math.max(volume - 10, 0));
        break;
      case 'home':
        // Send home button press
        break;
      case 'back':
        // Send back button press
        break;
      case 'screen':
        // Handle screen tap
        break;
    }
  };

  // Handle device rotation
  const handleRotate = () => {
    setIsRotated(!isRotated);
  };

  // Handle volume mute toggle
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Handle device restart
  const handleRestart = () => {
    setIsConnecting(true);
    setIsConnected(false);
    
    // Simulate reconnection
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      if (onRestart) onRestart();
    }, 3000);
  };

  // Handle screenshot
  const handleScreenshot = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to image data URL
      const imageData = canvas.toDataURL('image/png');
      
      if (onScreenshot) {
        onScreenshot(imageData);
      }
    }
  };

  // Render device screen content
  const renderDeviceScreen = () => {
    if (isConnecting) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white">
          <IconDeviceMobile className="h-12 w-12 mb-4 animate-pulse" />
          <p className="text-sm">Connecting to device...</p>
        </div>
      );
    }
    
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white">
          <IconDeviceMobile className="h-12 w-12 mb-4" />
          <p className="text-sm">Connection failed</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 bg-white/10 text-white hover:bg-white/20"
            onClick={handleRestart}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }
    
    // Connected and streaming
    return (
      <div className="h-full w-full relative">
        {/* Video stream from Waydroid */}
        <video 
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay 
          playsInline
          muted={isMuted}
        >
          {/* In a real implementation, this would be the WebRTC stream */}
          <source src={streamUrl || ''} type="video/mp4" />
        </video>
        
        {/* Hidden canvas for screenshots */}
        <canvas 
          ref={canvasRef} 
          className="hidden"
        />
      </div>
    );
  };

  return (
    <Card className={cn("w-full max-w-4xl overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              {device.os === 'android' ? (
                <IconBrandAndroid className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <IconBrandApple className="h-5 w-5 mr-2 text-gray-700" />
              )}
              {device.name}
            </CardTitle>
            <CardDescription>
              {device.os === 'android' ? 'Android' : 'iOS'} {device.version}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">
              {device.protection.level} Protection
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Running
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="device" className="flex-1">
              <IconDeviceMobile className="h-4 w-4 mr-2" />
              Device
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex-1">
              <IconPower className="h-4 w-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="device" className="p-0 m-0">
          <CardContent className="p-6 flex justify-center">
            <div className="relative">
              <PhoneDevice
                type={device.os as 'android' | 'ios'}
                isRotated={isRotated}
                screenContent={renderDeviceScreen()}
                onInteraction={handleDeviceInteraction}
                width={280}
                height={560}
              />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="controls" className="p-0 m-0">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Device Orientation</h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant={isRotated ? "outline" : "default"} 
                      size="sm"
                      onClick={() => setIsRotated(false)}
                      className="flex-1"
                    >
                      <IconDeviceMobile className="h-4 w-4 mr-2" />
                      Portrait
                    </Button>
                    <Button 
                      variant={isRotated ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setIsRotated(true)}
                      className="flex-1"
                    >
                      <IconDeviceIpad className="h-4 w-4 mr-2" />
                      Landscape
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Volume</h3>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleMuteToggle}
                    >
                      {isMuted ? (
                        <IconVolumeOff className="h-4 w-4" />
                      ) : (
                        <IconVolume className="h-4 w-4" />
                      )}
                    </Button>
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                    <span className="text-sm w-8 text-right">{volume}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Device Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeviceInteraction('power')}
                    >
                      <IconPower className="h-4 w-4 mr-2" />
                      Power
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeviceInteraction('home')}
                    >
                      Home
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeviceInteraction('back')}
                    >
                      Back
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRestart}
                    >
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Capture</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleScreenshot}
                    >
                      <IconCamera className="h-4 w-4 mr-2" />
                      Screenshot
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <IconDownload className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <IconClipboard className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Device Information</h3>
                  <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU:</span>
                      <span>{device.specs.cpu} Core{device.specs.cpu > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Memory:</span>
                      <span>{device.specs.memory / 1024} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span>{device.specs.storage / 1024} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Protection:</span>
                      <span className="capitalize">{device.protection.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="settings" className="p-0 m-0">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Camoufox Protection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="device-fingerprint" className="text-sm">Device Fingerprinting</Label>
                    <Switch 
                      id="device-fingerprint" 
                      checked={device.protection.features.deviceFingerprint}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="location-spoofing" className="text-sm">Location Spoofing</Label>
                    <Switch 
                      id="location-spoofing" 
                      checked={device.protection.features.locationSpoofing}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="sensor-simulation" className="text-sm">Sensor Simulation</Label>
                    <Switch 
                      id="sensor-simulation" 
                      checked={device.protection.features.sensorSimulation}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="app-behavior" className="text-sm">App Behavior</Label>
                    <Switch 
                      id="app-behavior" 
                      checked={device.protection.features.appBehavior}
                      disabled
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Waydroid Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="auto-start" className="text-sm">Auto-start on Boot</Label>
                    <Switch id="auto-start" />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="hardware-acceleration" className="text-sm">Hardware Acceleration</Label>
                    <Switch id="hardware-acceleration" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="clipboard-sync" className="text-sm">Clipboard Sync</Label>
                    <Switch id="clipboard-sync" />
                  </div>
                  <div className="flex items-center justify-between space-x-2 rounded-md border p-3">
                    <Label htmlFor="audio-passthrough" className="text-sm">Audio Passthrough</Label>
                    <Switch id="audio-passthrough" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRotate}>
            <IconRotate className="h-4 w-4 mr-2" />
            Rotate
          </Button>
          <Button onClick={handleScreenshot}>
            <IconCamera className="h-4 w-4 mr-2" />
            Screenshot
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
