import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Card, CardProps } from "./card"

// Inline cn function to avoid import issues during build
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface GradientCardProps extends CardProps {
  glowOnHover?: boolean
  animated?: boolean
  glass?: boolean
}

export function GradientCard({
  children,
  className,
  glowOnHover = false,
  animated = false,
  glass = false,
  ...props
}: GradientCardProps) {
  return (
    <div className={cn(
      "border-gradient",
      glowOnHover && "glow-hover",
      animated && "animated-gradient",
      glass && "glass",
      className
    )}>
      <Card className="bg-card/50 backdrop-blur-[2px]" {...props}>
        {children}
      </Card>
    </div>
  )
}