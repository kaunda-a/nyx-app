import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsUpdate from '@/admin/settings/settings-dashboard/update'

export const Route = createLazyFileRoute('/_authenticated/settings/update')({
  component: SettingsUpdate,
})
