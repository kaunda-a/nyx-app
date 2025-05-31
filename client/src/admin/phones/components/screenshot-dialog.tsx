import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { IconCamera, IconDownload, IconRefresh } from '@tabler/icons-react'
import { usePhone } from '../context/phone-context'

interface ScreenshotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScreenshotDialog({ open, onOpenChange }: ScreenshotDialogProps) {
  const { currentDevice, takeScreenshot } = usePhone()
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Take screenshot when dialog opens
  useEffect(() => {
    if (open && currentDevice) {
      handleTakeScreenshot()
    }
  }, [open, currentDevice])

  // Clear screenshot when dialog closes
  useEffect(() => {
    if (!open) {
      setScreenshotUrl(null)
      setError(null)
    }
  }, [open])

  const handleTakeScreenshot = async () => {
    if (!currentDevice) return

    setIsLoading(true)
    setError(null)

    try {
      const url = await takeScreenshot(currentDevice.id)
      setScreenshotUrl(url)
    } catch (err) {
      setError('Failed to take screenshot. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!screenshotUrl) return

    // Create a temporary link element
    const a = document.createElement('a')
    a.href = screenshotUrl
    a.download = `${currentDevice?.name}-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Device Screenshot</DialogTitle>
          <DialogDescription>
            View and capture the current screen of {currentDevice?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {isLoading ? (
            <div className="w-full aspect-[9/16] max-w-[300px]">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleTakeScreenshot}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : screenshotUrl ? (
            <div className="relative group">
              <img
                src={screenshotUrl}
                alt="Device Screenshot"
                className="max-w-[300px] rounded-lg border shadow-sm"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                  <IconDownload className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No screenshot available</p>
              <Button onClick={handleTakeScreenshot}>
                <IconCamera className="h-4 w-4 mr-2" />
                Take Screenshot
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleTakeScreenshot}
            disabled={isLoading}
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
