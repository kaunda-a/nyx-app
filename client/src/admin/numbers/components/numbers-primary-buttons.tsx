import { Button } from '@/components/ui/button'
import { IconPlus } from '@tabler/icons-react'
import { useNumbers } from '../context/numbers-context'

export function NumbersPrimaryButtons() {
  const { setOpen } = useNumbers()

  return (
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => setOpen('acquire')}
        className="flex items-center gap-2"
      >
        <IconPlus size={20} />
        Acquire Number
      </Button>
    </div>
  )
}
