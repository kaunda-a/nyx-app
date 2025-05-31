import { useState, useEffect } from 'react'
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
import { DeviceSpecs, Protection } from '../data/schema'

// Form schema
const editDeviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
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

type EditDeviceFormValues = z.infer<typeof editDeviceSchema>

interface EditDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDeviceDialog({ open, onOpenChange }: EditDeviceDialogProps) {
  const { currentDevice, updateDevice } = usePhone()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Initialize form with current device values
  const form = useForm<EditDeviceFormValues>({
    resolver: zodResolver(editDeviceSchema),
    defaultValues: {
      name: currentDevice?.name || '',
      specs: {
        cpu: currentDevice?.specs.cpu || 2,
        memory: currentDevice?.specs.memory || 2048,
        storage: currentDevice?.specs.storage || 8192,
      },
      protection: {
        level: currentDevice?.protection.level || 'basic',
        features: {
          deviceFingerprint: currentDevice?.protection.features.deviceFingerprint || false,
          locationSpoofing: currentDevice?.protection.features.locationSpoofing || false,
          sensorSimulation: currentDevice?.protection.features.sensorSimulation || false,
          appBehavior: currentDevice?.protection.features.appBehavior || false,
        },
      },
    },
  })

  // Update form when currentDevice changes
  useEffect(() => {
    if (currentDevice) {
      form.reset({
        name: currentDevice.name,
        specs: currentDevice.specs,
        protection: currentDevice.protection,
      })
    }
  }, [currentDevice, form])

  const onSubmit = async (values: EditDeviceFormValues) => {
    if (!currentDevice) return

    setIsSubmitting(true)
    try {
      await updateDevice(currentDevice.id, values)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Device</DialogTitle>
          <DialogDescription>
            Update your virtual device settings
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

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Device Type</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentDevice?.os === 'android' ? 'Android' : 'iOS'} {currentDevice?.version}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cannot be changed
                  </p>
                </div>
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
