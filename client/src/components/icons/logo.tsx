
import { motion } from 'framer-motion'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center gap-3 px-2">
          <div className={cn('relative inline-flex items-center justify-center', className)}>
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/20 blur-lg"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Custom Nyx Spider Logo */}
            <motion.svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative"
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Main body - hexagon */}
              <motion.path
                d="M12 4L18 8V16L12 20L6 16V8L12 4Z"
                className="stroke-primary"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              
              {/* Spider legs */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {/* Left legs */}
                <path d="M6 12L3 9" className="stroke-primary" strokeWidth="1.5" />
                <path d="M6 12L2 12" className="stroke-primary" strokeWidth="1.5" />
                <path d="M6 12L3 15" className="stroke-primary" strokeWidth="1.5" />
                
                {/* Right legs */}
                <path d="M18 12L21 9" className="stroke-primary" strokeWidth="1.5" />
                <path d="M18 12L22 12" className="stroke-primary" strokeWidth="1.5" />
                <path d="M18 12L21 15" className="stroke-primary" strokeWidth="1.5" />
              </motion.g>
              
              {/* Eyes */}
              <motion.g
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <circle cx="10" cy="12" r="1" className="fill-primary" />
                <circle cx="14" cy="12" r="1" className="fill-primary" />
              </motion.g>
            </motion.svg>
          </div>
          
          <motion.div 
            className="grid flex-1 text-left text-sm leading-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.span 
              className="truncate font-semibold"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
             
            </motion.span>
            <span className="truncate text-xs text-muted-foreground">
             
            </span>
          </motion.div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}