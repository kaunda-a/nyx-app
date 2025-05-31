import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsAccount from '@/admin/settings/settings-dashboard/account'

export const Route = createLazyFileRoute('/_authenticated/settings/account')({
  component: SettingsAccount,
})
