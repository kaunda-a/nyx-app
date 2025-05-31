import React, { createContext, useContext, useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleServerError } from '@/lib/handle-server-error'
import { phonesApi } from '../api/phones-api'
import {
  VirtualDevice,
  DeviceStatus,
  DeviceSpecs,
  Protection,
  DeviceFilters
} from '../data/schema'

type PhoneDialogType = 'create' | 'edit' | 'delete' | 'configure' | 'restart' | 'apps' | 'terminal' | 'screenshot'

interface PhoneContextType {
  // State
  devices: VirtualDevice[]
  loading: boolean
  filters: DeviceFilters
  open: PhoneDialogType | null
  currentDevice: VirtualDevice | null

  // Setters
  setOpen: (type: PhoneDialogType | null) => void
  setCurrentDevice: (device: VirtualDevice | null) => void
  setFilters: (filters: DeviceFilters) => void

  // Device operations
  fetchDevices: () => Promise<void>
  createDevice: (deviceData: Omit<VirtualDevice, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateDevice: (id: string, updates: Partial<VirtualDevice>) => Promise<void>
  deleteDevice: (id: string) => Promise<void>

  // Device control
  startDevice: (id: string) => Promise<void>
  stopDevice: (id: string) => Promise<void>
  restartDevice: (id: string) => Promise<void>

  // Device configuration
  updateDeviceSpecs: (id: string, specs: Partial<DeviceSpecs>) => Promise<void>
  updateDeviceProtection: (id: string, protection: Partial<Protection>) => Promise<void>

  // Device actions
  installApp: (id: string, appUrl: string) => Promise<void>
  launchApp: (id: string, packageName: string) => Promise<void>
  takeScreenshot: (id: string) => Promise<string>
  getDeviceStatus: (id: string) => Promise<{
    status: DeviceStatus
    systemCheck: boolean
    containerRunning: boolean
    initStatus: boolean
  }>
}

const PhoneContext = createContext<PhoneContextType | null>(null)

export function PhoneProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()

  // State
  const [devices, setDevices] = useState<VirtualDevice[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<DeviceFilters>({})
  const [open, setOpen] = useState<PhoneDialogType | null>(null)
  const [currentDevice, setCurrentDevice] = useState<VirtualDevice | null>(null)

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedDevices = await phonesApi.getDevices()
      setDevices(fetchedDevices)
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to fetch devices',
          description: errorMessage
        })
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Create device
  const createDevice = useCallback(async (deviceData: Omit<VirtualDevice, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDevice = await phonesApi.createDevice(deviceData)
      setDevices(prev => [...prev, newDevice])
      toast({
        title: 'Device created',
        description: `${newDevice.name} has been created successfully`
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to create device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Update device
  const updateDevice = useCallback(async (id: string, updates: Partial<VirtualDevice>) => {
    try {
      const updatedDevice = await phonesApi.updateDevice(id, updates)
      setDevices(prev =>
        prev.map(device => device.id === id ? updatedDevice : device)
      )
      toast({
        title: 'Device updated',
        description: `${updatedDevice.name} has been updated successfully`
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to update device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Delete device
  const deleteDevice = useCallback(async (id: string) => {
    try {
      await phonesApi.deleteDevice(id)
      setDevices(prev => prev.filter(device => device.id !== id))
      toast({
        title: 'Device deleted',
        description: 'Virtual device has been deleted successfully'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to delete device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Start device
  const startDevice = useCallback(async (id: string) => {
    try {
      const updatedDevice = await phonesApi.startDevice(id)
      setDevices(prev =>
        prev.map(device => device.id === id ? updatedDevice : device)
      )
      toast({
        title: 'Device started',
        description: `${updatedDevice.name} is now running`
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to start device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Stop device
  const stopDevice = useCallback(async (id: string) => {
    try {
      const updatedDevice = await phonesApi.stopDevice(id)
      setDevices(prev =>
        prev.map(device => device.id === id ? updatedDevice : device)
      )
      toast({
        title: 'Device stopped',
        description: `${updatedDevice.name} has been stopped`
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to stop device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Restart device
  const restartDevice = useCallback(async (id: string) => {
    try {
      await stopDevice(id)
      await startDevice(id)
      toast({
        title: 'Device restarted',
        description: 'Virtual device has been restarted successfully'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to restart device',
          description: errorMessage
        })
      }
      throw err
    }
  }, [stopDevice, startDevice, toast])

  // Update device specs
  const updateDeviceSpecs = useCallback(async (id: string, specs: Partial<DeviceSpecs>) => {
    try {
      const updatedDevice = await phonesApi.updateDeviceSpecs(id, specs)
      setDevices(prev =>
        prev.map(device => device.id === id ? updatedDevice : device)
      )
      toast({
        title: 'Specs updated',
        description: 'Device specifications have been updated'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to update specs',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Update device protection
  const updateDeviceProtection = useCallback(async (id: string, protection: Partial<Protection>) => {
    try {
      const updatedDevice = await phonesApi.updateDeviceProtection(id, protection)
      setDevices(prev =>
        prev.map(device => device.id === id ? updatedDevice : device)
      )
      toast({
        title: 'Protection updated',
        description: 'Device protection settings have been updated'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to update protection',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Install app
  const installApp = useCallback(async (id: string, appUrl: string) => {
    try {
      await phonesApi.installApp(id, appUrl)
      toast({
        title: 'App installed',
        description: 'Application has been installed successfully'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to install app',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Launch app
  const launchApp = useCallback(async (id: string, packageName: string) => {
    try {
      await phonesApi.launchApp(id, packageName)
      toast({
        title: 'App launched',
        description: 'Application has been launched successfully'
      })
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to launch app',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Take screenshot
  const takeScreenshot = useCallback(async (id: string) => {
    try {
      const screenshotUrl = await phonesApi.takeScreenshot(id)
      toast({
        title: 'Screenshot taken',
        description: 'Device screenshot has been captured'
      })
      return screenshotUrl
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to take screenshot',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  // Get device status
  const getDeviceStatus = useCallback(async (id: string) => {
    try {
      return await phonesApi.getDeviceStatus(id)
    } catch (err) {
      const errorMessage = handleServerError(err)
      if (typeof errorMessage === 'string') {
        toast({
          variant: 'destructive',
          title: 'Failed to get device status',
          description: errorMessage
        })
      }
      throw err
    }
  }, [toast])

  const value = {
    // State
    devices,
    loading,
    filters,
    open,
    currentDevice,

    // Setters
    setOpen,
    setCurrentDevice,
    setFilters,

    // Device operations
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,

    // Device control
    startDevice,
    stopDevice,
    restartDevice,

    // Device configuration
    updateDeviceSpecs,
    updateDeviceProtection,

    // Device actions
    installApp,
    launchApp,
    takeScreenshot,
    getDeviceStatus
  }

  return (
    <PhoneContext.Provider value={value}>
      {children}
    </PhoneContext.Provider>
  )
}

export function usePhone() {
  const context = useContext(PhoneContext)
  if (!context) {
    throw new Error('usePhone must be used within a PhoneProvider')
  }
  return context
}
