import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MorphismCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'neumorphic' | 'soft' | 'flat';
  interactive?: boolean;
  depth?: 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

/**
 * MorphismCard component with various morphism effects
 * 
 * Variants:
 * - glass: Glassmorphism effect
 * - neumorphic: Neumorphism effect
 * - soft: Soft UI effect
 * - flat: Flat design with subtle depth
 * 
 * Depth:
 * - low: Subtle depth effect
 * - medium: Medium depth effect
 * - high: Strong depth effect
 */
export function MorphismCard({
  className,
  variant = 'glass',
  interactive = true,
  depth = 'medium',
  children,
  ...props
}: MorphismCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Base styles
  const baseStyles = 'relative rounded-xl overflow-hidden transition-all duration-300';
  
  // Variant styles
  const variantStyles = {
    glass: 'bg-white/10 dark:bg-black/20 backdrop-blur-md shadow-md',
    neumorphic: 'bg-gray-100 dark:bg-gray-800 shadow-[6px_6px_12px_#d1d1d1,-6px_-6px_12px_#ffffff] dark:shadow-[6px_6px_12px_#1a1a1a,-6px_-6px_12px_#2a2a2a]',
    soft: 'bg-gray-100 dark:bg-gray-800 shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_2px_2px_5px_#1a1a1a,inset_-2px_-2px_5px_#2a2a2a]',
    flat: 'bg-gray-100 dark:bg-gray-800 shadow-sm',
  };
  
  // Depth styles
  const depthStyles = {
    low: 'shadow-sm',
    medium: 'shadow-md',
    high: 'shadow-lg',
  };
  
  // Interactive styles
  const getInteractiveStyles = () => {
    if (!interactive || variant !== 'neumorphic') return '';
    
    if (isHovering) {
      const x = position.x / 20;
      const y = position.y / 20;
      
      return `transform perspective(1000px) rotateX(${y}deg) rotateY(${-x}deg) scale3d(1.02, 1.02, 1.02)`;
    }
    
    return '';
  };
  
  // Handle mouse move for interactive effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setPosition({ x, y });
  };
  
  // Handle mouse enter/leave
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setPosition({ x: 0, y: 0 });
  };
  
  // Apply interactive styles
  const interactiveStyle = {
    transform: getInteractiveStyles(),
  };
  
  return (
    <div
      ref={cardRef}
      className={cn(
        baseStyles,
        variantStyles[variant],
        variant !== 'neumorphic' && depthStyles[depth],
        className
      )}
      style={interactive ? interactiveStyle : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}

export default MorphismCard;
