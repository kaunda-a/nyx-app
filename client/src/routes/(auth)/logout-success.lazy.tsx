import { createLazyFileRoute } from '@tanstack/react-router'
import LogoutSuccess from '@/auth/logout-success'

export const Route = createLazyFileRoute('/(auth)/logout-success')({
  component: LogoutSuccess
})