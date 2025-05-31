import { createLazyFileRoute } from '@tanstack/react-router'
import Proxies from '@/admin/proxies'

export const Route = createLazyFileRoute('/_authenticated/proxies/')({
  component: Proxies,
})
