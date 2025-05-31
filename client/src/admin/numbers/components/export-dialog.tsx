import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { NumberDetails } from '../types'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onExport: (format: 'csv' | 'json', selectedRows: NumberDetails[]) => void
  selectedRows: NumberDetails[]
}

export function ExportDialog({ open, onClose, onExport, selectedRows }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Numbers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv">CSV</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON</Label>
            </div>
          </RadioGroup>
          <Button onClick={() => onExport(format, selectedRows)}>Export</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
