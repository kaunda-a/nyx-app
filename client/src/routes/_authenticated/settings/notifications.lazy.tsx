import { createLazyFileRoute } from '@tanstack/react-router'
import SettingsNotifications from '@/admin/settings/settings-dashboard/notifications'

export const Route = createLazyFileRoute('/_authenticated/settings/notifications')({
  component: SettingsNotifications,
})
