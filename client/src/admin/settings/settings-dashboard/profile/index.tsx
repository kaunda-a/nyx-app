import ProfileForm from './profile-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsProfile() {
  return (
    <SettingsProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account Overview</h3>
          <p className="text-sm text-muted-foreground">
            View your account information, manage security settings, and perform account actions.
          </p>
        </div>
        <ProfileForm />
      </div>
    </SettingsProvider>
  )
}
