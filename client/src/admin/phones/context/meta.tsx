import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/phone/context/meta')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/phone/context/meta"!</div>
}
