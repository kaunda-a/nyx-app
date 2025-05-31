import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
  animate?: boolean;
  count?: number;
  className?: string;
}

/**
 * SkeletonLoader component for loading states
 * 
 * Variants:
 * - default: Basic skeleton loader
 * - card: Card-shaped skeleton
 * - text: Text line skeleton
 * - avatar: Avatar circle skeleton
 * - button: Button-shaped skeleton
 */
export function SkeletonLoader({
  variant = 'default',
  animate = true,
  count = 1,
  className,
  ...props
}: SkeletonLoaderProps) {
  // Base styles
  const baseStyles = 'bg-gray-200 dark:bg-gray-700 rounded';
  
  // Animation styles
  const animationStyles = animate ? 'animate-pulse' : '';
  
  // Variant styles
  const variantStyles = {
    default: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    text: 'h-4 w-full',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-md',
  };
  
  // Generate multiple skeletons if count > 1
  if (count > 1 && (variant === 'default' || variant === 'text')) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseStyles,
              animationStyles,
              variantStyles[variant],
              // Vary the width for text lines to make it look more natural
              variant === 'text' && index === count - 1 ? 'w-4/5' : '',
              variant === 'text' && index === count - 2 ? 'w-11/12' : '',
              className
            )}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(
        baseStyles,
        animationStyles,
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export default SkeletonLoader;
