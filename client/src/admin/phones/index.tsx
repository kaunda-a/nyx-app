import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { PhoneProvider, usePhone } from './context/phone-context'
import { DeviceDashboard } from './components/device-dashboard/device-dashboard'
import { DeviceSimulator } from './components/device-simulator/device-simulator'
import { DeviceWizard } from './components/device-wizard/device-wizard'
// DeviceConsole component removed
import { VirtualDevice } from './data/schema'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconDeviceMobile } from '@tabler/icons-react'

function PhoneContent() {
  const { fetchDevices, devices } = usePhone()
  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [showSimulator, setShowSimulator] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<VirtualDevice | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  // Handle device selection
  const handleDeviceSelect = (device: VirtualDevice) => {
    setSelectedDevice(device);
  };

  // Fetch devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      setIsLoading(true)
      try {
        await fetchDevices()
      } catch (error) {
        console.error('Failed to fetch devices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDevices()
  }, [fetchDevices])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        <div className="flex items-center gap-4 md:ml-auto">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex items-center justify-between" variants={itemVariants}>
            <div className="flex items-center space-x-4">
              <Breadcrumbs
                items={[
                  {
                    title: 'Virtual Phones',
                    href: '/phones',
                  },
                  // Console breadcrumbs removed
                ]}
              />
              {isLoading && (
                <div className="ml-2 animate-spin text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="dashboard" className="flex items-center">
                  <IconDeviceMobile className="h-4 w-4 mr-2" />
                  Devices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DeviceDashboard
                    onDeviceSelect={handleDeviceSelect}
                    onSimulatorOpen={(device) => {
                      setSelectedDevice(device);
                      setShowSimulator(true);
                    }}
                    // onConsoleOpen removed
                  />
                </motion.div>
              </TabsContent>

              {/* Console tab content removed */}
            </Tabs>
          </motion.div>
        </motion.div>
      </Main>

      {/* Device Wizard */}
      {showCreateWizard && (
        <DeviceWizard
          open={showCreateWizard}
          onClose={() => setShowCreateWizard(false)}
        />
      )}

      {/* Device Simulator */}
      {showSimulator && selectedDevice && (
        <DeviceSimulator
          device={selectedDevice}
          onScreenshot={(imageData) => console.log('Screenshot taken:', imageData)}
          onRestart={() => console.log('Restart device:', selectedDevice.id)}
          onClose={() => {
            setShowSimulator(false);
            setSelectedDevice(null);
          }}
        />
      )}
    </div>
  )
}

export default function Phones() {
  return (
    <PhoneProvider>
      <PhoneContent />
    </PhoneProvider>
  )
}