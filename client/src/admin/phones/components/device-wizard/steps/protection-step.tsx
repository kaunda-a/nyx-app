import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  IconShieldCheck, 
  IconFingerprint, 
  IconMapPin, 
  IconDeviceWatch, 
  IconApps 
} from '@tabler/icons-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ProtectionStepProps {
  config: any;
  updateConfig: (updates: any) => void;
}

const formSchema = z.object({
  protection: z.object({
    level: z.enum(['basic', 'enhanced', 'maximum']),
    features: z.object({
      deviceFingerprint: z.boolean(),
      locationSpoofing: z.boolean(),
      sensorSimulation: z.boolean(),
      appBehavior: z.boolean(),
    }),
  }),
});

export function ProtectionStep({ config, updateConfig }: ProtectionStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      protection: {
        level: config.protection.level || 'enhanced',
        features: {
          deviceFingerprint: config.protection.features.deviceFingerprint ?? true,
          locationSpoofing: config.protection.features.locationSpoofing ?? true,
          sensorSimulation: config.protection.features.sensorSimulation ?? true,
          appBehavior: config.protection.features.appBehavior ?? false,
        },
      },
    },
  });
  
  // Watch for protection level changes
  const watchProtectionLevel = form.watch('protection.level');
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig({ protection: values.protection });
  };
  
  // Update config when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.protection) {
        updateConfig({ protection: value.protection });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateConfig]);
  
  // Handle protection level change
  const handleProtectionLevelChange = (level: string) => {
    // Update features based on protection level
    switch (level) {
      case 'basic':
        form.setValue('protection.features.deviceFingerprint', true);
        form.setValue('protection.features.locationSpoofing', false);
        form.setValue('protection.features.sensorSimulation', false);
        form.setValue('protection.features.appBehavior', false);
        break;
      case 'enhanced':
        form.setValue('protection.features.deviceFingerprint', true);
        form.setValue('protection.features.locationSpoofing', true);
        form.setValue('protection.features.sensorSimulation', true);
        form.setValue('protection.features.appBehavior', false);
        break;
      case 'maximum':
        form.setValue('protection.features.deviceFingerprint', true);
        form.setValue('protection.features.locationSpoofing', true);
        form.setValue('protection.features.sensorSimulation', true);
        form.setValue('protection.features.appBehavior', true);
        break;
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="protection.level"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center">
                <IconShieldCheck className="h-5 w-5 mr-2" />
                Protection Level
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleProtectionLevelChange(value);
                  }}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex flex-col">
                    <Card className={`border-2 ${field.value === 'basic' ? 'border-primary' : 'border-transparent'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">Basic</CardTitle>
                          <RadioGroupItem value="basic" id="basic" className="sr-only" />
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Low
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Essential protection
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <ul className="text-xs space-y-1">
                          <li className="flex items-center">
                            <IconFingerprint className="h-3 w-3 mr-1 text-green-500" />
                            Device fingerprinting
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Label htmlFor="basic" className="sr-only">Basic</Label>
                  </div>
                  
                  <div className="flex flex-col">
                    <Card className={`border-2 ${field.value === 'enhanced' ? 'border-primary' : 'border-transparent'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">Enhanced</CardTitle>
                          <RadioGroupItem value="enhanced" id="enhanced" className="sr-only" />
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                            Medium
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Advanced protection
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <ul className="text-xs space-y-1">
                          <li className="flex items-center">
                            <IconFingerprint className="h-3 w-3 mr-1 text-green-500" />
                            Device fingerprinting
                          </li>
                          <li className="flex items-center">
                            <IconMapPin className="h-3 w-3 mr-1 text-green-500" />
                            Location spoofing
                          </li>
                          <li className="flex items-center">
                            <IconDeviceWatch className="h-3 w-3 mr-1 text-green-500" />
                            Sensor simulation
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Label htmlFor="enhanced" className="sr-only">Enhanced</Label>
                  </div>
                  
                  <div className="flex flex-col">
                    <Card className={`border-2 ${field.value === 'maximum' ? 'border-primary' : 'border-transparent'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">Maximum</CardTitle>
                          <RadioGroupItem value="maximum" id="maximum" className="sr-only" />
                          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            High
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Complete protection
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2 pt-0">
                        <ul className="text-xs space-y-1">
                          <li className="flex items-center">
                            <IconFingerprint className="h-3 w-3 mr-1 text-green-500" />
                            Device fingerprinting
                          </li>
                          <li className="flex items-center">
                            <IconMapPin className="h-3 w-3 mr-1 text-green-500" />
                            Location spoofing
                          </li>
                          <li className="flex items-center">
                            <IconDeviceWatch className="h-3 w-3 mr-1 text-green-500" />
                            Sensor simulation
                          </li>
                          <li className="flex items-center">
                            <IconApps className="h-3 w-3 mr-1 text-green-500" />
                            App behavior
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Label htmlFor="maximum" className="sr-only">Maximum</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the level of Camoufox protection for your virtual device
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Protection Features</h3>
          
          <FormField
            control={form.control}
            name="protection.features.deviceFingerprint"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center">
                    <IconFingerprint className="h-5 w-5 mr-2" />
                    Device Fingerprinting Protection
                  </FormLabel>
                  <FormDescription>
                    Prevents websites from identifying your device through browser fingerprinting
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={watchProtectionLevel !== 'custom'}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="protection.features.locationSpoofing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center">
                    <IconMapPin className="h-5 w-5 mr-2" />
                    Location Spoofing
                  </FormLabel>
                  <FormDescription>
                    Masks your real location with a simulated GPS position
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={watchProtectionLevel !== 'custom'}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="protection.features.sensorSimulation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center">
                    <IconDeviceWatch className="h-5 w-5 mr-2" />
                    Sensor Simulation
                  </FormLabel>
                  <FormDescription>
                    Simulates realistic sensor data (accelerometer, gyroscope, etc.)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={watchProtectionLevel !== 'custom'}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="protection.features.appBehavior"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center">
                    <IconApps className="h-5 w-5 mr-2" />
                    App Behavior Randomization
                  </FormLabel>
                  <FormDescription>
                    Randomizes app behavior patterns to appear more human-like
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={watchProtectionLevel !== 'custom'}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
