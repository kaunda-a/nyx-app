import { NumberDetails } from '../types'
import { Card, CardContent } from '@/components/ui/card'

interface DetailsViewProps {
  number: NumberDetails
}

export function DetailsView({ number }: DetailsViewProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Number</p>
            <p className="text-sm">{number.number}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Provider</p>
            <p className="text-sm">{number.provider}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-sm">{number.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-sm">
              {new Date(number.created_at).toLocaleDateString()}
            </p>
          </div>
          {number.capabilities && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                Capabilities
              </p>
              <div className="flex gap-2 mt-1">
                {number.capabilities.map((capability: string) => (
                  <span
                    key={capability}
                    className="text-xs bg-secondary px-2 py-1 rounded-md"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
