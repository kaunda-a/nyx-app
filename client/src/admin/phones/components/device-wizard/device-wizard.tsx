import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  IconDeviceMobile, 
  IconBrandAndroid, 
  IconBrandApple, 
  IconShieldCheck, 
  IconCpu, 
  IconDeviceSdCard, 
  IconArrowRight, 
  IconArrowLeft, 
  IconCheck 
} from '@tabler/icons-react';
import { usePhone } from '../../context/phone-context';
import { BasicInfoStep } from './steps/basic-info-step';
import { SpecsStep } from './steps/specs-step';
import { ProtectionStep } from './steps/protection-step';
import { ReviewStep } from './steps/review-step';
import { PhoneDevice } from '../device-models/phone-device';

interface DeviceWizardProps {
  open: boolean;
  onClose: () => void;
}

export function DeviceWizard({ open, onClose }: DeviceWizardProps) {
  const { createDevice } = usePhone();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  
  // Device configuration state
  const [deviceConfig, setDeviceConfig] = useState({
    name: '',
    os: 'android',
    version: '13',
    model: 'pixel',
    specs: {
      cpu: 4,
      memory: 4096, // 4GB in MB
      storage: 64 * 1024, // 64GB in MB
    },
    protection: {
      level: 'enhanced',
      features: {
        deviceFingerprint: true,
        locationSpoofing: true,
        sensorSimulation: true,
        appBehavior: false,
      }
    }
  });
  
  // Steps configuration
  const steps = [
    { 
      id: 'basic', 
      title: 'Basic Information', 
      description: 'Choose the device type and OS',
      icon: <IconDeviceMobile className="h-5 w-5" />,
      component: BasicInfoStep
    },
    { 
      id: 'specs', 
      title: 'Device Specifications', 
      description: 'Configure hardware specifications',
      icon: <IconCpu className="h-5 w-5" />,
      component: SpecsStep
    },
    { 
      id: 'protection', 
      title: 'Camoufox Protection', 
      description: 'Configure anti-detection features',
      icon: <IconShieldCheck className="h-5 w-5" />,
      component: ProtectionStep
    },
    { 
      id: 'review', 
      title: 'Review & Create', 
      description: 'Review your configuration',
      icon: <IconCheck className="h-5 w-5" />,
      component: ReviewStep
    }
  ];
  
  // Update device configuration
  const updateDeviceConfig = (updates: Partial<typeof deviceConfig>) => {
    setDeviceConfig(prev => ({
      ...prev,
      ...updates
    }));
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle device creation
  const handleCreateDevice = async () => {
    setIsCreating(true);
    
    try {
      // Generate a unique ID for the device
      const id = `device-${Date.now()}`;
      
      // Create the device
      await createDevice({
        id,
        name: deviceConfig.name,
        os: deviceConfig.os,
        version: deviceConfig.version,
        model: deviceConfig.model,
        specs: deviceConfig.specs,
        protection: deviceConfig.protection,
        status: 'stopped'
      });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error creating device:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Render current step component
  const CurrentStepComponent = steps[currentStep].component;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Virtual Device</DialogTitle>
          <DialogDescription>
            Configure a new virtual device with Waydroid and Camoufox protection
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : index < currentStep 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`h-0.5 w-4 ${
                    index < currentStep ? 'bg-primary/50' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2 flex flex-col items-center justify-center">
            <PhoneDevice 
              type={deviceConfig.os as 'android' | 'ios'}
              model={deviceConfig.model}
              isOn={true}
              width={220}
              height={440}
              screenContent={
                <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-blue-500 to-purple-600 text-white">
                  <div className="mb-4">
                    {deviceConfig.os === 'android' ? (
                      <IconBrandAndroid className="h-16 w-16" />
                    ) : (
                      <IconBrandApple className="h-16 w-16" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{deviceConfig.name || 'New Device'}</h3>
                  <p className="text-sm opacity-80">
                    {deviceConfig.os === 'android' ? 'Android' : 'iOS'} {deviceConfig.version}
                  </p>
                  <div className="mt-4 flex items-center space-x-2">
                    <IconCpu className="h-4 w-4" />
                    <span>{deviceConfig.specs.cpu} Cores</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IconDeviceSdCard className="h-4 w-4" />
                    <span>{deviceConfig.specs.memory / 1024} GB RAM</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <IconShieldCheck className="h-4 w-4" />
                      <span className="capitalize">{deviceConfig.protection.level} Protection</span>
                    </div>
                  </div>
                </div>
              }
            />
          </div>
          
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {steps[currentStep].icon}
                  <span className="ml-2">{steps[currentStep].title}</span>
                </CardTitle>
                <CardDescription>
                  {steps[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CurrentStepComponent 
                  config={deviceConfig} 
                  updateConfig={updateDeviceConfig} 
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={currentStep === 0 ? onClose : handlePrevious}
                  disabled={isCreating}
                >
                  {currentStep === 0 ? 'Cancel' : (
                    <>
                      <IconArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </>
                  )}
                </Button>
                
                {currentStep === steps.length - 1 ? (
                  <Button 
                    onClick={handleCreateDevice}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Device'}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>
                    Next
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
