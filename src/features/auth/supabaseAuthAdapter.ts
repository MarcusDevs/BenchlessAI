import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { AccountIdentity } from '../../domain/models';
import type { AuthService, ServiceResult } from '../../services/contracts';
import { isAdultBirthYear } from './age';
import { authRedirectUrl, authSessionStorage, getSupabaseClient, pendingGoogleBirthYearKey } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

function unavailable<T>(message: string): ServiceResult<T> {
  return { ok: false, error: { code: 'unavailable', message, recoverable: true } };
}

function failure<T>(message: string, code: 'offline' | 'unauthorized' | 'email-unconfirmed' | 'invalid' | 'unknown' = 'unknown', debugDetails?: string): ServiceResult<T> {
  return { ok: false, error: { code, message, recoverable: true, ...(debugDetails && __DEV__ ? { debugDetails } : {}) } };
}

function rawAuthError(error: { name?: string; message?: string; status?: number; code?: string }): string {
  return JSON.stringify({ name: error.name, message: error.message, status: error.status, code: error.code }, null, 2);
}

export function identityFromSupabaseUser(user: { id: string; user_metadata?: Record<string, unknown> }): AccountIdentity {
  const metadata = user.user_metadata ?? {};
  const fullName = [metadata.full_name, metadata.name, metadata.fullName].find((value) => typeof value === 'string' && value.trim());
  return { userId: user.id, fullName: typeof fullName === 'string' ? fullName.trim() : null };
}

function authMessage(error: { message?: string }, context: 'sign-in' | 'sign-up' | 'reset' | 'verify') {
  const message = error.message?.toLowerCase() ?? '';
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect. Check your details or reset your password.';
  if (message.includes('email not confirmed')) return 'Verify your email with the code we sent, then sign in again.';
  if (context === 'verify' && (message.includes('expired') || message.includes('invalid') || message.includes('token'))) return 'That code was invalid or expired. Request a fresh code and use the newest email.';
  if (message.includes('too many requests') || message.includes('rate limit')) return 'Too many verification attempts. Wait a few minutes, then request a fresh code.';
  if (message.includes('already confirmed') || message.includes('already verified')) return 'This email is already verified. Return to sign in and use your password.';
  if (message.includes('already registered') || message.includes('user already registered')) return 'We couldn’t create an account with those details. Try signing in or use password reset.';
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) return 'Choose a stronger password with at least 8 characters.';
  if (message.includes('network') || message.includes('fetch')) return 'Connection problem. Check your internet and try again.';
  if (context === 'sign-in') return 'We couldn’t sign you in. Check your details or reset your password.';
  if (context === 'sign-up') return 'We couldn’t create your account. Check your details and try again.';
  if (context === 'reset') return 'We couldn’t send the reset link. Check your connection and try again.';
  return 'We couldn’t verify that code. Check it or request a new one and try again.';
}

function noClient<T>(): ServiceResult<T> {
  return unavailable('Add the Supabase project URL and anon key to .env, then restart Expo. No account session was created.');
}

export function supabaseUserIsAdult(user: { user_metadata?: Record<string, unknown> }): boolean {
  const birthYear = user.user_metadata?.birth_year;
  return isAdultBirthYear(typeof birthYear === 'string' ? birthYear : '');
}

