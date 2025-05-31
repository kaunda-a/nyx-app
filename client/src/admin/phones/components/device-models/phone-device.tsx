import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PhoneDeviceProps {
  type: 'android' | 'ios';
  model?: string;
  variant?: 'default' | 'pro' | 'max';
  color?: string;
  isOn?: boolean;
  isRotated?: boolean;
  showScreen?: boolean;
  screenContent?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  onInteraction?: (type: 'power' | 'volume-up' | 'volume-down' | 'home' | 'back' | 'screen') => void;
}

export function PhoneDevice({
  type = 'android',
  model = type === 'android' ? 'pixel' : 'iphone',
  variant = 'default',
  color = type === 'android' ? '#1a73e8' : '#f5f5f7',
  isOn = true,
  isRotated = false,
  showScreen = true,
  screenContent,
  width = 280,
  height = 560,
  className,
  onInteraction
}: PhoneDeviceProps) {
  const [isScreenOn, setIsScreenOn] = useState(isOn);
  const [orientation, setOrientation] = useState(isRotated ? 'landscape' : 'portrait');
  const [isAnimating, setIsAnimating] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  // Update state when props change
  useEffect(() => {
    setIsScreenOn(isOn);
  }, [isOn]);

  useEffect(() => {
    setOrientation(isRotated ? 'landscape' : 'portrait');
  }, [isRotated]);

  // Handle power button press
  const handlePowerButton = () => {
    setIsScreenOn(!isScreenOn);
    setIsAnimating(true);
    if (onInteraction) onInteraction('power');
  };

  // Handle volume buttons
  const handleVolumeUp = () => {
    if (onInteraction) onInteraction('volume-up');
  };

  const handleVolumeDown = () => {
    if (onInteraction) onInteraction('volume-down');
  };

  // Handle home button (iOS)
  const handleHomeButton = () => {
    if (onInteraction) onInteraction('home');
  };

  // Handle back button (Android)
  const handleBackButton = () => {
    if (onInteraction) onInteraction('back');
  };

  // Handle screen tap
  const handleScreenTap = () => {
    if (onInteraction) onInteraction('screen');
  };

  // Animation completed
  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  // Get device dimensions based on orientation
  const deviceDimensions = orientation === 'portrait' 
    ? { width: `${width}px`, height: `${height}px` }
    : { width: `${height}px`, height: `${width}px` };

  // Get screen dimensions (slightly smaller than device)
  const screenDimensions = orientation === 'portrait'
    ? { width: `${width * 0.9}px`, height: `${height * 0.75}px` }
    : { width: `${height * 0.75}px`, height: `${width * 0.9}px` };

  // Get device-specific styles
  const getDeviceStyles = () => {
    const baseStyles = {
      backgroundColor: color,
      ...deviceDimensions,
      borderRadius: type === 'ios' ? '36px' : '24px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transition: 'all 0.5s ease-in-out',
    };

    // Add device-specific styling
    if (type === 'ios') {
      return {
        ...baseStyles,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        background: `linear-gradient(145deg, ${color} 0%, ${adjustColor(color, -15)} 100%)`,
      };
    } else {
      return {
        ...baseStyles,
        border: '1px solid rgba(0, 0, 0, 0.2)',
        background: `linear-gradient(145deg, ${adjustColor(color, 10)} 0%, ${color} 100%)`,
      };
    }
  };

  // Helper function to adjust color brightness
  function adjustColor(color: string, amount: number): string {
    return color;
  }

  // Render the device
  return (
    <motion.div
      className={cn("phone-device", className)}
      style={getDeviceStyles()}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: orientation === 'landscape' ? 90 : 0
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Device Notch (iOS) */}
      {type === 'ios' && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-xl z-10">
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
        </div>
      )}

      {/* Device Camera (Android) */}
      {type === 'android' && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-black rounded-full z-10">
          <div className="absolute inset-0.5 rounded-full bg-blue-500 opacity-50"></div>
        </div>
      )}

      {/* Screen */}
      <AnimatePresence>
        <motion.div
          ref={screenRef}
          className={cn(
            "absolute inset-0 m-auto rounded-2xl overflow-hidden flex items-center justify-center",
            isScreenOn ? "bg-white" : "bg-black"
          )}
          style={screenDimensions}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isScreenOn ? 1 : 0,
            scale: isAnimating ? 0.98 : 1
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={handleAnimationComplete}
          onClick={handleScreenTap}
        >
          {showScreen && isScreenOn && screenContent ? (
            screenContent
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              {isScreenOn ? (
                <div className="text-center">
                  {type === 'android' ? (
                    <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none">
                      <path d="M17.6,9.48l1.84-3.18c0.16-0.31,0.04-0.69-0.26-0.85c-0.29-0.15-0.65-0.06-0.83,0.22l-1.88,3.24 c-2.86-1.21-6.08-1.21-8.94,0L5.65,5.67c-0.19-0.29-0.58-0.38-0.87-0.2C4.5,5.65,4.41,6.01,4.56,6.3L6.4,9.48 C3.3,11.25,1.28,14.44,1,18h22C22.72,14.44,20.7,11.25,17.6,9.48z M7,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25S8.25,13.31,8.25,14C8.25,14.69,7.69,15.25,7,15.25z M17,15.25c-0.69,0-1.25-0.56-1.25-1.25 c0-0.69,0.56-1.25,1.25-1.25s1.25,0.56,1.25,1.25C18.25,14.69,17.69,15.25,17,15.25z" fill="#3ddc84"/>
                    </svg>
                  ) : (
                    <svg className="w-16 h-16 mx-auto" viewBox="0 0 24 24" fill="none">
                      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" fill="#999"/>
                    </svg>
                  )}
                  <p className="mt-4 text-gray-500">Tap to interact</p>
                </div>
              ) : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Power Button */}
      <div 
        className={cn(
          "absolute right-0 w-2 h-12 bg-gray-300 rounded-l-sm cursor-pointer",
          type === 'android' ? "top-20" : "top-32"
        )}
        style={{ transform: 'translateX(1px)' }}
        onClick={handlePowerButton}
      />

      {/* Volume Buttons */}
      <div 
        className={cn(
          "absolute left-0 w-2 h-8 bg-gray-300 rounded-r-sm cursor-pointer",
          type === 'android' ? "top-20" : "top-24"
        )}
        style={{ transform: 'translateX(-1px)' }}
        onClick={handleVolumeUp}
      />
      <div 
        className={cn(
          "absolute left-0 w-2 h-8 bg-gray-300 rounded-r-sm cursor-pointer",
          type === 'android' ? "top-32" : "top-36"
        )}
        style={{ transform: 'translateX(-1px)' }}
        onClick={handleVolumeDown}
      />

      {/* Home Button (iOS) */}
      {type === 'ios' && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full border-2 border-gray-300 cursor-pointer"
          onClick={handleHomeButton}
        />
      )}

      {/* Navigation Bar (Android) */}
      {type === 'android' && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-6 flex justify-around items-center">
          <div 
            className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center cursor-pointer"
            onClick={handleBackButton}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#666"/>
            </svg>
          </div>
          <div className="w-6 h-6 rounded-full border border-gray-400 cursor-pointer"></div>
          <div className="w-6 h-6 rounded-full border border-gray-400 cursor-pointer"></div>
        </div>
      )}

      {/* Device Reflection Overlay */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%)',
        }}
      />
    </motion.div>
  );
}
