import {
 IconBarrierBlock,
  IconBrandFirefox,
  IconBrowserCheck,
  IconDeviceMobile,
  IconHash,
  IconHelp,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconRobot,
  IconServer,
  IconSettings,
  IconTool,
  IconUserCog,

} from '@tabler/icons-react'
import { Logo } from '@/components/icons/logo'
import { type SidebarData } from '../types'

export const getSidebarData = (user: any): SidebarData => ({
  user: {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0]?.toUpperCase() || 'USER',
    email: user?.email || '',
    avatar: user?.user_metadata?.avatar_type || 'abstract-1', // Store avatar type in user metadata
  },
  logo: Logo,
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Crawlers',
          url: '/crawlers',
          icon: IconRobot,
        },
        {
          title: 'Phones',
          url: '/phones',
          badge: '3',
          icon: IconDeviceMobile,
        },
        {
          title: 'Profiles',
          url: '/profiles',
          badge: '1',
          icon: IconBrandFirefox,
        },
        {
          title: 'Proxies',
          url: '/proxies',
          icon: IconServer,
        },
        {
          title: 'Numbers',
          url: '/numbers',
          icon: IconHash,
        },
      ],
    },

    {
      title: 'Admin',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
})
