import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNumbers } from '../../context/numbers-context'
import { numbersApi } from '../../api/numbers-api'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
}

export function RefreshNumberDialog({ open }: Props) {
  const { setOpen, currentNumber } = useNumbers()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { mutate: refreshNumber, isPending } = useMutation({
    mutationFn: () => 
      numbersApi.refresh(currentNumber!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] })
      toast({ title: 'Number refreshed successfully' })
      setOpen(null)
    },
    onError: () => {
      toast({ 
        title: 'Failed to refresh number',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={() => setOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refresh Number</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Are you sure you want to refresh the number {currentNumber?.number}?
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
          <Button 
            onClick={() => refreshNumber()}
            disabled={isPending}
          >
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}