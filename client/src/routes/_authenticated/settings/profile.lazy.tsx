import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsProfile from '@/admin/settings/settings-dashboard/profile'

export const Route = createLazyFileRoute('/_authenticated/settings/profile')({
  component: SettingsProfile,
})
