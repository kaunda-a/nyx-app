import { z } from 'zod'

// Protection Schema
export const protectionSchema = z.object({
  level: z.enum(['basic', 'enhanced', 'maximum']),
  features: z.object({
    deviceFingerprint: z.boolean(),
    locationSpoofing: z.boolean(),
    sensorSimulation: z.boolean(),
    appBehavior: z.boolean(),
  })
})

export type Protection = z.infer<typeof protectionSchema>

// DeviceSpecs Schema
export const deviceSpecsSchema = z.object({
  cpu: z.number(),
  memory: z.number(),
  storage: z.number()
})

export type DeviceSpecs = z.infer<typeof deviceSpecsSchema>

// Create Device Schema
export const createDeviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  os: z.enum(['ios', 'android']),
  version: z.string().min(1, "Version is required"),
  model: z.string().min(1, "Model is required"),
  specs: deviceSpecsSchema,
  protection: protectionSchema
})

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>

// Device Status Type
export const deviceStatusSchema = z.enum(['running', 'stopped', 'error'])
export type DeviceStatus = z.infer<typeof deviceStatusSchema>

// OS Version Types
export const androidVersionSchema = z.enum(['10', '11', '12', '13'])
export type AndroidVersion = z.infer<typeof androidVersionSchema>

export const iosVersionSchema = z.enum(['14', '15', '16'])
export type IOSVersion = z.infer<typeof iosVersionSchema>

// Virtual Device Schema
export const virtualDeviceSchema = createDeviceSchema.extend({
  id: z.string(),
  status: deviceStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})

export type VirtualDevice = z.infer<typeof virtualDeviceSchema>

// Device List Schema
export const deviceListSchema = z.array(virtualDeviceSchema)

// Device Filters Schema
export const deviceFiltersSchema = z.object({
  search: z.string().optional(),
  os: z.enum(['ios', 'android']).optional(),
  status: deviceStatusSchema.optional(),
  protectionLevel: z.enum(['basic', 'enhanced', 'maximum']).optional()
})

export type DeviceFilters = z.infer<typeof deviceFiltersSchema>
