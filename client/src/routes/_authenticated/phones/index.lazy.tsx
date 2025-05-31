import { createLazyFileRoute } from '@tanstack/react-router'
import Phones from '@/admin/phones'

export const Route = createLazyFileRoute('/_authenticated/phones/')({
  component: Phones,
})
