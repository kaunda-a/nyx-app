import { Skeleton } from '@/components/ui/skeleton'

interface TableSkeletonProps {
  columns: number
  rows: number
}

export function TableSkeleton({ columns, rows }: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[120px]" />
      </div>
      
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex items-center h-10 px-4">
            {Array(columns).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-4 w-[100px] mx-2" />
            ))}
          </div>
        </div>
        
        <div>
          {Array(rows).fill(0).map((_, i) => (
            <div key={i} className="flex items-center h-16 px-4 border-b last:border-0">
              {Array(columns).fill(0).map((_, j) => (
                <Skeleton key={j} className="h-4 w-[100px] mx-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}