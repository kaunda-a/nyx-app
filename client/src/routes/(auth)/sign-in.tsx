import { createFileRoute } from '@tanstack/react-router'
import SignIn from '@/auth/sign-in'

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: search.redirect as string | undefined,
    }
  },
  component: SignIn,
})
