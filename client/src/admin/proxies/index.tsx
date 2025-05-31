import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProxiesProvider } from './context/proxies-context'
import { ProxiesDashboard } from './proxies-dashboard'
import { Breadcrumbs } from '@/components/ui/breadcrumb'

function ProxiesContent() {
  return <ProxiesDashboard />
}

export default function Proxies() {
  return (
    <ProxiesProvider>
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
                          title: 'Proxy Manager',
                          href: '/proxies',
                        }
                      ]}
                    />
            </div>
        <ProxiesContent />
      </Main>
    </ProxiesProvider>
  )
}
