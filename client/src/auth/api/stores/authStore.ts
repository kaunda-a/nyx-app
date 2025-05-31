import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { authApi } from '../auth-api'

interface AuthState {
  auth: {
    user: User | null
    setUser: (user: User | null) => void
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    sendPasswordResetEmail: (email: string) => Promise<void>
    verifyOtp: (otp: string, email: string) => Promise<void>
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    setUser: (user) => set((state) => ({ ...state, auth: { ...state.auth, user } })),

    signUp: async (email: string, password: string) => {
      const response = await authApi.signUp({
        email,
        password,
        metadata: { signupSource: 'web' }
      })

      if (response.error) {
        console.error('Sign up error:', response.error)
        throw new Error(response.error)
      }

      if (response.user) {
        set((state) => ({ ...state, auth: { ...state.auth, user: response.user } }))
      }
    },

    signIn: async (email: string, password: string) => {
      const response = await authApi.signIn({
        email,
        password,
      })
      if (response.error) throw new Error(response.error)
      set((state) => ({ ...state, auth: { ...state.auth, user: response.user } }))
    },

    signOut: async () => {
      const response = await authApi.signOut()
      if (response.error) throw new Error(response.error)
      set((state) => ({ ...state, auth: { ...state.auth, user: null } }))
    },

    sendPasswordResetEmail: async (email: string) => {
      const response = await authApi.resetPassword({ email })
      if (response.error) throw new Error(response.error)
    },

    verifyOtp: async (otp: string, email: string) => {
      const response = await authApi.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })
      if (response.error) throw new Error(response.error)
      set((state) => ({ ...state, auth: { ...state.auth, user: response.user } }))
    },

    reset: () => {
      set((state) => ({
        ...state,
        auth: {
          ...state.auth,
          user: null
        }
      }))
    },
  },
}))

export const useAuth = () => useAuthStore((state) => state.auth)
