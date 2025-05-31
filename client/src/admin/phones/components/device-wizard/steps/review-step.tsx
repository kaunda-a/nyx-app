import React from 'react';
import { 
  IconBrandAndroid, 
  IconBrandApple, 
  IconCpu, 
  IconDeviceSdCard, 
  IconShieldCheck, 
  IconFingerprint, 
  IconMapPin, 
  IconDeviceWatch, 
  IconApps, 
  IconCheck, 
  IconX 
} from '@tabler/icons-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ReviewStepProps {
  config: any;
  updateConfig: (updates: any) => void;
}

export function ReviewStep({ config }: ReviewStepProps) {
  // Format memory value for display
  const formatMemory = (value: number) => {
    return `${value / 1024} GB`;
  };
  
  // Format storage value for display
  const formatStorage = (value: number) => {
    return `${value / 1024} GB`;
  };
  
  // Get protection level badge variant
  const getProtectionBadgeVariant = (level: string) => {
    switch (level) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'enhanced':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'maximum':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Device Configuration</CardTitle>
          <CardDescription>
            Review your virtual device configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Device Name</p>
                  <p className="text-sm font-medium">{config.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Operating System</p>
                  <p className="text-sm font-medium flex items-center">
                    {config.os === 'android' ? (
                      <>
                        <IconBrandAndroid className="h-4 w-4 mr-2 text-green-500" />
                        Android {config.version}
                      </>
                    ) : (
                      <>
                        <IconBrandApple className="h-4 w-4 mr-2 text-gray-700" />
                        iOS {config.version}
                      </>
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Device Model</p>
                  <p className="text-sm font-medium">
                    {config.os === 'android' ? (
                      config.model === 'pixel' ? 'Google Pixel' :
                      config.model === 'samsung' ? 'Samsung Galaxy' :
                      config.model === 'oneplus' ? 'OnePlus' :
                      config.model === 'xiaomi' ? 'Xiaomi' : config.model
                    ) : (
                      config.model === 'iphone' ? 'iPhone' :
                      config.model === 'iphone-pro' ? 'iPhone Pro' :
                      config.model === 'iphone-plus' ? 'iPhone Plus' : config.model
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Device Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CPU Cores</p>
                  <p className="text-sm font-medium flex items-center">
                    <IconCpu className="h-4 w-4 mr-2 text-blue-500" />
                    {config.specs.cpu} Cores
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Memory (RAM)</p>
                  <p className="text-sm font-medium flex items-center">
                    <IconDeviceSdCard className="h-4 w-4 mr-2 text-blue-500" />
                    {formatMemory(config.specs.memory)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="text-sm font-medium flex items-center">
                    <IconDeviceSdCard className="h-4 w-4 mr-2 text-blue-500" />
                    {formatStorage(config.specs.storage)}
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Camoufox Protection</h3>
                <Badge 
                  variant="outline" 
                  className={`capitalize ${getProtectionBadgeVariant(config.protection.level)}`}
                >
                  {config.protection.level} Protection
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm flex items-center">
                    {config.protection.features.deviceFingerprint ? (
                      <IconCheck className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <IconX className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    <IconFingerprint className="h-4 w-4 mr-1" />
                    Device Fingerprinting
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm flex items-center">
                    {config.protection.features.locationSpoofing ? (
                      <IconCheck className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <IconX className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    <IconMapPin className="h-4 w-4 mr-1" />
                    Location Spoofing
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm flex items-center">
                    {config.protection.features.sensorSimulation ? (
                      <IconCheck className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <IconX className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    <IconDeviceWatch className="h-4 w-4 mr-1" />
                    Sensor Simulation
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm flex items-center">
                    {config.protection.features.appBehavior ? (
                      <IconCheck className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <IconX className="h-4 w-4 mr-2 text-red-500" />
                    )}
                    <IconApps className="h-4 w-4 mr-1" />
                    App Behavior
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-center mb-2">
          <IconShieldCheck className="h-5 w-5 mr-2 text-green-500" />
          <h3 className="text-sm font-medium">Ready to Create</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your virtual device will be created with the configuration above. Once created, you can start and manage it from the devices dashboard.
        </p>
      </div>
    </div>
  );
}
