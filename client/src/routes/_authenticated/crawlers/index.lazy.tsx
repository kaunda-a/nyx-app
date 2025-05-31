import { createLazyFileRoute } from '@tanstack/react-router'
import Crawlers from '@/admin/crawlers'

export const Route = createLazyFileRoute('/_authenticated/crawlers/')({
  component: Crawlers,
})