export const supabaseAuthAdapter: AuthService = {
  async signIn(email, password) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const unconfirmed = error.message.toLowerCase().includes('email not confirmed');
      return failure(authMessage(error, 'sign-in'), unconfirmed ? 'email-unconfirmed' : 'unauthorized', rawAuthError(error));
    }
    if (!data.user) return failure('Supabase did not return an account session. Try again.');
    if (!supabaseUserIsAdult(data.user)) { await supabase.auth.signOut(); return failure('We couldn’t confirm the adult account setup. Return to onboarding or contact support.', 'unauthorized'); }
    return { ok: true, value: identityFromSupabaseUser(data.user), source: 'remote' };
  },

  async signUp(fullName, email, password, birthYear) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, birth_year: birthYear },
      },
    });
    if (error) return failure(authMessage(error, 'sign-up'), 'invalid', rawAuthError(error));
    if (!data.user) return failure('Supabase did not return an account. Try again.');
    // Supabase returns an obfuscated user with no identities for an already-confirmed
    // email when confirmation is enabled. That is not a new signup, so no fresh
    // confirmation OTP is sent for this response.
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return failure('We couldn’t start a new email verification. If you already created an account, sign in or reset your password. Otherwise, wait a minute and try again.', 'invalid');
    }
    const account = identityFromSupabaseUser(data.user);
    if (!data.session) return { ok: true, value: { ...account, verificationRequired: true }, source: 'remote' };
    return { ok: true, value: { ...account, verificationRequired: false }, source: 'remote' };
  },

  async verifyEmail(email, token) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    // Supabase's email OTP verification flow uses `email`, including signup confirmation codes.
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) return failure(authMessage(error, 'verify'), 'unauthorized', rawAuthError(error));
    if (!data.user || !data.session) return failure('Email verification did not create a signed-in session. Request a new code and try again.', 'unauthorized');
    if (!supabaseUserIsAdult(data.user)) {
      await supabase.auth.signOut();
      return failure('We couldn’t confirm the adult account setup. Return to onboarding or contact support.', 'unauthorized');
    }
    return { ok: true, value: identityFromSupabaseUser(data.user), source: 'remote' };
  },

  async signInWithGoogle(birthYear) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    if (!isAdultBirthYear(birthYear)) return failure('Enter a birth year that confirms you’re at least 18.', 'invalid');
    await authSessionStorage.setItem(pendingGoogleBirthYearKey, birthYear);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authRedirectUrl, skipBrowserRedirect: true },
      });
      if (error || !data.url) {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
        return failure(error ? authMessage(error, 'sign-in') : 'Google sign-in could not be started. Try again.');
      }

      if (Platform.OS === 'web') {
        // A full-page redirect avoids popup blockers after the async Supabase request.
        window.location.assign(data.url);
        return await new Promise<ServiceResult<AccountIdentity>>(() => undefined);
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);
      if (result.type !== 'success') {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
        return failure('Google sign-in was canceled or did not finish. You can try again.', 'unauthorized');
      }
      const code = new URL(result.url).searchParams.get('code');
      if (!code) {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
        return failure('Google sign-in did not return a confirmation code. Try again.');
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
        return failure(authMessage(sessionError, 'sign-in'), 'unauthorized');
      }
      if (!sessionData.user) {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
        return failure('Google sign-in did not create a session. Try again.');
      }
      if (!sessionData.user.user_metadata?.birth_year) {
        const { error: metadataError } = await supabase.auth.updateUser({ data: { birth_year: birthYear } });
        if (metadataError) {
          await supabase.auth.signOut();
          await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
          return failure('We couldn’t save the age confirmation. Sign out and try again.');
        }
      }
      await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
      if (!supabaseUserIsAdult((await supabase.auth.getUser()).data.user ?? sessionData.user)) { await supabase.auth.signOut(); return failure('We couldn’t confirm the adult account setup.', 'unauthorized'); }
      return { ok: true, value: identityFromSupabaseUser(sessionData.user), source: 'remote' };
    } catch (error) {
      await authSessionStorage.removeItem(pendingGoogleBirthYearKey).catch(() => undefined);
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      console.warn('Google OAuth handoff failed:', errorName);
      return failure(Platform.OS === 'web'
        ? 'Google sign-in could not return to this web preview. Allow the localhost callback in Supabase Auth → URL Configuration and allow sign-in pop-ups for this preview.'
        : 'Google sign-in could not be completed. Check the Supabase redirect allow-list and try again.');
    }
  },

  async signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    const { error } = await supabase.auth.signOut();
    return error ? failure('We couldn’t sign you out. Try again.') : { ok: true, value: undefined, source: 'remote' };
  },

  async requestPasswordReset(email) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl });
    return error ? failure(authMessage(error, 'reset')) : { ok: true, value: undefined, source: 'remote' };
  },

  async resendVerification(email) {
    const supabase = getSupabaseClient();
    if (!supabase) return noClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return error ? failure(authMessage(error, 'verify'), 'unknown', rawAuthError(error)) : { ok: true, value: undefined, source: 'remote' };
  },

  async currentUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: true, value: null, source: 'local-preview' };
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error.name === 'AuthSessionMissingError') return { ok: true, value: null, source: 'remote' };
      return failure('We couldn’t verify your saved account session. Check your connection and try again.', 'unauthorized');
    }
    if (data.user && !supabaseUserIsAdult(data.user)) return { ok: true, value: null, source: 'remote' };
    return { ok: true, value: data.user ? identityFromSupabaseUser(data.user) : null, source: 'remote' };
  },
};
