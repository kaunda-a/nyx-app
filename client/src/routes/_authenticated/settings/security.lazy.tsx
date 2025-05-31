import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsSecurity from '@/admin/settings/settings-dashboard/security'

export const Route = createLazyFileRoute('/_authenticated/settings/security')({
  component: SettingsSecurity,
})
