import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Inline cn function to avoid import issues during build
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary/10', className)}
      {...props}
    />
  )
}

export { Skeleton }
