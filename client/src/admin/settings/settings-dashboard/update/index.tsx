import { UpdateForm } from './update-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsUpdate() {
  return (
    <SettingsProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Software Update</h3>
          <p className="text-sm text-muted-foreground">
            Manage app updates, check for new versions, and configure automatic update settings.
          </p>
        </div>
        <UpdateForm />
      </div>
    </SettingsProvider>
  )
}
