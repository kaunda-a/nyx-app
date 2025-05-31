import { createFileRoute } from '@tanstack/react-router'
import Numbers from '@/admin/numbers'

export const Route = createFileRoute('/_authenticated/numbers')({
  component: Numbers
})