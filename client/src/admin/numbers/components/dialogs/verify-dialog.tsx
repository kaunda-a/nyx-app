import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNumbers } from '../../context/numbers-context'
import { numbersApi } from '../../api/numbers-api'
import { useToast } from '@/hooks/use-toast'

interface Props {
  open: boolean
}

export function VerifyNumberDialog({ open }: Props) {
  const { setOpen, currentNumber } = useNumbers()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { mutate: verifyNumber, isPending } = useMutation({
    mutationFn: () => 
      numbersApi.verify(currentNumber!.id, 'default'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numbers'] })
      toast({ title: 'Number verified successfully' })
      setOpen(null)
    },
    onError: () => {
      toast({ 
        title: 'Failed to verify number',
        variant: 'destructive'
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={() => setOpen(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Number</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Are you sure you want to verify the number {currentNumber?.number}?
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(null)}>
            Cancel
          </Button>
          <Button 
            onClick={() => verifyNumber()}
            disabled={isPending}
          >
            Verify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}