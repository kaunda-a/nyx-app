import { Component, ErrorInfo, ReactNode } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    toast({
      variant: 'destructive',
      title: 'An unexpected error occurred',
      description: error.message,
    })
  }

  public render() {
    if (this.state.hasError) {
      return <ErrorBoundaryError error={this.state.error} />
    }

    return this.props.children
  }
}

interface ErrorBoundaryErrorProps {
  error?: Error | null
}

function ErrorBoundaryError({ error }: ErrorBoundaryErrorProps) {
  const navigate = useNavigate()
  const { history } = useRouter()

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] font-bold leading-tight'>Error</h1>
        <span className='font-medium'>Unexpected Error Occurred</span>
        <p className='text-center text-muted-foreground'>
          We've encountered an unexpected error. <br />
          Our team has been notified.
        </p>
        {error && import.meta.env.DEV && (
          <pre className='mt-4 max-w-[90%] overflow-auto rounded-md bg-destructive/10 p-4 text-sm text-destructive'>
            <code>{error.message}</code>
          </pre>
        )}
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
        </div>
      </div>
    </div>
  )
}

export { ErrorBoundary as default, ErrorBoundaryError }
