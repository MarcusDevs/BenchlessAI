import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { AppOwnership } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const configuredRedirectUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
const expoGoRedirectUrl = Linking.createURL('auth/callback');
export const authRedirectUrl = Constants.appOwnership === AppOwnership.Expo
  ? expoGoRedirectUrl
  : Platform.OS === 'web'
    ? expoGoRedirectUrl
    : configuredRedirectUrl || expoGoRedirectUrl;
export const pendingGoogleBirthYearKey = 'benchless.auth.pendingGoogleBirthYear';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_PROJECT_REF') && !supabaseAnonKey.includes('YOUR_'));

let client: SupabaseClient | null = null;

const sessionStorage = Platform.OS === 'web' ? AsyncStorage : {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
export const authSessionStorage = sessionStorage;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }
  return client;
}
