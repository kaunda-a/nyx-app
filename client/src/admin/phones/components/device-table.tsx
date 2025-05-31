import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  IconDeviceMobile,
  IconCpu,
  IconDeviceSdCard,
  IconTerminal
} from '@tabler/icons-react';
import { VirtualDevice } from '../data/schema';

interface DeviceTableProps {
  devices: VirtualDevice[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (device: VirtualDevice) => void;
  // onConsole prop removed
}

export function DeviceTable({
  devices,
  onStart,
  onStop,
  onDelete,
  onOpen
  // onConsole removed
}: DeviceTableProps) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>OS</TableHead>
          <TableHead>Specs</TableHead>
          <TableHead>Protection</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div className="bg-muted rounded-md p-2">
                  <IconDeviceMobile className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {device.os === 'android' ? (
                      device.model === 'pixel' ? 'Google Pixel' :
                      device.model === 'samsung' ? 'Samsung Galaxy' :
                      device.model === 'oneplus' ? 'OnePlus' :
                      device.model === 'xiaomi' ? 'Xiaomi' : device.model
                    ) : (
                      device.model === 'iphone' ? 'iPhone' :
                      device.model === 'iphone-pro' ? 'iPhone Pro' :
                      device.model === 'iphone-plus' ? 'iPhone Plus' : device.model
                    )}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                {device.os === 'android' ? (
                  <IconBrandAndroid className="h-4 w-4 text-green-500" />
                ) : (
                  <IconBrandApple className="h-4 w-4" />
                )}
                <span>
                  {device.os === 'android' ? 'Android' : 'iOS'} {device.version}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <IconCpu className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{device.specs.cpu} Cores</span>
                </div>
                <div className="flex items-center text-sm">
                  <IconDeviceSdCard className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{formatMemory(device.specs.memory)} RAM</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`capitalize ${getProtectionBadgeVariant(device.protection.level)}`}
              >
                <IconShieldCheck className="h-3 w-3 mr-1" />
                {device.protection.level}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`capitalize ${getStatusBadgeVariant(device.status)}`}
              >
                {device.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                {device.status === 'running' ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onStop(device.id)}
                    title="Stop Device"
                  >
                    <IconPlayerStop className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onStart(device.id)}
                    title="Start Device"
                  >
                    <IconPlayerPlay className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onOpen(device)}
                  title="Open Device"
                  disabled={device.status !== 'running'}
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
                    <DropdownMenuItem onClick={() => onOpen(device)} disabled={device.status !== 'running'}>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
