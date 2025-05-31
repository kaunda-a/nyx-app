import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { usePhone } from '../context/phone-context'

// Form schema
const createDeviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  os: z.enum(['android', 'ios']),
  version: z.string().min(1, 'Version is required'),
  specs: z.object({
    cpu: z.number().min(1).max(8),
    memory: z.number().min(512).max(8192),
    storage: z.number().min(1024).max(32768),
  }),
  protection: z.object({
    level: z.enum(['basic', 'enhanced', 'maximum']),
    features: z.object({
      deviceFingerprint: z.boolean(),
      locationSpoofing: z.boolean(),
      sensorSimulation: z.boolean(),
      appBehavior: z.boolean(),
    }),
  }),
})

type CreateDeviceFormValues = z.infer<typeof createDeviceSchema>

interface CreateDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDeviceDialog({ open, onOpenChange }: CreateDeviceDialogProps) {
  const { createDevice } = usePhone()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const form = useForm<CreateDeviceFormValues>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      name: '',
      os: 'android',
      version: '12',
      specs: {
        cpu: 2,
        memory: 2048,
        storage: 8192,
      },
      protection: {
        level: 'basic',
        features: {
          deviceFingerprint: false,
          locationSpoofing: false,
          sensorSimulation: false,
          appBehavior: false,
        },
      },
    }
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset()
      setActiveTab('general')
    }
  }, [open, form])

  const onSubmit = async (values: CreateDeviceFormValues) => {
    setIsSubmitting(true)
    try {
      await createDevice(values)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Device</DialogTitle>
          <DialogDescription>
            Configure your new virtual device
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="protection">Protection</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your virtual device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="os"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating System</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select OS" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="android">Android</SelectItem>
                          <SelectItem value="ios">iOS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The operating system for your virtual device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OS Version</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {form.watch('os') === 'android' ? (
                            <>
                              <SelectItem value="10">Android 10</SelectItem>
                              <SelectItem value="11">Android 11</SelectItem>
                              <SelectItem value="12">Android 12</SelectItem>
                              <SelectItem value="13">Android 13</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="14">iOS 14</SelectItem>
                              <SelectItem value="15">iOS 15</SelectItem>
                              <SelectItem value="16">iOS 16</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The version of the operating system
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="specs" className="space-y-4">
                <FormField
                  control={form.control}
                  name="specs.cpu"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>CPU Cores</FormLabel>
                        <span className="text-sm">{field.value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={8}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of CPU cores allocated to the device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specs.memory"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Memory (MB)</FormLabel>
                        <span className="text-sm">{field.value} MB</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={512}
                          max={8192}
                          step={512}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of RAM allocated to the device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specs.storage"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel>Storage (MB)</FormLabel>
                        <span className="text-sm">{field.value} MB</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1024}
                          max={32768}
                          step={1024}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Amount of storage allocated to the device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="protection" className="space-y-4">
                <FormField
                  control={form.control}
                  name="protection.level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protection Level</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select protection level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="enhanced">Enhanced</SelectItem>
                          <SelectItem value="maximum">Maximum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Level of anti-detection protection for this device
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Protection Features</h4>

                  <FormField
                    control={form.control}
                    name="protection.features.deviceFingerprint"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Device Fingerprint</FormLabel>
                          <FormDescription>
                            Spoof device fingerprint to avoid tracking
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protection.features.locationSpoofing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Location Spoofing</FormLabel>
                          <FormDescription>
                            Spoof GPS and location data
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protection.features.sensorSimulation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Sensor Simulation</FormLabel>
                          <FormDescription>
                            Simulate realistic sensor data
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="protection.features.appBehavior"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">App Behavior</FormLabel>
                          <FormDescription>
                            Simulate human-like app behavior
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Device'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}