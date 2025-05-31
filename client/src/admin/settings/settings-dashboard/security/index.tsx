import { SecurityForm } from './security-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsSecurity() {
  return (
    <SettingsProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Security Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your account security, view recent activity, and analyze security events.
          </p>
        </div>
        <SecurityForm />
      </div>
    </SettingsProvider>
  )
}
