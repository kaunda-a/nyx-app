import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { Logo } from '@/components/icons/logo'
import { getSidebarData } from './data/sidebar-data'
import { useAuthStore } from '@/auth/api/stores/authStore'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.auth.user)
  const sidebarData = getSidebarData(user)

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <div className="flex items-center">
          <div className="flex flex-col justify-center mr-[-0.25rem] z-10">
            <span className="font-bold text-base leading-none tracking-tight">Nyx</span>
            <span className="text-[10px] text-muted-foreground leading-tight tracking-wide uppercase">undetectable</span>
          </div>
          <Logo className="h-8 w-8 relative" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
