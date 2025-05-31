import { createFileRoute } from '@tanstack/react-router'
import Otp from '@/auth/otp'

interface OtpSearchParams {
  email?: string
}

export const Route = createFileRoute('/(auth)/otp')({
  component: Otp,
  validateSearch: (search): OtpSearchParams => {
    return {
      email: search.email as string | undefined
    }
  }
})
