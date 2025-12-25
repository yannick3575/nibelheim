'use client';

import { createClient } from '@/lib/supabase/client';

// Action state types
export type AuthState = {
  error: string | null;
  success: string | null;
};

// Lazy initialize Supabase client
const getSupabase = () => createClient();

// Use configured site URL for redirects, fallback to current origin
const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

/**
 * Login action - sign in with email/password
 */
export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email et mot de passe requis', success: null };
  }

  try {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message, success: null };
    }

    return { error: null, success: 'login' };
  } catch {
    return { error: 'Une erreur est survenue', success: null };
  }
}

/**
 * Magic link action - sign in with OTP email
 */
export async function magicLinkAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email requis', success: null };
  }

  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message, success: null };
    }

    return { error: null, success: 'magic-link' };
  } catch {
    return { error: 'Une erreur est survenue', success: null };
  }
}

/**
 * Sign up action - create new account
 */
export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email et mot de passe requis', success: null };
  }

  try {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message, success: null };
    }

    return { error: null, success: 'signup' };
  } catch {
    return { error: 'Une erreur est survenue', success: null };
  }
}
