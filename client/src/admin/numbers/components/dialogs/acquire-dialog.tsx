import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNumbers } from '../../context/numbers-context'
import { numbersApi } from '../../api/numbers-api'
import { Provider } from '../../types'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
}

export function AcquireNumberDialog({ open }: Props) {
  const { setOpen } = useNumbers()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [provider, setProvider] = useState<Provider>('textnow')
  const [areaCode, setAreaCode] = useState('')

  const { mutate: acquireNumber, isPending } = useMutation({
    mutationFn: numbersApi.acquire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] })
      toast({ title: 'Number acquired successfully' })
      setOpen(null)
    },
    onError: () => {
      toast({ 
        title: 'Failed to acquire number',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={() => setOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acquire New Number</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label>Provider</label>
            <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="textnow">TextNow</SelectItem>
                <SelectItem value="google_voice">Google Voice</SelectItem>
                <SelectItem value="2ndline">2ndLine</SelectItem>
                <SelectItem value="textfree">TextFree</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label>Area Code (Optional)</label>
            <Input
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              placeholder="e.g. 415"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
          <Button 
            onClick={() => acquireNumber({ provider, area_code: areaCode })}
            disabled={isPending}
          >
            Acquire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}