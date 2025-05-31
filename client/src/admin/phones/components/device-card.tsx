import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  IconDeviceMobile,
  IconBrandAndroid,
  IconBrandApple,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconApps,
  IconCamera,
  IconTerminal2
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { VirtualDevice, DeviceStatus } from '../data/schema'
import { usePhone } from '../context/phone-context'

interface DeviceCardProps {
  device: VirtualDevice
}

export function DeviceCard({ device }: DeviceCardProps) {
  const {
    startDevice,
    stopDevice,
    restartDevice,
    setCurrentDevice,
    setOpen
  } = usePhone()

  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(true)
    setLoadingAction(action)

    try {
      if (action === 'start') {
        await startDevice(device.id)
      } else if (action === 'stop') {
        await stopDevice(device.id)
      } else if (action === 'restart') {
        await restartDevice(device.id)
      }
    } finally {
      setLoading(false)
      setLoadingAction(null)
    }
  }

  const handleOpenDialog = (type: 'edit' | 'delete' | 'apps' | 'terminal' | 'screenshot') => {
    setCurrentDevice(device)
    setOpen(type)
  }

  const statusColors: Record<DeviceStatus, string> = {
    running: 'bg-green-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500'
  }

  const statusText: Record<DeviceStatus, string> = {
    running: 'Running',
    stopped: 'Stopped',
    error: 'Error'
  }

  const isRunning = device.status === 'running'
  const isStopped = device.status === 'stopped'
  const isError = device.status === 'error'

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">{device.name}</CardTitle>
            <CardDescription>
              {device.os === 'android' ? 'Android' : 'iOS'} {device.version}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {device.os === 'android' ? (
              <IconBrandAndroid className="h-6 w-6 text-green-500" />
            ) : (
              <IconBrandApple className="h-6 w-6 text-gray-500" />
            )}
            <Badge
              variant="outline"
              className={cn(
                "ml-2 capitalize",
                isRunning && "text-green-500 border-green-500",
                isStopped && "text-gray-500 border-gray-500",
                isError && "text-red-500 border-red-500"
              )}
            >
              <span className={cn(
                "mr-1.5 h-2 w-2 rounded-full",
                statusColors[device.status]
              )} />
              {statusText[device.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">CPU</p>
              <p className="font-medium">{device.specs.cpu} Core{device.specs.cpu > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Memory</p>
              <p className="font-medium">{device.specs.memory / 1024} GB</p>
            </div>
            <div>
              <p className="text-muted-foreground">Storage</p>
              <p className="font-medium">{device.specs.storage / 1024} GB</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Protection Level</span>
              <span className="font-medium capitalize">{device.protection.level}</span>
            </div>
            <Progress
              value={
                device.protection.level === 'basic' ? 33 :
                device.protection.level === 'enhanced' ? 66 : 100
              }
              className={cn(
                "h-2",
                device.protection.level === 'basic' && "bg-yellow-100 [&>div]:bg-yellow-500",
                device.protection.level === 'enhanced' && "bg-blue-100 [&>div]:bg-blue-500",
                device.protection.level === 'maximum' && "bg-green-100 [&>div]:bg-green-500"
              )}
            />
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {device.protection.features.deviceFingerprint && (
              <Badge variant="secondary" className="font-normal">Fingerprint Protection</Badge>
            )}
            {device.protection.features.locationSpoofing && (
              <Badge variant="secondary" className="font-normal">Location Spoofing</Badge>
            )}
            {device.protection.features.sensorSimulation && (
              <Badge variant="secondary" className="font-normal">Sensor Simulation</Badge>
            )}
            {device.protection.features.appBehavior && (
              <Badge variant="secondary" className="font-normal">App Behavior</Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          {isRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('stop')}
              disabled={loading}
            >
              {loadingAction === 'stop' ? (
                <Skeleton className="h-4 w-4 rounded-full animate-spin" />
              ) : (
                <IconPlayerStop className="h-4 w-4 mr-1" />
              )}
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('start')}
              disabled={loading || isError}
            >
              {loadingAction === 'start' ? (
                <Skeleton className="h-4 w-4 rounded-full animate-spin" />
              ) : (
                <IconPlayerPlay className="h-4 w-4 mr-1" />
              )}
              Start
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('restart')}
            disabled={loading || isStopped || isError}
          >
            {loadingAction === 'restart' ? (
              <Skeleton className="h-4 w-4 rounded-full animate-spin" />
            ) : (
              <IconRefresh className="h-4 w-4 mr-1" />
            )}
            Restart
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog('apps')}
            disabled={!isRunning}
            title="Apps"
          >
            <IconApps className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog('terminal')}
            disabled={!isRunning}
            title="Terminal"
          >
            <IconTerminal2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog('screenshot')}
            disabled={!isRunning}
            title="Screenshot"
          >
            <IconCamera className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog('edit')}
            title="Settings"
          >
            <IconSettings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog('delete')}
            title="Delete"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
