import { createLazyFileRoute } from '@tanstack/react-router'
import UnauthorisedError from '@/errors/unauthorized-error'

export const Route = createLazyFileRoute('/(errors)/401')({
  component: UnauthorisedError,
})
