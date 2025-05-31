import { createLazyFileRoute } from '@tanstack/react-router'
import MaintenanceError from '@/errors/maintenance-error'

export const Route = createLazyFileRoute('/(errors)/503')({
  component: MaintenanceError,
})
