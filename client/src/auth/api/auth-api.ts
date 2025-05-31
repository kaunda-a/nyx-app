import { supabase } from '@/lib/supabase';
import { User, EmailOtpType } from '@supabase/supabase-js';

/**
 * Types for authentication API
 */
export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  error?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  token: string;
  type: EmailOtpType; // 'signup' | 'recovery' | 'email_change' | 'email'
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  metadata?: Record<string, any>;
}

/**
 * Authentication API client
 *
 * This provides a clean interface for authentication operations,
 * abstracting away the details of Supabase authentication.
 */
export const authApi = {
  /**
   * Sign in with email and password
   */
  signIn: async (credentials: SignInCredentials): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      return {
        user: data.user,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        } : null,
      };
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      return {
        user: null,
        session: null,
        error: error.message || 'Failed to sign in',
      };
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (credentials: SignUpCredentials): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: credentials.metadata,
        },
      });

      if (error) {
        throw error;
      }

      return {
        user: data.user,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        } : null,
      };
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      return {
        user: null,
        session: null,
        error: error.message || 'Failed to sign up',
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to sign out',
      };
    }
  },

  /**
   * Send a password reset email
   */
  resetPassword: async (request: ResetPasswordRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to send reset password email',
      };
    }
  },

  /**
   * Update the user's password
   */
  updatePassword: async (request: UpdatePasswordRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: request.password,
      });
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to update password',
      };
    }
  },

  /**
   * Verify a one-time password (OTP)
   */
  verifyOtp: async (request: VerifyOtpRequest): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: request.email,
        token: request.token,
        type: request.type,
      });

      if (error) {
        throw error;
      }

      return {
        user: data.user,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        } : null,
      };
    } catch (error: any) {
      console.error('Verify OTP error:', error.message);
      return {
        user: null,
        session: null,
        error: error.message || 'Failed to verify OTP',
      };
    }
  },

  /**
   * Get the current session
   */
  getSession: async (): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      return {
        user: data.session?.user || null,
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        } : null,
      };
    } catch (error: any) {
      console.error('Get session error:', error.message);
      return {
        user: null,
        session: null,
        error: error.message || 'Failed to get session',
      };
    }
  },

  /**
   * Get the current user's profile
   */
  getUserProfile: async (): Promise<UserProfile | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (error) {
        throw error;
      }

      return data as UserProfile;
    } catch (error: any) {
      console.error('Get user profile error:', error.message);
      return null;
    }
  },

  /**
   * Update the user's profile
   */
  updateUserProfile: async (profile: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', session.session.user.id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update user profile error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  },
};