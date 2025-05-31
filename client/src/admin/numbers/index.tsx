import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { NumbersProvider } from './context/numbers-context'
import { EnhancedNumbersDashboard } from './components/enhanced-numbers-dashboard'
import { NumbersDialogs } from './components/numbers-dialogs'
import { Breadcrumbs } from '@/components/ui/breadcrumb'

export default function Numbers() {
  return (
    <NumbersProvider>
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
               <div className="flex items-center">
                    <Breadcrumbs
                      items={[
                        {
                          title: 'Cloud Numbers',
                          href: '/phones',
                        }
                      ]}
                    />
                  </div>
        <EnhancedNumbersDashboard />
      </Main>

      <NumbersDialogs />
    </NumbersProvider>
  )
}