import { Outlet } from '@tanstack/react-router'
import {
  IconBrowserCheck,
  IconNotification,
  IconPalette,
  IconTool,
  IconUser,
  IconLock,
  IconSettings,
  IconFingerprint,
  IconShieldLock,
  IconEye,
} from '@tabler/icons-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import SidebarNav from './components/sidebar-nav'
import { SettingsProvider } from './context/settings-context'
import {
  SettingsHeader,
  GlassCard,
  NeonText,
  GradientBorder
} from './components'

// Import CSS effects
import './styles/effects.css'

export default function Settings() {
  return (
    <SettingsProvider>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <GradientBorder
          variant="rainbow"
          animate={true}
          intensity="low"
          borderWidth="thin"
          className="mb-6"
        >
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <NeonText
                  variant="purple"
                  intensity="medium"
                  as="h1"
                  className="text-3xl font-bold tracking-tight"
                >
                  Nyx Settings
                </NeonText>
                <p className='text-muted-foreground'>
                  Configure your undetectable browser experience and manage account preferences.
                </p>
              </div>
            </div>
          </div>
        </GradientBorder>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <GlassCard
            variant="default"
            intensity="low"
            hoverEffect={false}
            className='flex w-full overflow-y-hidden p-6'
          >
            <Outlet />
          </GlassCard>
        </div>
      </Main>
    </SettingsProvider>
  )
}

const sidebarNavItems = [
  {
    title: 'Profile',
    icon: <IconUser size={18} />,
    href: '/settings',
  },
  {
    title: 'Account',
    icon: <IconTool size={18} />,
    href: '/settings/account',
  },

  {
    title: 'Notifications',
    icon: <IconNotification size={18} />,
    href: '/settings/notifications',
  },

  {
    title: '2FA',
    icon: <IconFingerprint size={18} />,
    href: '/settings/2FA',
  },
  {
    title: 'Security',
    icon: <IconLock size={18} />,
    href: '/settings/security',
  },
  {
    title: 'Software Update',
    icon: <IconSettings size={18} />,
    href: '/settings/update',
  },
]
