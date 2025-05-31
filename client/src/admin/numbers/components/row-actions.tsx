import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  IconDots,
  IconRefresh,
  IconShield,
  IconTrash 
} from '@tabler/icons-react'
import { useNumbers } from '../context/numbers-context'
import { NumberDetails } from '../types'

interface DataTableRowActionsProps {
  row: Row<NumberDetails>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentNumber } = useNumbers()

  const handleAction = (action: 'verify' | 'refresh' | 'delete') => {
    setCurrentNumber(row.original)
    setOpen(action)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <IconDots className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleAction('verify')}
          className="flex items-center gap-2"
        >
          <IconShield size={16} />
          Verify
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction('refresh')}
          className="flex items-center gap-2"
        >
          <IconRefresh size={16} />
          Refresh
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAction('delete')}
          className="flex items-center gap-2 text-destructive"
        >
          <IconTrash size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
