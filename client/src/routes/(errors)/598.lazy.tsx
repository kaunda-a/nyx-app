import { createLazyFileRoute } from '@tanstack/react-router'
import ErrorBoundary from '@/errors/error-boundary'

export const Route = createLazyFileRoute('/(errors)/598')({
  component: ErrorBoundary,
})