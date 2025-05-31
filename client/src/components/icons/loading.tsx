import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: number
  showSpinner?: boolean
}

export function Loading({ className, size = 32, showSpinner = true }: LoadingProps) {
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Outer glow effect */}
      {showSpinner && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-lg"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Spinning Logo */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
        animate={{ 
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {/* Spinning hexagon outline */}
        <motion.path
          d="M12 4L18 8V16L12 20L6 16V8L12 4Z"
          className="stroke-primary"
          strokeWidth="1.5"
          animate={{
            strokeDasharray: ["1, 100", "100, 100"],
            strokeDashoffset: [0, -100],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Pulsing spider legs */}
        <motion.g
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
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

        {/* Blinking eyes */}
        <motion.g
          animate={{
            scale: [1, 0.8, 1],
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

      {/* Optional loading progress indicator */}
      {showSpinner && (
        <motion.div
          className="absolute -inset-2"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 50 5 A 45 45 0 1 1 49.9999 5"
              className="stroke-primary/20"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength="100"
            />
            <motion.path
              d="M 50 5 A 45 45 0 1 1 49.9999 5"
              className="stroke-primary"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength="100"
              animate={{
                strokeDasharray: "25 75",
                strokeDashoffset: [0, -100],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </svg>
        </motion.div>
      )}
    </div>
  )
}