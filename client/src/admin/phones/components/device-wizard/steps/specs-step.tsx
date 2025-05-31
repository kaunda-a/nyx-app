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
import { Slider } from '@/components/ui/slider';
import { 
  IconCpu, 
  IconDeviceDesktop, 
  IconDeviceSdCard 
} from '@tabler/icons-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SpecsStepProps {
  config: any;
  updateConfig: (updates: any) => void;
}

const formSchema = z.object({
  specs: z.object({
    cpu: z.number().min(1).max(8),
    memory: z.number().min(1024).max(16384), // 1GB to 16GB in MB
    storage: z.number().min(16 * 1024).max(256 * 1024), // 16GB to 256GB in MB
  }),
});

export function SpecsStep({ config, updateConfig }: SpecsStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specs: {
        cpu: config.specs.cpu || 4,
        memory: config.specs.memory || 4096,
        storage: config.specs.storage || 64 * 1024,
      },
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig({ specs: values.specs });
  };
  
  // Update config when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.specs) {
        updateConfig({ specs: value.specs });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateConfig]);
  
  // Format memory value for display
  const formatMemory = (value: number) => {
    return `${value / 1024} GB`;
  };
  
  // Format storage value for display
  const formatStorage = (value: number) => {
    return `${value / 1024} GB`;
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="specs.cpu"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="flex items-center">
                  <IconCpu className="h-5 w-5 mr-2" />
                  CPU Cores
                </FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconDeviceDesktop className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of CPU cores to allocate to the virtual device</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[field.value]}
                    min={1}
                    max={8}
                    step={1}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{field.value}</span>
                </div>
              </FormControl>
              <FormDescription>
                More cores improve performance but use more resources
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
              <div className="flex items-center">
                <FormLabel className="flex items-center">
                  <IconDeviceSdCard className="h-5 w-5 mr-2" />
                  Memory (RAM)
                </FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconDeviceDesktop className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Amount of RAM to allocate to the virtual device</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Memory Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1 GB</SelectItem>
                    <SelectItem value="2048">2 GB</SelectItem>
                    <SelectItem value="4096">4 GB</SelectItem>
                    <SelectItem value="8192">8 GB</SelectItem>
                    <SelectItem value="16384">16 GB</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                More memory allows for better multitasking
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
              <div className="flex items-center">
                <FormLabel className="flex items-center">
                  <IconDeviceSdCard className="h-5 w-5 mr-2" />
                  Storage
                </FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconDeviceDesktop className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Amount of storage space to allocate to the virtual device</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Storage Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={(16 * 1024).toString()}>16 GB</SelectItem>
                    <SelectItem value={(32 * 1024).toString()}>32 GB</SelectItem>
                    <SelectItem value={(64 * 1024).toString()}>64 GB</SelectItem>
                    <SelectItem value={(128 * 1024).toString()}>128 GB</SelectItem>
                    <SelectItem value={(256 * 1024).toString()}>256 GB</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                More storage allows for more apps and data
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">Resource Requirements</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These settings will affect the performance of your virtual device and the resources required on your host system.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>CPU Usage:</span>
              <span className="font-medium">{form.watch('specs.cpu')} cores</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Memory Usage:</span>
              <span className="font-medium">{formatMemory(form.watch('specs.memory'))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Storage Usage:</span>
              <span className="font-medium">{formatStorage(form.watch('specs.storage'))}</span>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
