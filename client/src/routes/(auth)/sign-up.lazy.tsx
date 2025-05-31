import { createLazyFileRoute } from '@tanstack/react-router'
import SignUp from '@/auth/sign-up'

export const Route = createLazyFileRoute('/(auth)/sign-up')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: search.redirect as string | undefined,
    }
  },
  component: SignUp,
})
