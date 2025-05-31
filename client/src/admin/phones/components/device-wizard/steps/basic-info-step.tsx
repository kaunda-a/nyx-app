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
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  IconBrandAndroid, 
  IconBrandApple, 
  IconDeviceMobile 
} from '@tabler/icons-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface BasicInfoStepProps {
  config: any;
  updateConfig: (updates: any) => void;
}

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Device name must be at least 3 characters.',
  }),
  os: z.enum(['android', 'ios']),
  version: z.string().min(1, {
    message: 'OS version is required.',
  }),
  model: z.string().min(1, {
    message: 'Device model is required.',
  }),
});

export function BasicInfoStep({ config, updateConfig }: BasicInfoStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: config.name || '',
      os: config.os || 'android',
      version: config.version || '13',
      model: config.model || 'pixel',
    },
  });
  
  // Watch for OS changes to update available versions and models
  const watchOS = form.watch('os');
  
  // Get available OS versions based on selected OS
  const getOSVersions = () => {
    if (watchOS === 'android') {
      return ['13', '12', '11', '10', '9'];
    } else {
      return ['16', '15', '14', '13', '12'];
    }
  };
  
  // Get available device models based on selected OS
  const getDeviceModels = () => {
    if (watchOS === 'android') {
      return [
        { value: 'pixel', label: 'Google Pixel' },
        { value: 'samsung', label: 'Samsung Galaxy' },
        { value: 'oneplus', label: 'OnePlus' },
        { value: 'xiaomi', label: 'Xiaomi' },
      ];
    } else {
      return [
        { value: 'iphone', label: 'iPhone' },
        { value: 'iphone-pro', label: 'iPhone Pro' },
        { value: 'iphone-plus', label: 'iPhone Plus' },
      ];
    }
  };
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig(values);
  };
  
  // Update config when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      updateConfig(value);
    });
    return () => subscription.unsubscribe();
  }, [form, updateConfig]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Name</FormLabel>
              <FormControl>
                <Input placeholder="My Virtual Phone" {...field} />
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
            <FormItem className="space-y-3">
              <FormLabel>Operating System</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-1"
                >
                  <div className="flex items-center space-x-2 w-1/2">
                    <RadioGroupItem value="android" id="android" />
                    <Label htmlFor="android" className="flex items-center cursor-pointer">
                      <IconBrandAndroid className="h-5 w-5 mr-2 text-green-500" />
                      Android
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 w-1/2">
                    <RadioGroupItem value="ios" id="ios" />
                    <Label htmlFor="ios" className="flex items-center cursor-pointer">
                      <IconBrandApple className="h-5 w-5 mr-2 text-gray-700" />
                      iOS
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                Select the operating system for your virtual device
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OS Version</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select OS Version" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getOSVersions().map((version) => (
                      <SelectItem key={version} value={version}>
                        {watchOS === 'android' ? 'Android' : 'iOS'} {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The version of the operating system
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Model</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Device Model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getDeviceModels().map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The model of the virtual device
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
