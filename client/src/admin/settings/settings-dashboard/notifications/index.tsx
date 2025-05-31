import { NotificationsForm } from './notifications-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsNotifications() {
  return (
    <SettingsProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Security Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Configure how you receive security alerts and account notifications to stay informed about important events.
          </p>
        </div>
        <NotificationsForm />
      </div>
    </SettingsProvider>
  )
}
