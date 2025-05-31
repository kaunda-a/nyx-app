import ContentSection from '../../components/content-section'
import { AccountForm } from './account-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsAccount() {
  return (
    <SettingsProvider>
      <ContentSection
        title='Account Security'
        desc='Manage your account security settings, password, and two-factor authentication.'
      >
        <AccountForm />
      </ContentSection>
    </SettingsProvider>
  )
}
