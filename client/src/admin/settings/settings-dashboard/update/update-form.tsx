import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { check, install } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getVersion } from '@tauri-apps/api/app'
import { toast } from '@/hooks/use-toast'

// Inline UpdateInfo interface to avoid import issues during build
interface UpdateInfo {
  version: string;
  date: string;
  body: string;
}

export function UpdateForm() {
  const [currentVersion, setCurrentVersion] = useState<string>('')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    loadCurrentVersion()
    loadLastChecked()
  }, [])

  const loadCurrentVersion = async () => {
    try {
      const version = await getVersion()
      setCurrentVersion(version)
    } catch (error) {
      console.error('Error getting app version:', error)
    }
  }

  const loadLastChecked = () => {
    const stored = localStorage.getItem('lastUpdateCheck')
    if (stored) {
      setLastChecked(new Date(stored))
    }
  }

  const handleCheckForUpdates = async () => {
    setIsChecking(true)
    try {
      toast({
        title: 'Checking for updates...'
      })

      const update = await check()

      if (update?.available) {
        const updateInfo: UpdateInfo = {
          version: update.version || 'Unknown',
          date: update.date || new Date().toISOString(),
          body: update.body || 'No release notes available'
        }

        toast({
          title: `Update available: v${updateInfo.version}`,
          description: 'Click to install the update'
        })

        setUpdateInfo(updateInfo)
      } else {
        toast({
          title: 'You are running the latest version'
        })
        setUpdateInfo(null)
      }

      setLastChecked(new Date())
      localStorage.setItem('lastUpdateCheck', new Date().toISOString())
    } catch (error) {
      console.error('Error checking for updates:', error)
      toast({
        variant: 'destructive',
        title: 'Update check failed',
        description: 'Could not check for updates. Please try again later.'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleInstallUpdate = async () => {
    if (!updateInfo) {
      toast({
        variant: 'destructive',
        title: 'No update available'
      })
      return
    }

    try {
      toast({
        title: 'Installing update...',
        description: 'Please wait while the update is downloaded and installed'
      })

      await install()

      toast({
        title: 'Update installed successfully',
        description: 'The application will restart now'
      })

      // Auto-restart after 3 seconds
      setTimeout(async () => {
        try {
          await relaunch()
        } catch (error) {
          console.error('Error restarting app:', error)
          toast({
            variant: 'destructive',
            title: 'Failed to restart application'
          })
        }
      }, 3000)

    } catch (error) {
      console.error('Error installing update:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to install update'
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            App Updates
          </CardTitle>
          <CardDescription>
            Manage automatic updates and check for new versions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Version */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Version</p>
              <p className="text-sm text-muted-foreground">
                v{currentVersion || 'Unknown'}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Installed
            </Badge>
          </div>

          <Separator />

          {/* Update Check */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Check for Updates</p>
                <p className="text-sm text-muted-foreground">
                  {lastChecked 
                    ? `Last checked: ${formatDate(lastChecked)}`
                    : 'Never checked'
                  }
                </p>
              </div>
              <Button
                onClick={handleCheckForUpdates}
                disabled={isChecking}
                variant="outline"
                size="sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Now
                  </>
                )}
              </Button>
            </div>

            {/* Update Available */}
            {updateInfo && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-green-600" />
                    Update Available
                  </CardTitle>
                  <CardDescription>
                    Version {updateInfo.version} is ready to install
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Version</p>
                      <p className="text-sm text-muted-foreground">
                        v{updateInfo.version} • Released {formatDate(new Date(updateInfo.date))}
                      </p>
                    </div>
                    <Button onClick={handleInstallUpdate} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Install Update
                    </Button>
                  </div>

                  {updateInfo.body && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Release Notes:</p>
                      <div className="text-sm text-muted-foreground bg-white p-3 rounded border">
                        {updateInfo.body}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Auto-update Settings */}
          <div className="space-y-3">
            <div>
              <p className="font-medium">Automatic Updates</p>
              <p className="text-sm text-muted-foreground">
                The app automatically checks for updates on startup
              </p>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">Update Process:</p>
              <ul className="space-y-1">
                <li>• Updates are checked automatically when the app starts</li>
                <li>• You'll be notified when an update is available</li>
                <li>• Updates are downloaded and verified before installation</li>
                <li>• The app will restart after successful installation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
