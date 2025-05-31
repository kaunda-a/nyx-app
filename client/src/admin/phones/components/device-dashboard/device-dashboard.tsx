import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDeviceMobile,
  IconBrandAndroid,
  IconBrandApple,
  IconDotsVertical,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
  IconEdit,
  IconCopy,
  IconShieldCheck,
  IconDeviceDesktop,
  IconDeviceLaptop
} from '@tabler/icons-react';
import { usePhone } from '../../context/phone-context';
import { DeviceGrid } from '../device-grid';
import { DeviceTable } from '../device-table';
import { DeviceWizard } from '../device-wizard/device-wizard';
import { DeviceSimulator } from '../device-simulator/device-simulator';
import { VirtualDevice } from '../../data/schema';

interface DeviceDashboardProps {
  onDeviceSelect?: (device: VirtualDevice) => void;
  onSimulatorOpen?: (device: VirtualDevice) => void;
  // onConsoleOpen removed
}

export function DeviceDashboard({ onDeviceSelect, onSimulatorOpen }: DeviceDashboardProps) {
  const { devices, loading, fetchDevices, startDevice, stopDevice, deleteDevice } = usePhone();
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<VirtualDevice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [osFilter, setOsFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [protectionFilter, setProtectionFilter] = useState<string>('all');

  // Fetch devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        await fetchDevices();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch devices');
      }
    };

    loadDevices();
  }, [fetchDevices]);

  // Filter devices based on search query and filters
  const filteredDevices = devices.filter(device => {
    // Search filter
    if (searchQuery && !device.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // OS filter
    if (osFilter !== 'all' && device.os !== osFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && device.status !== statusFilter) {
      return false;
    }

    // Protection filter
    if (protectionFilter !== 'all' && device.protection.level !== protectionFilter) {
      return false;
    }

    return true;
  });

  // Handle device start
  const handleStartDevice = async (id: string) => {
    await startDevice(id);
  };

  // Handle device stop
  const handleStopDevice = async (id: string) => {
    await stopDevice(id);
  };

  // Handle device delete
  const handleDeleteDevice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      await deleteDevice(id);
    }
  };

  // Handle device open in simulator
  const handleOpenSimulator = (device: VirtualDevice) => {
    setSelectedDevice(device);
    setShowSimulator(true);

    // Call the onSimulatorOpen prop if provided
    if (onSimulatorOpen) {
      onSimulatorOpen(device);
    }

    // Call the onDeviceSelect prop if provided
    if (onDeviceSelect) {
      onDeviceSelect(device);
    }
  };

  // handleOpenConsole function removed

  // Handle simulator close
  const handleCloseSimulator = () => {
    setShowSimulator(false);
    setSelectedDevice(null);
  };

  // Handle screenshot
  const handleScreenshot = (imageData: string) => {
    // In a real implementation, this would save the screenshot
    console.log('Screenshot taken:', imageData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Virtual Devices</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateWizard(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Create Device
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={fetchDevices}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <IconDeviceDesktop className="h-4 w-4 mr-2" />
                System Resources
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconDeviceLaptop className="h-4 w-4 mr-2" />
                Waydroid Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={osFilter}
            onValueChange={setOsFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="OS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OS</SelectItem>
              <SelectItem value="android">
                <div className="flex items-center">
                  <IconBrandAndroid className="h-4 w-4 mr-2 text-green-500" />
                  Android
                </div>
              </SelectItem>
              <SelectItem value="ios">
                <div className="flex items-center">
                  <IconBrandApple className="h-4 w-4 mr-2" />
                  iOS
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={protectionFilter}
            onValueChange={setProtectionFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Protection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Protection</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
              <SelectItem value="maximum">Maximum</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-1 rounded-md border p-1">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="h-8 w-8 p-0"
            >
              <IconDeviceMobile className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
              className="h-8 w-8 p-0"
            >
              <IconFilter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Virtual Devices</CardTitle>
          <CardDescription>
            Manage your virtual devices with Waydroid and Camoufox protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <IconRefresh className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" onClick={fetchDevices}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <IconDeviceMobile className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No devices found</p>
              <Button onClick={() => setShowCreateWizard(true)}>
                <IconPlus className="h-4 w-4 mr-2" />
                Create Device
              </Button>
            </div>
          ) : view === 'grid' ? (
            <DeviceGrid
              devices={filteredDevices}
              onStart={handleStartDevice}
              onStop={handleStopDevice}
              onDelete={handleDeleteDevice}
              onOpen={handleOpenSimulator}
              // onConsole prop removed
            />
          ) : (
            <DeviceTable
              devices={filteredDevices}
              onStart={handleStartDevice}
              onStop={handleStopDevice}
              onDelete={handleDeleteDevice}
              onOpen={handleOpenSimulator}
              // onConsole prop removed
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredDevices.length} of {devices.length} devices
          </div>
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardFooter>
      </Card>

      {/* Create Device Wizard */}
      {showCreateWizard && (
        <DeviceWizard
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
        />
      )}

      {/* Device Simulator */}
      {showSimulator && selectedDevice && (
        <DeviceSimulator
          device={selectedDevice}
          onScreenshot={handleScreenshot}
          onRestart={() => handleStartDevice(selectedDevice.id)}
          onClose={handleCloseSimulator}
        />
      )}
    </div>
  );
}
