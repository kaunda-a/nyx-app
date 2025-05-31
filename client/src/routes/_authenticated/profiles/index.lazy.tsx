import { createLazyFileRoute } from '@tanstack/react-router'
import Profiles from '@/admin/profiles'
export const Route = createLazyFileRoute('/_authenticated/profiles/')({
  component: Profiles,
})
