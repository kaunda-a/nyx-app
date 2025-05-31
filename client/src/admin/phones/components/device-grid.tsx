import { usePhone } from '../context/phone-context'
import { DeviceCardEnhanced } from './device-card-enhanced'
import { Skeleton } from '@/components/ui/skeleton'
import { IconDeviceMobile } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { VirtualDevice } from '../data/schema'

interface DeviceGridProps {
  devices: VirtualDevice[];
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (device: VirtualDevice) => void;
  // onConsole prop removed
}

export function DeviceGrid({ devices, onStart, onStop, onDelete, onOpen }: DeviceGridProps) {
  const { loading, setOpen } = usePhone()

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    )
  }

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <IconDeviceMobile className="h-10 w-10 text-muted-foreground" />
        </div>

        <h3 className="text-xl font-semibold mb-2">No Virtual Devices</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't created any virtual devices yet. Create your first device to get started.
        </p>
        <Button onClick={() => setOpen('create')}>
          Create Your First Device
        </Button>
      </div>
    )
  }

  // Grid of devices
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {devices.map(device => (
        <DeviceCardEnhanced
          key={device.id}
          device={device}
          onStart={onStart}
          onStop={onStop}
          onDelete={onDelete}
          onOpen={onOpen}
          // onConsole prop removed
        />
      ))}
    </div>
  )
}