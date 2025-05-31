import { useState, type JSX } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GlassCard } from './ui/glass-card'
import { NeonText } from './ui/neon-text'

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: JSX.Element
  }[]
}

export default function SidebarNav({
  className,
  items,
  ...props
}: SidebarNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [val, setVal] = useState(pathname ?? '/settings')

  const handleSelect = (e: string) => {
    setVal(e)
    navigate({ to: e })
  }

  return (
    <>
      <div className='p-1 md:hidden'>
        <GlassCard variant="dark" intensity="medium" className="p-0">
          <Select value={val} onValueChange={handleSelect}>
            <SelectTrigger className='h-12 sm:w-48 border-0 bg-transparent backdrop-blur-none'>
              <SelectValue placeholder='Settings Menu' />
            </SelectTrigger>
            <SelectContent className="bg-black/40 backdrop-blur-md border-gray-800">
              {items.map((item) => (
                <SelectItem
                  key={item.href}
                  value={item.href}
                  className={cn(
                    val === item.href ? 'bg-black/30 text-primary' : 'text-white',
                    'hover:bg-black/50'
                  )}
                >
                  <div className='flex gap-x-4 px-2 py-1'>
                    <span className={cn(
                      'scale-125',
                      val === item.href ? 'text-primary' : ''
                    )}>
                      {item.icon}
                    </span>
                    <span className='text-md'>
                      {val === item.href ? (
                        <NeonText variant="blue" intensity="low">
                          {item.title}
                        </NeonText>
                      ) : (
                        item.title
                      )}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </GlassCard>
      </div>

      <GlassCard
        variant="dark"
        intensity="low"
        className='hidden w-full min-w-40 px-1 py-2 md:block'
      >
        <ScrollArea
          orientation='horizontal'
          type='always'
        >
          <nav
            className={cn(
              'flex space-x-2 py-1 lg:flex-col lg:space-x-0 lg:space-y-1',
              className
            )}
            {...props}
          >
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  pathname === item.href
                    ? 'bg-black/30 hover:bg-black/40 moving-border'
                    : 'hover:bg-black/20 hover:backdrop-blur-sm',
                  'justify-start transition-all duration-300'
                )}
              >
                <span className={cn(
                  'mr-2 transition-transform duration-300',
                  pathname === item.href ? 'scale-110 text-primary' : ''
                )}>
                  {item.icon}
                </span>
                {pathname === item.href ? (
                  <NeonText
                    variant="blue"
                    intensity="low"
                  >
                    {item.title}
                  </NeonText>
                ) : (
                  item.title
                )}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </GlassCard>
    </>
  )
}
