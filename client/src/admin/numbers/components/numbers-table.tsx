import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/tables/data-table'
import { useToast } from '@/hooks/use-toast'
import ErrorBoundary from '@/errors/error-boundary'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { numbersApi } from '../api/numbers-api'
import { columns } from '@/admin/numbers/components/columns'
import { NumberDetails } from '../types'
import { ExportDialog } from '@/admin/numbers/components/export-dialog'
import { NumberDetailsDialog } from '@/admin/numbers/components/number-details-dialog'

export function NumbersTable() {
  const { toast } = useToast()
  const [selectedNumber, setSelectedNumber] = useState<NumberDetails | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [selectedRows, setSelectedRows] = useState<NumberDetails[]>([])

  const {
    data: numbers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['numbers'],
    queryFn: () => numbersApi.list().then(res => res.data)
  })

  const handleBulkRelease = async (rows: NumberDetails[]) => {
    try {
      await Promise.all(
        rows.map(row => numbersApi.release(row.id))
      )
      toast({ title: 'Successfully released selected numbers' })
      refetch()
    } catch (error) {
      toast({ 
        title: 'Failed to release numbers',
        variant: 'destructive'
      })
    }
  }

  const handleExport = async (format: 'csv' | 'json', rows: NumberDetails[]) => {
    try {
      const response = await numbersApi.export(format, rows)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `numbers.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setShowExport(false)
    } catch (error) {
      toast({ 
        title: 'Failed to export numbers',
        variant: 'destructive'
      })
    }
  }

  if (error) {
    return <div>Failed to load numbers. Please try again.</div>
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : (
          <DataTable<NumberDetails, unknown>
            columns={columns}
            data={numbers}
            onRowSelectionChange={setSelectedRows}
            onRowClick={(row: NumberDetails) => setSelectedNumber(row)}
            bulkActions={[
              {
                label: 'Release Selected',
                onClick: handleBulkRelease,
                variant: 'destructive'
              },
              {
                label: 'Export Selected',
                onClick: () => setShowExport(true)
              }
            ]}
          />
        )}
      </div>

      <NumberDetailsDialog
        number={selectedNumber}
        open={!!selectedNumber}
        onClose={() => setSelectedNumber(null)}
      />

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        selectedRows={selectedRows}
      />
    </ErrorBoundary>
  )
}
