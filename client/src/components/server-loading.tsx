import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { motion } from 'framer-motion'
import { Logo } from '@/components/icons/logo'

interface ServerLoadingProps {
  onServerReady: () => void
}

export function ServerLoading({ onServerReady }: ServerLoadingProps) {
  const [status, setStatus] = useState('Starting server...')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let mounted = true
    
    const checkServer = async () => {
      try {
        setStatus('Checking server status...')
        setProgress(20)
        
        // Check if server is already running
        const isHealthy = await invoke<boolean>('check_server_health')
        
        if (isHealthy) {
          setStatus('Server is ready!')
          setProgress(100)
          setTimeout(() => {
            if (mounted) onServerReady()
          }, 500)
          return
        }
        
        setStatus('Starting embedded server...')
        setProgress(40)
        
// Try embedded server first, fallback to external
try {
  await invoke('start_embedded_server')
} catch (embeddedError) {
  console.log('Embedded server failed, trying external:', embeddedError)
  setStatus('Trying external server...')
  await invoke('start_server')
}
        setStatus('Waiting for server to be ready...')
        setProgress(60)
        
        // Wait for server to be ready
        await invoke<boolean>('wait_for_server_ready')
        
        setStatus('Server is ready!')
        setProgress(100)
        
        setTimeout(() => {
          if (mounted) onServerReady()
        }, 500)
        
} catch (error) {
  console.error('Server startup error:', error)
  console.log('Error details:', JSON.stringify(error))
  setStatus(`Error: ${error}. Retrying in 3 seconds...`)
  setProgress(0)
  
  // Retry after 3 seconds
  setTimeout(() => {
    if (mounted) {
      setProgress(0)
      checkServer()
    }
  }, 3000)
}
    }
    
    checkServer()
    
    return () => {
      mounted = false
    }
  }, [onServerReady])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Animated Logo */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size={80} />
        </motion.div>
        
        {/* App Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Nyx</h1>
          <p className="text-muted-foreground mt-2">Admin Dashboard</p>
        </motion.div>
        
        {/* Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">{status}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Loading Spinner */}
          {progress > 0 && progress < 100 && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </motion.div>
          )}
        </motion.div>
        
        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-xs text-muted-foreground"
        >
          <p>Starting embedded server...</p>
          <p className="mt-1">This may take a few moments on first launch.</p>
        </motion.div>
      </div>
    </div>
  )
}
