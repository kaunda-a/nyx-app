
import { useEffect } from 'react'
import { createRootRouteWithContext, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/auth/api/stores/authStore'
import { Toaster } from '@/components/ui/toaster'
import { createClient } from '@supabase/supabase-js'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useLoading } from '@/provider/loading-context'

// Inline supabase client to avoid import issues during build
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Add NotFound component
function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg">Page not found</p>
    </div>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  beforeLoad: async ({ location }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (location.pathname === '/') {
        if (!session?.user) {
          throw redirect({ to: '/sign-in-2' })
        }
      }
    } catch (error) {
      // If there's an error getting the session and we're on the root path,
      // redirect to sign-in
      if (location.pathname === '/') {
        throw redirect({ to: '/sign-in-2' })
      }
      // For other paths, let the error bubble up
      throw error
    }
  }
})

function RootComponent() {
  const { user, setUser } = useAuthStore((state) => state.auth)
  const navigate = useNavigate()
  const { setIsLoading } = useLoading()

  useEffect(() => {
    const loadSession = async () => {
      console.log('Loading session...')
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session loaded:', session?.user ? 'User found' : 'No user')
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error loading session:', error)
        setUser(null)
      } finally {
        console.log('Setting loading to false')
        setIsLoading(false)
      }
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user ? 'User found' : 'No user')
        setUser(session?.user ?? null)

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          navigate({ to: '/logout-success' })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [navigate, setUser, setIsLoading])

  return (
    <>
      <Outlet />
      <Toaster />
      {import.meta.env.MODE === 'development' && (
        <>
          <ReactQueryDevtools buttonPosition='bottom-left' />
          <TanStackRouterDevtools position='bottom-right' />
        </>
      )}
    </>
  )
}
