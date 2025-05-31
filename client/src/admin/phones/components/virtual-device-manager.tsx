import { useVirtualDeviceStore } from '../stores/virtual-device-store'
import { DataTable } from '../../../components/ui/data-table'
import { columns } from './device-columns'

export function VirtualDeviceManager() {
  const { devices } = useVirtualDeviceStore()

  return (
    <DataTable
      columns={columns}
      data={devices}
    />
  )
}