import { Badge } from '@/components/ui/badge'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Inline cn function to avoid import issues during build
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface StatusIndicatorProps {
  status: string
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500/15 text-green-700' },
  inactive: { label: 'Inactive', color: 'bg-gray-500/15 text-gray-700' },
  suspended: { label: 'Suspended', color: 'bg-red-500/15 text-red-700' },
  pending: { label: 'Pending', color: 'bg-yellow-500/15 text-yellow-700' },
}

export function StatusIndicator({ status }: StatusIndicatorProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive

  return (
    <Badge variant="outline" className={cn('capitalize', config.color)}>
      {config.label}
    </Badge>
  )
}