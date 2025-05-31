import { useEffect } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTheme } from '@/provider/theme-context'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative h-8 w-16 rounded-full bg-secondary/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
    >
      <motion.div 
        className="absolute inset-y-1 left-1 h-6 w-6 rounded-full bg-primary"
        animate={{
          left: theme === 'dark' ? '2.25rem' : '0.25rem',
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
        }}
      />
      <div className="relative flex h-full">
        <div className="flex h-full flex-1 items-center justify-center">
          <IconSun 
            size={14} 
            className={cn(
              "transition-all duration-200",
              theme === 'light' ? "opacity-100" : "opacity-40"
            )}
          />
        </div>
        <div className="flex h-full flex-1 items-center justify-center">
          <IconMoon 
            size={14} 
            className={cn(
              "transition-all duration-200",
              theme === 'dark' ? "opacity-100" : "opacity-40"
            )}
          />
        </div>
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
