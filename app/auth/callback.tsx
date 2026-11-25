import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { benchlessColors, designTokens } from '../../src/design/tokens';
import { isAdultBirthYear } from '../../src/features/auth/age';
import { authSessionStorage, getSupabaseClient, pendingGoogleBirthYearKey } from '../../src/features/auth/supabaseClient';

type State = 'loading' | 'verified' | 'recovery' | 'error' | 'saved';

export default function AuthCallbackScreen() {
  const { code, type, error_description: errorDescription } = useLocalSearchParams<{ code?: string; type?: string; error_description?: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('Confirming your account…');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function completeLink() {
      if (errorDescription) {
        await authSessionStorage.removeItem(pendingGoogleBirthYearKey).catch(() => undefined);
        if (mounted) { setMessage(errorDescription); setState('error'); }
        return;
      }
      const client = getSupabaseClient();
      if (!client || !code) {
        if (mounted) { setMessage(!client ? 'Supabase is not configured in this build. Add the settings from .env.example and open the email link again.' : 'This confirmation link is incomplete or has expired. Request a new link and try again.'); setState('error'); }
        return;
      }
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!mounted) return;
      if (error) { setMessage('This confirmation link is invalid or expired. Request a new link and try again.'); setState('error'); return; }
      const { data: authData } = await client.auth.getUser();
      const pendingBirthYear = await authSessionStorage.getItem(pendingGoogleBirthYearKey);
      if (authData.user && !authData.user.user_metadata?.birth_year && pendingBirthYear) {
        if (!isAdultBirthYear(pendingBirthYear)) {
          await client.auth.signOut();
          await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
          if (mounted) { setMessage('We couldn’t confirm the adult account setup. Return to onboarding and try again.'); setState('error'); }
          return;
        }
        const { error: profileError } = await client.auth.updateUser({ data: { birth_year: pendingBirthYear } });
        if (profileError) {
          await client.auth.signOut();
          await authSessionStorage.removeItem(pendingGoogleBirthYearKey);
          if (mounted) { setMessage('We couldn’t save the age confirmation. Return to sign in and try again.'); setState('error'); }
          return;
        }
      }
      await authSessionStorage.removeItem(pendingGoogleBirthYearKey).catch(() => undefined);
      setState(type === 'recovery' ? 'recovery' : 'verified');
      setMessage(type === 'recovery' ? 'Choose a new password for your account.' : 'Your email is confirmed. Continue to your saved setup.');
    }
    void completeLink();
    return () => { mounted = false; };
  }, [code, type, errorDescription]);

  async function savePassword() {
    if (password.length < 8) { setMessage('Use a password with at least 8 characters.'); return; }
    if (password !== confirmPassword) { setMessage('The passwords don’t match. Check both fields and try again.'); return; }
    const client = getSupabaseClient();
    if (!client) { setMessage('Supabase is not configured. Add the settings from .env.example.'); setState('error'); return; }
    setBusy(true);
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage('We couldn’t update your password. Try again or request a new reset link.'); return; }
    setPassword(''); setConfirmPassword(''); setMessage('Your password has been updated.'); setState('saved');
  }

  const c = benchlessColors.dark;
  return <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
    <View style={styles.content}>
      {state === 'loading' ? <ActivityIndicator color={c.accent} size="large"/> : null}
      <Text style={[styles.title, { color: c.text }]}>{state === 'verified' ? 'Email confirmed' : state === 'recovery' ? 'Reset your password' : state === 'saved' ? 'Password updated' : state === 'error' ? 'Link not available' : 'One moment'}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: c.secondaryText }]}>{message}</Text>
      {state === 'recovery' ? <View style={styles.form}>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="New password (8+ characters)" placeholderTextColor={c.tertiaryText} accessibilityLabel="New password" style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}/>
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="Confirm new password" placeholderTextColor={c.tertiaryText} accessibilityLabel="Confirm new password" style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}/>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void savePassword()} style={[styles.button, { backgroundColor: c.accent }]}><Text style={[styles.buttonText, { color: c.onAccent }]}>{busy ? 'Saving…' : 'Save new password'}</Text></Pressable>
      </View> : null}
      {state === 'verified' || state === 'saved' ? <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={[styles.button, { backgroundColor: c.accent }]}><Text style={[styles.buttonText, { color: c.onAccent }]}>Continue to Benchless</Text></Pressable> : null}
      {state === 'error' ? <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={[styles.button, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}><Text style={[styles.buttonText, { color: c.text }]}>Back to sign in</Text></Pressable> : null}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: designTokens.spacing.lg, gap: designTokens.spacing.md },
  title: { fontSize: designTokens.type.title, lineHeight: designTokens.lineHeight.title, fontWeight: '700', letterSpacing: -0.5 },
  message: { fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact },
  form: { gap: designTokens.spacing.sm, marginTop: designTokens.spacing.sm },
  input: { minHeight: designTokens.control.minimum, borderWidth: 1, borderRadius: designTokens.radius.control, paddingHorizontal: designTokens.spacing.md, fontSize: designTokens.type.bodyCompact },
  button: { minHeight: designTokens.control.minimum, borderRadius: designTokens.radius.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: designTokens.spacing.md, marginTop: designTokens.spacing.sm },
  buttonText: { fontSize: designTokens.type.bodyCompact, fontWeight: '700' },
});
