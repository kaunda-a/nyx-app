import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'light' | 'neon';
  intensity?: 'low' | 'medium' | 'high';
  hoverEffect?: boolean;
  borderGlow?: boolean;
  children: React.ReactNode;
}

/**
 * GlassCard component with glassmorphism effect
 * 
 * Variants:
 * - default: Subtle glass effect with light blur
 * - dark: Darker glass effect for dark themes
 * - light: Lighter glass effect for light themes
 * - neon: Glass effect with neon glow
 * 
 * Intensity:
 * - low: Subtle glass effect
 * - medium: Medium glass effect
 * - high: Strong glass effect
 */
export function GlassCard({
  className,
  variant = 'default',
  intensity = 'medium',
  hoverEffect = true,
  borderGlow = false,
  children,
  ...props
}: GlassCardProps) {
  // Base styles
  const baseStyles = 'relative rounded-xl overflow-hidden transition-all duration-300';
  
  // Intensity styles
  const intensityStyles = {
    low: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    high: 'backdrop-blur-lg',
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white/10 dark:bg-black/20 shadow-md',
    dark: 'bg-black/30 shadow-lg',
    light: 'bg-white/20 shadow-sm',
    neon: 'bg-black/20 shadow-lg',
  };
  
  // Hover effect
  const hoverStyles = hoverEffect 
    ? 'hover:scale-[1.01] hover:shadow-lg hover:z-10' 
    : '';
  
  // Border glow
  const borderGlowStyles = borderGlow
    ? variant === 'neon'
      ? 'before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-pink-500 before:opacity-70 before:-z-10 before:animate-gradient'
      : 'before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-r before:from-gray-200 before:to-gray-300 dark:before:from-gray-800 dark:before:to-gray-700 before:opacity-70 before:-z-10'
    : '';
  
  // Neon specific styles
  const neonStyles = variant === 'neon'
    ? 'after:absolute after:inset-0 after:rounded-xl after:p-[1px] after:bg-gradient-to-r after:from-indigo-500/30 after:via-purple-500/30 after:to-pink-500/30 after:opacity-0 after:blur-xl after:-z-10 after:transition-opacity hover:after:opacity-100'
    : '';
  
  return (
    <div
      className={cn(
        baseStyles,
        intensityStyles[intensity],
        variantStyles[variant],
        hoverStyles,
        borderGlowStyles,
        neonStyles,
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default GlassCard;
