import { create } from 'zustand'
import type { VirtualDevice, DeviceFilters } from '../data/schema'

interface VirtualDeviceStore {
  devices: VirtualDevice[]
  filters: DeviceFilters
  setDevices: (devices: VirtualDevice[]) => void
  addDevice: (device: VirtualDevice) => void
  updateDevice: (id: string, updates: Partial<VirtualDevice>) => void
  removeDevice: (id: string) => void
  setFilters: (filters: DeviceFilters) => void
}

export const useVirtualDeviceStore = create<VirtualDeviceStore>((set) => ({
  devices: [],
  filters: {},
  setDevices: (devices) => set({ devices }),
  addDevice: (device) => set((state) => ({ 
    devices: [...state.devices, device] 
  })),
  updateDevice: (id, updates) => set((state) => ({
    devices: state.devices.map((device) =>
      device.id === id ? { ...device, ...updates } : device
    )
  })),
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter((device) => device.id !== id)
  })),
  setFilters: (filters) => set({ filters })
}))