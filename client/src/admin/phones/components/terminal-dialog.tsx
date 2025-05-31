import { useState, useRef, useEffect } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { IconTerminal2, IconSend } from '@tabler/icons-react'
import { usePhone } from '../context/phone-context'

interface TerminalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TerminalDialog({ open, onOpenChange }: TerminalDialogProps) {
  const { currentDevice, controlDevice } = usePhone()
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<{ type: 'input' | 'output', content: string }[]>([
    { type: 'output', content: 'Connected to device terminal.' },
    { type: 'output', content: 'Type "help" for available commands.' },
  ])
  const [isExecuting, setIsExecuting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [history])

  const handleSendCommand = async () => {
    if (!currentDevice || !command.trim()) return

    // Add command to history
    setHistory(prev => [...prev, { type: 'input', content: command }])

    setIsExecuting(true)
    try {
      // Mock command execution
      let response = ''

      if (command === 'help') {
        response = `Available commands:
- help: Show this help message
- ls: List files in current directory
- ps: List running processes
- netstat: Show network connections
- getprop: Show device properties
- settings: Manage device settings
- input: Simulate user input
- am: Activity manager
- pm: Package manager`
      } else if (command.startsWith('ls')) {
        response = `emulated/
sdcard/
Download/
DCIM/
Pictures/
Android/
Movies/
Music/`
      } else if (command === 'ps') {
        response = `USER     PID   PPID  VSZ  RSS WCHAN            ADDR S NAME
root      1     0     8904 788  0                  S /init
system    234   1     9876 1024 0                  S system_server
u0_a123   567   234   7654 890  0                  S com.android.chrome
u0_a45    678   234   6543 780  0                  S com.google.android.gm`
      } else if (command === 'netstat') {
        response = `Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 127.0.0.1:5037          0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:27042         0.0.0.0:*               LISTEN
tcp        0      0 192.168.1.5:44231       142.250.74.110:443      ESTABLISHED`
      } else if (command === 'getprop') {
        response = `[ro.build.version.release]: [12]
[ro.build.version.sdk]: [31]
[ro.product.manufacturer]: [Google]
[ro.product.model]: [Pixel 6]
[ro.product.name]: [raven]
[ro.serialno]: [EMULATOR28X0X0X0]
[ro.hardware]: [waydroid]`
      } else {
        response = `Command executed: ${command}`
      }

      // Add response to history after a small delay to simulate execution
      setTimeout(() => {
        setHistory(prev => [...prev, { type: 'output', content: response }])
        setIsExecuting(false)
      }, 500)

      // Clear command input
      setCommand('')

      // In a real implementation, you would call the API
      // await controlDevice(currentDevice.id, 'execute_command', { command })
    } catch (error) {
      setHistory(prev => [...prev, { type: 'output', content: `Error: ${error}` }])
      setIsExecuting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Terminal</DialogTitle>
          <DialogDescription>
            Execute shell commands on {currentDevice?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 p-4 font-mono text-sm bg-black text-green-400 rounded-md" ref={scrollAreaRef}>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {entry.type === 'input' ? (
                    <div className="flex items-start">
                      <span className="text-blue-400 mr-2">$</span>
                      <span>{entry.content}</span>
                    </div>
                  ) : (
                    <div className="pl-4">{entry.content}</div>
                  )}
                </div>
              ))}
              {isExecuting && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <span>Executing...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-black rounded-md px-3 py-2">
              <IconTerminal2 className="h-4 w-4 text-green-400" />
              <Input
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCommand()}
                placeholder="Enter command..."
                className="border-0 bg-transparent text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-green-800"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSendCommand}
              disabled={!command.trim() || isExecuting}
            >
              <IconSend className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
