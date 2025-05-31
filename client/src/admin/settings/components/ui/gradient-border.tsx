import React from 'react';
import { cn } from '@/lib/utils';

interface GradientBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'purple' | 'blue' | 'green' | 'red' | 'rainbow';
  animate?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  borderWidth?: 'thin' | 'medium' | 'thick';
  children: React.ReactNode;
}

/**
 * GradientBorder component with animated gradient borders
 * 
 * Variants:
 * - default: Subtle gray gradient
 * - purple: Purple gradient
 * - blue: Blue gradient
 * - green: Green gradient
 * - red: Red gradient
 * - rainbow: Full rainbow gradient
 * 
 * Intensity:
 * - low: Subtle gradient
 * - medium: Medium gradient
 * - high: Vibrant gradient
 * 
 * BorderWidth:
 * - thin: 1px border
 * - medium: 2px border
 * - thick: 3px border
 */
export function GradientBorder({
  className,
  variant = 'default',
  animate = false,
  intensity = 'medium',
  borderWidth = 'medium',
  children,
  ...props
}: GradientBorderProps) {
  // Base styles
  const baseStyles = 'relative rounded-xl overflow-hidden';
  
  // Border width styles
  const borderWidthStyles = {
    thin: 'p-[1px]',
    medium: 'p-[2px]',
    thick: 'p-[3px]',
  };
  
  // Intensity styles
  const intensityStyles = {
    low: 'opacity-50',
    medium: 'opacity-70',
    high: 'opacity-90',
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
    purple: 'bg-gradient-to-r from-purple-700 via-violet-500 to-purple-700',
    blue: 'bg-gradient-to-r from-blue-700 via-cyan-500 to-blue-700',
    green: 'bg-gradient-to-r from-green-700 via-emerald-500 to-green-700',
    red: 'bg-gradient-to-r from-red-700 via-rose-500 to-red-700',
    rainbow: 'bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-indigo-500',
  };
  
  // Animation styles
  const animationStyles = animate
    ? 'animate-gradient bg-[length:200%_200%]'
    : '';
  
  return (
    <div
      className={cn(
        baseStyles,
        borderWidthStyles[borderWidth],
        intensityStyles[intensity],
        variantStyles[variant],
        animationStyles,
        className
      )}
      {...props}
    >
      <div className="bg-background dark:bg-background rounded-[calc(0.75rem-2px)] h-full">
        {children}
      </div>
    </div>
  );
}

export default GradientBorder;
