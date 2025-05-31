import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { IconLogout, IconArrowRight } from '@tabler/icons-react'

export default function LogoutSuccess() {
  const navigate = useNavigate()
  const confettiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initial confetti burst
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    // Cleanup
    return () => clearInterval(interval)
  }, [])

  // Auto-navigate after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate({ to: '/home' })
    }, 5000)

    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          {/* Animated logout icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <IconLogout className="w-12 h-12 text-primary" />
            </motion.div>
          </motion.div>

          {/* Text content with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold tracking-tight">
              See you soon! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              You've been successfully logged out.
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="h-1 w-full bg-secondary overflow-hidden rounded-full"
          >
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/sign-in' })}
              className="group"
            >
              Sign back in
              <motion.span
                className="inline-block ml-2"
                animate={{
                  x: [0, 4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <IconArrowRight className="w-4 h-4" />
              </motion.span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/' })}
            >
              Back to home
            </Button>
          </motion.div>

          {/* Auto-redirect message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-muted-foreground"
          >
            You'll be automatically redirected to the home page in 5 seconds
          </motion.p>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute -z-10 inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-2xl" />
        </motion.div>
      </motion.div>
    </div>
  )
}