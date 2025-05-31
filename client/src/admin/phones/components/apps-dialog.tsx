import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  IconBrandWhatsapp,
  IconBrandTelegram,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandTiktok,
  IconBrandSnapchat,
  IconBrandGmail,
  IconBrandChrome,
  IconPlus,
  IconDownload,
  IconPlayerPlay
} from '@tabler/icons-react'
import { usePhone } from '../context/phone-context'

interface AppItem {
  id: string
  name: string
  packageName: string
  icon: React.ReactNode
  installed: boolean
}

interface AppsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppsDialog({ open, onOpenChange }: AppsDialogProps) {
  const { currentDevice, installApp, launchApp } = usePhone()
  const [activeTab, setActiveTab] = useState('installed')
  const [appUrl, setAppUrl] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const [isLaunching, setIsLaunching] = useState<string | null>(null)

  // Mock data for installed apps
  const installedApps: AppItem[] = [
    {
      id: '1',
      name: 'Chrome',
      packageName: 'com.android.chrome',
      icon: <IconBrandChrome className="h-8 w-8 text-blue-500" />,
      installed: true
    },
    {
      id: '2',
      name: 'Gmail',
      packageName: 'com.google.android.gm',
      icon: <IconBrandGmail className="h-8 w-8 text-red-500" />,
      installed: true
    }
  ]

  // Mock data for available apps
  const availableApps: AppItem[] = [
    {
      id: '3',
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      icon: <IconBrandWhatsapp className="h-8 w-8 text-green-500" />,
      installed: false
    },
    {
      id: '4',
      name: 'Telegram',
      packageName: 'org.telegram.messenger',
      icon: <IconBrandTelegram className="h-8 w-8 text-blue-400" />,
      installed: false
    },
    {
      id: '5',
      name: 'Instagram',
      packageName: 'com.instagram.android',
      icon: <IconBrandInstagram className="h-8 w-8 text-pink-500" />,
      installed: false
    },
    {
      id: '6',
      name: 'Facebook',
      packageName: 'com.facebook.katana',
      icon: <IconBrandFacebook className="h-8 w-8 text-blue-600" />,
      installed: false
    },
    {
      id: '7',
      name: 'Twitter',
      packageName: 'com.twitter.android',
      icon: <IconBrandTwitter className="h-8 w-8 text-blue-400" />,
      installed: false
    },
    {
      id: '8',
      name: 'TikTok',
      packageName: 'com.zhiliaoapp.musically',
      icon: <IconBrandTiktok className="h-8 w-8 text-black dark:text-white" />,
      installed: false
    },
    {
      id: '9',
      name: 'Snapchat',
      packageName: 'com.snapchat.android',
      icon: <IconBrandSnapchat className="h-8 w-8 text-yellow-400" />,
      installed: false
    }
  ]

  const handleInstallApp = async () => {
    if (!currentDevice || !appUrl) return

    setIsInstalling(true)
    try {
      await installApp(currentDevice.id, appUrl)
      setAppUrl('')
    } finally {
      setIsInstalling(false)
    }
  }

  const handleLaunchApp = async (packageName: string) => {
    if (!currentDevice) return

    setIsLaunching(packageName)
    try {
      await launchApp(currentDevice.id, packageName)
    } finally {
      setIsLaunching(null)
    }
  }

  const handleInstallFromStore = async (app: AppItem) => {
    if (!currentDevice) return

    setIsInstalling(true)
    try {
      // Mock URL for demonstration
      const mockAppUrl = `https://apk-store.example.com/${app.packageName}.apk`
      await installApp(currentDevice.id, mockAppUrl)
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Apps</DialogTitle>
          <DialogDescription>
            Install and manage applications on {currentDevice?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="store">App Store</TabsTrigger>
            <TabsTrigger value="custom">Custom APK</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="h-[400px]">
            <ScrollArea className="h-full pr-4">
              {installedApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-muted-foreground mb-2">No apps installed</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('store')}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Install Apps
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {installedApps.map(app => (
                    <div key={app.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {app.icon}
                        <div>
                          <h4 className="text-sm font-medium">{app.name}</h4>
                          <p className="text-xs text-muted-foreground">{app.packageName}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLaunchApp(app.packageName)}
                        disabled={isLaunching === app.packageName}
                      >
                        <IconPlayerPlay className="h-4 w-4 mr-2" />
                        {isLaunching === app.packageName ? 'Launching...' : 'Launch'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="store" className="h-[400px]">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 py-4">
                {availableApps.map(app => (
                  <div key={app.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {app.icon}
                        <div>
                          <h4 className="text-sm font-medium">{app.name}</h4>
                          <p className="text-xs text-muted-foreground">{app.packageName}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInstallFromStore(app)}
                        disabled={isInstalling}
                      >
                        <IconDownload className="h-4 w-4 mr-2" />
                        {isInstalling ? 'Installing...' : 'Install'}
                      </Button>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Install Custom APK</h4>
              <p className="text-xs text-muted-foreground">
                Enter the URL of an APK file to install it on the device
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/app.apk"
                value={appUrl}
                onChange={e => setAppUrl(e.target.value)}
              />
              <Button
                onClick={handleInstallApp}
                disabled={!appUrl || isInstalling}
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h4 className="text-sm font-medium mb-2">Supported Sources</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Direct APK download URLs</li>
                <li>Google Play Store (requires Google account)</li>
                <li>APKPure</li>
                <li>APKMirror</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
