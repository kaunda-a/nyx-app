import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNumbers } from '../../context/numbers-context'
import { numbersApi } from '../../api/numbers-api'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
}

export function DeleteNumberDialog({ open }: Props) {
  const { setOpen, currentNumber } = useNumbers()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { mutate: deleteNumber, isPending } = useMutation({
    mutationFn: () => 
      numbersApi.release(currentNumber!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] })
      toast({ title: 'Number deleted successfully' })
      setOpen(null)
    },
    onError: () => {
      toast({ 
        title: 'Failed to delete number',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={() => setOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Number</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Are you sure you want to delete the number {currentNumber?.number}? This action cannot be undone.
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={() => deleteNumber()}
            disabled={isPending}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}