import { useNumbers } from '../context/numbers-context'
import { AcquireNumberDialog } from './dialogs/acquire-dialog'
import { VerifyNumberDialog } from './dialogs/verify-dialog'
import { RefreshNumberDialog } from './dialogs/refresh-dialog'
import { DeleteNumberDialog } from './dialogs/delete-dialog'

export function NumbersDialogs() {
  const { open } = useNumbers()

  return (
    <>
      <AcquireNumberDialog open={open === 'acquire'} />
      <VerifyNumberDialog open={open === 'verify'} />
      <RefreshNumberDialog open={open === 'refresh'} />
      <DeleteNumberDialog open={open === 'delete'} />
    </>
  )
}