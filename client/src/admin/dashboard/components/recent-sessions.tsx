import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconBrandFirefox, IconClock, IconGlobe } from '@tabler/icons-react'

export function RecentSessions() {
  return (
    <div className='space-y-8'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9 bg-primary/10'>
          <AvatarFallback className="bg-primary/10">
            <IconBrandFirefox className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>Amazon Shopping</p>
            <p className='text-xs text-muted-foreground flex items-center'>
              <IconGlobe className="h-3 w-3 mr-1" />
              United States
            </p>
          </div>
          <div className='text-xs text-muted-foreground flex items-center'>
            <IconClock className="h-3 w-3 mr-1" />
            2 min ago
          </div>
        </div>
      </div>
      
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9 bg-primary/10'>
          <AvatarFallback className="bg-primary/10">
            <IconBrandFirefox className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>Gmail Login</p>
            <p className='text-xs text-muted-foreground flex items-center'>
              <IconGlobe className="h-3 w-3 mr-1" />
              Germany
            </p>
          </div>
          <div className='text-xs text-muted-foreground flex items-center'>
            <IconClock className="h-3 w-3 mr-1" />
            15 min ago
          </div>
        </div>
      </div>
      
      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9 bg-primary/10'>
          <AvatarFallback className="bg-primary/10">
            <IconBrandFirefox className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>Facebook</p>
            <p className='text-xs text-muted-foreground flex items-center'>
              <IconGlobe className="h-3 w-3 mr-1" />
              United Kingdom
            </p>
          </div>
          <div className='text-xs text-muted-foreground flex items-center'>
            <IconClock className="h-3 w-3 mr-1" />
            1 hour ago
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9 bg-primary/10'>
          <AvatarFallback className="bg-primary/10">
            <IconBrandFirefox className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>Twitter/X</p>
            <p className='text-xs text-muted-foreground flex items-center'>
              <IconGlobe className="h-3 w-3 mr-1" />
              Canada
            </p>
          </div>
          <div className='text-xs text-muted-foreground flex items-center'>
            <IconClock className="h-3 w-3 mr-1" />
            3 hours ago
          </div>
        </div>
      </div>

      <div className='flex items-center gap-4'>
        <Avatar className='h-9 w-9 bg-primary/10'>
          <AvatarFallback className="bg-primary/10">
            <IconBrandFirefox className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className='flex flex-1 flex-wrap items-center justify-between'>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-none'>Instagram</p>
            <p className='text-xs text-muted-foreground flex items-center'>
              <IconGlobe className="h-3 w-3 mr-1" />
              Australia
            </p>
          </div>
          <div className='text-xs text-muted-foreground flex items-center'>
            <IconClock className="h-3 w-3 mr-1" />
            5 hours ago
          </div>
        </div>
      </div>
    </div>
  )
}
