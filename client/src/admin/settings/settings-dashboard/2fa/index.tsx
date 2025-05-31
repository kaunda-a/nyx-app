import ContentSection from '../../components/content-section'
import { TwoFactorAuthenticationForm } from './2fa-form'
import { SettingsProvider } from '../../context/settings-context'

export default function SettingsTwoFactor() {
  return (
    <SettingsProvider>
      <ContentSection
        title='Two-Factor Authentication'
        desc='Enhance your account security with two-factor authentication (2FA). Add an extra layer of protection to your account.'
      >
        <TwoFactorAuthenticationForm />
      </ContentSection>
    </SettingsProvider>
  )
}
