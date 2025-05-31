
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { ProfileProvider } from './context/profile-context'
import { ProfileDashboard } from './profile-dashboard'

export default function Profiles() {
  return (
      <ProfileProvider>
          <Header>
            <div className="ml-auto flex items-center space-x-4">
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          <Main>
            <div className="flex items-center">
              <Breadcrumbs
                items={[
                  {
                    title: 'Browser Profiles',
                    href: '/profiles',
                  }
                ]}
              />
            </div>
            <ProfileDashboard />
          </Main>
      </ProfileProvider>
  );
}

