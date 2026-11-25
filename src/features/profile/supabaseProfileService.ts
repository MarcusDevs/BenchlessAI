import type { OnboardingProfile, ProfileRecord, UserId } from '../../domain/models';
import type { ProfileService, ServiceResult } from '../../services/contracts';
import { getSupabaseClient } from '../auth/supabaseClient';

type ProfileRow = {
  id: string;
  onboarding_answers: OnboardingProfile | null;
  onboarding_completed_at: string | null;
  updated_at: string;
};

function unavailable<T>(): ServiceResult<T> {
  return { ok: false, error: { code: 'unavailable', message: 'Profile sync is unavailable. Your onboarding answers remain saved on this device.', recoverable: true } };
}

function failure<T>(): ServiceResult<T> {
  return { ok: false, error: { code: 'unknown', message: 'We couldn’t sync your setup to your account. Check your connection and try again.', recoverable: true } };
}

function profileFailure<T>(error?: { code?: string; message?: string; status?: number }): ServiceResult<T> {
  const code = error?.code ?? '';
  const serverMessage = error?.message?.toLowerCase() ?? '';
  let message = 'Supabase could not save your setup. Try again in a moment.';

  if (code === '42P01' || code === 'PGRST205' || (serverMessage.includes('relation') && serverMessage.includes('profiles'))) {
    message = 'The Supabase profiles table is missing. Apply Benchless migrations 202611190001_auth_profiles.sql and 202611190002_onboarding_profile_preferences.sql.';
  } else if (code === '42703' || code === 'PGRST204') {
    message = 'The Supabase profiles table is missing onboarding columns. Apply migration 202611190002_onboarding_profile_preferences.sql, then try again.';
  } else if (code === '42501' || serverMessage.includes('row-level security')) {
    message = 'Supabase blocked this profile write. Check that the profile migrations and owner-only profiles policies are applied, and that you are signed into this account.';
  } else if (code === '23503') {
    message = 'Supabase could not match this profile to its signed-in Auth user. Sign out and sign in again. If this persists, check that the app’s Supabase project URL is the same project where this account exists and where the profile migrations were applied.';
  } else if (code === '22023' || code === '23514') {
    message = 'Supabase rejected the profile because its age check did not pass. Return to onboarding and confirm the birth year.';
  } else if (error?.status === 401 || code === 'PGRST301') {
    message = 'Your Supabase session has expired. Sign in again, then continue.';
  } else if (serverMessage.includes('network') || serverMessage.includes('fetch') || serverMessage.includes('timeout')) {
    message = 'The app could not reach Supabase. Check the project URL and network, then try again.';
  }

  const safeCode = code && /^[A-Z0-9]{4,10}$/i.test(code) ? ` (${code})` : '';
  if (message === 'Supabase could not save your setup. Try again in a moment.' && safeCode) {
    message = `Supabase could not save your setup${safeCode}. Try again in a moment.`;
  }
  return { ok: false, error: { code: 'unknown', message, recoverable: true } };
}

export const supabaseProfileService: ProfileService = {
  async get(userId: UserId) {
    const supabase = getSupabaseClient();
    if (!supabase) return { ok: true, value: null, source: 'local-preview' };
    try {
      const { data, error } = await supabase.from('profiles').select('id,onboarding_answers,onboarding_completed_at,updated_at').eq('id', userId).maybeSingle();
      if (error) return profileFailure(error);
      const row = data as ProfileRow | null;
      if (!row?.onboarding_answers || Object.keys(row.onboarding_answers).length === 0) return { ok: true, value: null, source: 'remote' };
      return { ok: true, value: { userId: row.id, onboarding: row.onboarding_answers, completedAt: row.onboarding_completed_at, updatedAt: row.updated_at }, source: 'remote' };
    } catch (error) {
      return error instanceof Error ? profileFailure({ message: error.message }) : failure();
    }
  },

  async save(userId: UserId, profile: OnboardingProfile, completedAt: string | null) {
    const supabase = getSupabaseClient();
    if (!supabase) return unavailable();
    try {
      const { data, error } = await supabase.from('profiles').upsert({
        id: userId,
        goal: profile.goal,
        experience: profile.experience,
        equipment: profile.equipment,
        cardio: profile.cardio,
        training_days: profile.days,
        birth_year: Number(profile.birthYear),
        training_time: profile.trainingTime,
        workout_reminders: profile.workoutReminders,
        session_check_ins: profile.sessionCheckIns,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        onboarding_answers: profile,
        onboarding_completed_at: completedAt,
      }, { onConflict: 'id' }).select('id,onboarding_answers,onboarding_completed_at,updated_at').single();
      if (error || !data) return profileFailure(error ?? undefined);
      const row = data as ProfileRow;
      return { ok: true, value: { userId: row.id, onboarding: row.onboarding_answers ?? profile, completedAt: row.onboarding_completed_at, updatedAt: row.updated_at } satisfies ProfileRecord, source: 'remote' };
    } catch (error) {
      return error instanceof Error ? profileFailure({ message: error.message }) : failure();
    }
  },
};
