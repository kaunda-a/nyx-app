import React from 'react';
import { cn } from '@/lib/utils';

interface NeonTextProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'blue' | 'purple' | 'pink' | 'green' | 'red' | 'yellow';
  intensity?: 'low' | 'medium' | 'high';
  pulse?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
}

/**
 * NeonText component with neon glow effect
 * 
 * Variants:
 * - blue: Blue neon glow
 * - purple: Purple neon glow
 * - pink: Pink neon glow
 * - green: Green neon glow
 * - red: Red neon glow
 * - yellow: Yellow neon glow
 * 
 * Intensity:
 * - low: Subtle neon glow
 * - medium: Medium neon glow
 * - high: Strong neon glow
 */
export function NeonText({
  className,
  variant = 'blue',
  intensity = 'medium',
  pulse = false,
  as: Component = 'span',
  children,
  ...props
}: NeonTextProps) {
  // Base styles
  const baseStyles = 'relative transition-all duration-300';
  
  // Variant styles
  const variantStyles = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };
  
  // Shadow colors
  const shadowColors = {
    blue: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    green: '#22c55e',
    red: '#ef4444',
    yellow: '#eab308',
  };
  
  // Intensity styles
  const intensityStyles = {
    low: `text-shadow-sm`,
    medium: `text-shadow-md`,
    high: `text-shadow-lg`,
  };
  
  // Pulse animation
  const pulseStyles = pulse
    ? 'animate-pulse'
    : '';
  
  // Apply text shadow based on variant and intensity
  const textShadow = {
    '--tw-text-shadow-color': shadowColors[variant],
  } as React.CSSProperties;
  
  return (
    <Component
      className={cn(
        baseStyles,
        variantStyles[variant],
        intensityStyles[intensity],
        pulseStyles,
        className
      )}
      style={textShadow}
      {...props}
    >
      {children}
    </Component>
  );
}

export default NeonText;
