import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import type { OnboardingProfile, UserId } from '../../domain/models';
import { getSupabaseClient } from './supabaseClient';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
export type AuthProfileState = {
  userId: UserId;
  onboarding: OnboardingProfile | null;
  completedAt: string | null;
};

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  profile: AuthProfileState | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfileState | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const activeRequest = useRef(0);
  const client = getSupabaseClient();

  const loadProfile = useCallback(async (nextSession: Session | null, requestId: number) => {
    if (!nextSession) {
      if (requestId !== activeRequest.current) return;
      setSession(null);
      setProfile(null);
      setProfileError(null);
      setStatus('signedOut');
      return;
    }

    setStatus('loading');
    setSession(nextSession);
    setProfile(null);
    setProfileError(null);

    if (!client) {
      if (requestId !== activeRequest.current) return;
      setStatus('signedIn');
      setProfileError('Account profile services are unavailable in this preview.');
      return;
    }

    try {
      // getSession restores cached storage, which may still contain a user deleted in Supabase.
      // Confirm the user with Auth before treating that cached session as an account.
      const { data: authData, error: authError } = await client.auth.getUser(nextSession.access_token);
      if (requestId !== activeRequest.current) return;
      if (authError) {
        const expiredOrDeleted = authError.name === 'AuthApiError' && typeof authError.status === 'number' && [401, 403, 404].includes(authError.status);
        if (expiredOrDeleted) {
          await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
          if (requestId === activeRequest.current) {
            setSession(null);
            setProfile(null);
            setProfileError(null);
            setStatus('signedOut');
          }
          return;
        }
        setProfileError('We couldn’t verify your saved account session. Check your connection and try again.');
        setStatus('signedIn');
        return;
      }
      if (!authData.user || authData.user.id !== nextSession.user.id) {
        await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
        if (requestId === activeRequest.current) {
          setSession(null);
          setProfile(null);
          setProfileError(null);
          setStatus('signedOut');
        }
        return;
      }

      const { data, error } = await client
        .from('profiles')
        .select('id,onboarding_answers,onboarding_completed_at')
        .eq('id', nextSession.user.id)
        .maybeSingle();
      if (requestId !== activeRequest.current) return;
      if (error) {
        setProfileError('We couldn’t verify your saved setup. Check your connection and try again.');
        setStatus('signedIn');
        return;
      }
      const row = data as { id: string; onboarding_answers: OnboardingProfile | null; onboarding_completed_at: string | null } | null;
      setProfile(row ? {
        userId: row.id,
        onboarding: row.onboarding_answers && Object.keys(row.onboarding_answers).length ? row.onboarding_answers : null,
        completedAt: row.onboarding_completed_at,
      } : null);
      setStatus('signedIn');
    } catch {
      if (requestId !== activeRequest.current) return;
      setProfileError('We couldn’t verify your saved setup. Check your connection and try again.');
      setStatus('signedIn');
    }
  }, [client]);

  const refreshProfile = useCallback(async () => {
    const requestId = ++activeRequest.current;
    await loadProfile(session, requestId);
  }, [loadProfile, session]);

  useEffect(() => {
    if (!client) {
      setSession(null);
      setProfile(null);
      setProfileError(null);
      setStatus('signedOut');
      return;
    }

    let mounted = true;
    let authEventReceived = false;
    const subscription = client.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') return;
      authEventReceived = true;
      const requestId = ++activeRequest.current;
      if (event === 'SIGNED_OUT' || !nextSession) {
        void loadProfile(null, requestId);
      } else {
        // Supabase advises deferring follow-up client calls out of this callback.
        void Promise.resolve().then(() => loadProfile(nextSession, requestId));
      }
    }).data.subscription;

    void client.auth.getSession().then(({ data, error }) => {
      if (!mounted || authEventReceived) return;
      const requestId = ++activeRequest.current;
      if (error) {
        setProfileError('We couldn’t restore your saved account session. Try again.');
        setStatus('signedOut');
        return;
      }
      void loadProfile(data.session, requestId);
    }).catch(() => {
      if (mounted && !authEventReceived) {
        setProfileError('We couldn’t restore your saved account session. Try again.');
        setStatus('signedOut');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client, loadProfile]);

  useEffect(() => {
    if (!client || Platform.OS === 'web') return;
    const updateRefresh = (state: string) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    };
    updateRefresh(AppState.currentState ?? 'active');
    const subscription = AppState.addEventListener('change', updateRefresh);
    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, [client]);

  const value = useMemo(() => ({ status, session, profile, profileError, refreshProfile }), [status, session, profile, profileError, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
