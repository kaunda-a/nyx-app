import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Inline cn function to avoid import issues during build
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-primary',
        destructive:
          'bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-destructive',
        outline:
          'border border-input bg-background/80 backdrop-blur-sm shadow-linear hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-morphism hover:bg-secondary/80 hover:shadow-morphism-dark hover:scale-[1.02] active:scale-[0.98]',
        ghost:
          'hover:bg-accent/80 hover:text-accent-foreground backdrop-blur-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
        link:
          'text-primary underline-offset-4 hover:underline hover:text-primary/80 transition-colors duration-200',
        glass:
          'glass-button text-foreground hover:shadow-glass hover:scale-[1.02] active:scale-[0.98]',
        neural:
          'neural-border bg-gradient-to-br from-background to-muted text-foreground shadow-neural hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]',
        morphism:
          'morphism-raised text-foreground hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        raycast:
          'raycast-card text-foreground hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]',
        shimmer:
          'bg-gradient-to-r from-primary via-accent to-primary bg-size-200 animate-shimmer text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        premium:
          'bg-gradient-to-br from-primary/90 to-accent/90 backdrop-blur-xl border border-white/10 text-primary-foreground shadow-glass glow-primary hover:from-primary hover:to-accent hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-10 w-10',
        'icon-xl': 'h-12 w-12',
      },
      effect: {
        none: '',
        shimmer: 'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:animate-shimmer',
        glow: 'hover:shadow-glow transition-shadow duration-300',
        float: 'hover:animate-float',
        breathe: 'animate-breathe',
        pulse: 'hover:animate-pulse',
      },
      rounded: {
        default: 'rounded-md',
        sm: 'rounded-sm',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        full: 'rounded-full',
        morphism: 'rounded-morphism',
        'morphism-lg': 'rounded-morphism-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      effect: 'none',
      rounded: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
