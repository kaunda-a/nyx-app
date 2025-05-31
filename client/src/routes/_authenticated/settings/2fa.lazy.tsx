import { createLazyFileRoute } from '@tanstack/react-router'
import Settings2FA from '@/admin/settings/settings-dashboard/2fa'

export const Route = createLazyFileRoute('/_authenticated/settings/2fa')({
  component: Settings2FA,
})
