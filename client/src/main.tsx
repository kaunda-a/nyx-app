import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/auth/api/stores/authStore'
import { handleServerError } from '@/lib/handle-server-error'
import { toast } from '@/hooks/use-toast'
import { FontProvider } from './provider/font-context'
import { ThemeProvider } from './provider/theme-context'
import { LoadingProvider } from './provider/loading-context'
import ErrorBoundary from '@/errors/error-boundary'
import GeneralError from '@/errors/general-error'
import './index.css'
// Generated Routes
import { routeTree } from './routeTree.gen'

// Global error handler for uncaught promises
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  toast({
    variant: 'destructive',
    title: 'Unexpected Error',
    description: event.reason?.message || 'An unexpected error occurred',
  })
}

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error })
  toast({
    variant: 'destructive',
    title: 'Unexpected Error',
    description: error?.message || 'An unexpected error occurred',
  })
  return false
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (import.meta.env.DEV) {
          console.group('Query Retry')
          console.log({ failureCount, error })
          console.groupEnd()
        }

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        if (import.meta.env.DEV) {
          console.group('Mutation Error')
          console.error(error)
          console.groupEnd()
        }

        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast({
              variant: 'destructive',
              title: 'Content not modified!',
            })
          }
          if (error.response?.status === 503) {
            toast({
              variant: 'destructive',
              title: 'Service Unavailable',
              description: 'The system is under maintenance. Please try again later.'
            })
            router.navigate({ to: '/503' })
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.group('Query Cache Error')
        console.error(error)
        console.groupEnd()
      }

      if (error instanceof AxiosError) {
        const status = error.response?.status

        switch (status) {
          case 401:
            toast({
              variant: 'destructive',
              title: 'Session expired!',
            })
            useAuthStore.getState().auth.reset()
            const redirect = `${router.history.location.href}`
            router.navigate({ to: '/sign-in', search: { redirect } })
            break

          case 403:
            toast({
              variant: 'destructive',
              title: 'Access Forbidden',
              description: 'You don\'t have permission to access this resource.'
            })
            router.navigate({ to: '/403', replace: true })
            break

          case 404:
            router.navigate({ to: '/404' })
            break

          case 500:
            toast({
              variant: 'destructive',
              title: 'Internal Server Error!',
              description: 'Something went wrong on our end. Please try again later.'
            })
            router.navigate({ to: '/500' })
            break

          case 503:
            toast({
              variant: 'destructive',
              title: 'Service Unavailable',
              description: 'The system is under maintenance. Please try again later.'
            })
            router.navigate({ to: '/503' })
            break

          default:
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'An unexpected error occurred. Please try again.'
            })
            router.navigate({ to: '/598' })
        }
      }
    },
  }),
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: GeneralError,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
            <FontProvider>
              <LoadingProvider>
                <RouterProvider router={router} />
              </LoadingProvider>
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
