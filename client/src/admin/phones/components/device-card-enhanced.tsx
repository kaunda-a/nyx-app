import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconBrandAndroid,
  IconBrandApple,
  IconDotsVertical,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconEdit,
  IconCopy,
  IconShieldCheck,
  IconExternalLink,
  IconCpu,
  IconDeviceSdCard,
  IconTerminal
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VirtualDevice } from '../data/schema';
import { PhoneDevice } from './device-models/phone-device';

interface DeviceCardProps {
  device: VirtualDevice;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (device: VirtualDevice) => void;
  // onConsole prop removed
}

export function DeviceCardEnhanced({ device, onStart, onStop, onDelete, onOpen }: DeviceCardProps) {
  const isRunning = device.status === 'running';

  // Format memory value for display
  const formatMemory = (value: number) => {
    return `${value / 1024} GB`;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return '';
    }
  };

  // Get protection badge variant
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
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center">
              {device.os === 'android' ? (
                <IconBrandAndroid className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <IconBrandApple className="h-4 w-4 mr-2" />
              )}
              {device.name}
            </CardTitle>
            <CardDescription className="text-xs">
              {device.os === 'android' ? 'Android' : 'iOS'} {device.version}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${getStatusBadgeVariant(device.status)}`}
          >
            {device.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-center py-4">
          <PhoneDevice
            type={device.os as 'android' | 'ios'}
            model={device.model}
            isOn={device.status === 'running'}
            width={120}
            height={240}
            screenContent={
              <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-blue-500 to-purple-600 text-white">
                <div className="text-xs font-bold mb-1">{device.name}</div>
                <div className="text-[8px] opacity-80">
                  {device.os === 'android' ? 'Android' : 'iOS'} {device.version}
                </div>
              </div>
            }
          />
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <IconCpu className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>CPU</span>
            </div>
            <span className="font-medium">{device.specs.cpu} Cores</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <IconDeviceSdCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>Memory</span>
            </div>
            <span className="font-medium">{formatMemory(device.specs.memory)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <IconShieldCheck className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>Protection</span>
            </div>
            <Badge
              variant="outline"
              className={`capitalize text-xs ${getProtectionBadgeVariant(device.protection.level)}`}
            >
              {device.protection.level}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 flex justify-between">
        {isRunning ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStop(device.id)}
          >
            <IconPlayerStop className="h-4 w-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStart(device.id)}
          >
            <IconPlayerPlay className="h-4 w-4 mr-2" />
            Start
          </Button>
        )}

        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onOpen(device)}
            disabled={!isRunning}
            title="Open Device"
          >
            <IconExternalLink className="h-4 w-4" />
          </Button>

          {/* Console button removed */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onOpen(device)} disabled={!isRunning}>
                <IconExternalLink className="h-4 w-4 mr-2" />
                Open Device
              </DropdownMenuItem>

              {/* Console dropdown option removed */}
              <DropdownMenuItem>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCopy className="h-4 w-4 mr-2" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(device.id)} className="text-destructive focus:text-destructive">
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
