import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { benchlessColors, designTokens, type ColorScheme } from '../../design/tokens';
import type { AccountIdentity } from '../../domain/models';
import type { AuthService, ServiceResult } from '../../services/contracts';
import { supabaseAuthAdapter } from './supabaseAuthAdapter';
import { isSupabaseConfigured } from './supabaseClient';
import { isAdultBirthYear } from './age';

type ViewName = 'choice' | 'google-age' | 'sign-in' | 'sign-up' | 'reset' | 'verification' | 'reset-confirmation' | 'signed-in' | 'error';
type Props = {
  appearance: ColorScheme;
  birthYear: string;
  onBack: () => void;
  onAuthenticated: (identity: AccountIdentity) => void;
  initialIdentity?: AccountIdentity | null;
  auth?: AuthService;
};

export function AccountAccessScreen({ appearance, birthYear, onBack, onAuthenticated, initialIdentity = null, auth = supabaseAuthAdapter }: Props) {
  const [view, setView] = useState<ViewName>(initialIdentity ? 'signed-in' : 'choice');
  const [returnView, setReturnView] = useState<ViewName>('choice');
  const [fullName, setFullName] = useState('');
  const [googleBirthYear, setGoogleBirthYear] = useState(birthYear);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [validation, setValidation] = useState('');
  const [message, setMessage] = useState('');
  const [debugDetails, setDebugDetails] = useState('');
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [identity, setIdentity] = useState<AccountIdentity | null>(initialIdentity);
  const styles = makeStyles(appearance);
  const adult = isAdultBirthYear(birthYear);

  async function perform<T>(operation: () => Promise<ServiceResult<T>>, onSuccess: (value: T) => void, fallback: string) {
    setBusy(true); setValidation('');
    try {
      const result = await operation();
      if (!result.ok) {
        setPassword(''); setMessage(result.error.message); setDebugDetails(result.error.debugDetails ?? ''); setNeedsEmailVerification(result.error.code === 'email-unconfirmed'); setReturnView(view); setView('error');
      } else if (result.source !== 'remote') {
        setPassword(''); setMessage('Account services are unavailable in this preview. No account was created or signed in.'); setNeedsEmailVerification(false); setReturnView(view); setView('error');
      } else onSuccess(result.value);
    } catch (error) {
      setPassword(''); setMessage(fallback); setDebugDetails(__DEV__ ? error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error) : ''); setReturnView(view); setView('error');
    } finally { setBusy(false); }
  }

  function submitGoogle() {
    if (!isAdultBirthYear(googleBirthYear)) { setValidation('Enter a birth year that confirms you’re at least 18.'); setView('google-age'); return; }
    void perform(() => auth.signInWithGoogle(googleBirthYear), (identity) => finishSignIn(identity), 'Google sign-in could not be completed. Check your connection and try again.');
  }

  function validate(mode: 'sign-in' | 'sign-up' | 'reset') {
    if (mode === 'sign-up' && fullName.trim().length < 2) { setValidation('Enter your name so we can personalize your account.'); return false; }
    if (mode === 'sign-up' && !adult) { setValidation('Complete onboarding and confirm you’re 18 or older before creating an account.'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setValidation('Enter a valid email address, such as name@example.com.'); return false; }
    if (mode !== 'reset' && password.length < 8) { setValidation('Use a password with at least 8 characters.'); return false; }
    if (mode === 'sign-up' && password !== confirmation) { setValidation('The passwords don’t match. Check both fields and try again.'); return false; }
    return true;
  }

  function finishSignIn(identity: AccountIdentity) {
    setPassword(''); setConfirmation(''); setIdentity(identity); setView('signed-in');
  }

  async function resendForUnconfirmedAccount() {
    setBusy(true);
    setValidation('');
    try {
      const result = await auth.resendVerification(email.trim());
      if (!result.ok) {
        setMessage(result.error.message);
        setNeedsEmailVerification(true);
        return;
      }
      if (result.source !== 'remote') {
        setMessage('Account services are unavailable in this preview. No verification code was sent.');
        setNeedsEmailVerification(true);
        return;
      }
      setVerificationCode('');
      setMessage(`A new 6-digit code was sent to ${email.trim()}. Enter it here to verify your email and continue.`);
      setView('verification');
    } catch {
      setMessage('We couldn’t resend the verification code. Check your connection and try again.');
      setNeedsEmailVerification(true);
    } finally {
      setBusy(false);
    }
  }

  function submitEmail(mode: 'sign-in' | 'sign-up' | 'reset') {
    if (!validate(mode)) return;
    if (mode === 'reset') {
      void perform(() => auth.requestPasswordReset(email.trim()), () => { setMessage('If an account matches this email, you’ll receive a reset link.'); setView('reset-confirmation'); }, 'We couldn’t send the reset request. Check your connection and try again.');
    } else if (mode === 'sign-up') {
      void perform(() => auth.signUp(fullName.trim(), email.trim(), password, birthYear), (result) => {
        setPassword(''); setConfirmation('');
        if (result.verificationRequired) { setVerificationCode(''); setMessage(`We sent a 6-digit code to ${email.trim()}. Enter it here to verify your email and continue.`); setView('verification'); }
        else finishSignIn(result);
      }, 'We couldn’t create your account. Check your details and try again.');
    } else {
      void perform(() => auth.signIn(email.trim(), password), finishSignIn, 'We couldn’t sign you in. Check your details or reset your password.');
    }
  }

  if (view === 'choice') return <Frame title="Welcome to Benchless" subtitle="Sign in to open your training plan and keep your profile, preferences, and progress together." onBack={onBack} styles={styles}>
    <View style={styles.hero}><Text style={styles.heroEyebrow}>YOUR TRAINING, IN ONE PLACE</Text><Text style={styles.heroTitle}>A plan that moves with you.</Text><Text style={styles.bodySmall}>Your account keeps your training setup and progress available when you return.</Text></View>
    <Action label="Continue with Google" onPress={() => { setValidation(''); if (adult) submitGoogle(); else setView('google-age'); }} disabled={busy} styles={styles}/>
    <Action label="Continue with email" secondary onPress={() => { setValidation(''); setView('sign-up'); }} disabled={busy} styles={styles}/>
    <Pressable accessibilityRole="button" onPress={() => setView('sign-in')} style={styles.textButton}><Text style={styles.linkText}>Already have an account? Sign in</Text></Pressable>
    {validation ? <Text accessibilityRole="alert" style={styles.validation}>{validation}</Text> : null}
    <Text style={styles.providerNote}>{isSupabaseConfigured ? 'Sign-in is protected by your Benchless account.' : 'Add the Supabase settings from .env.example, then restart Expo to enable accounts.'}</Text>
    {busy && <Loading styles={styles}/>}
  </Frame>;

  if (view === 'google-age') return <Frame title="Before you continue" subtitle="Benchless AI is for adults 18 and over. Enter your birth year to continue with Google." onBack={() => { setValidation(''); setView('choice'); }} styles={styles}>
    <FieldLabel text="YEAR OF BIRTH" styles={styles}/><TextInput value={googleBirthYear} onChangeText={(value) => { setGoogleBirthYear(value.replace(/\D/g, '').slice(0, 4)); setValidation(''); }} keyboardType="number-pad" inputMode="numeric" maxLength={4} placeholder="YYYY" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Year of birth" style={styles.input}/>
    {validation ? <Text accessibilityRole="alert" style={styles.validation}>{validation}</Text> : null}
    <Action label="Continue with Google" onPress={submitGoogle} disabled={busy} styles={styles}/>
  </Frame>;

  if (view === 'error') return <Frame title={returnView === 'sign-up' ? 'We couldn’t create your account' : returnView === 'reset' ? 'We couldn’t send the reset link' : 'We couldn’t sign you in'} subtitle={message} onBack={() => setView(returnView)} styles={styles}>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Your setup is still saved.</Text><Text style={styles.bodySmall}>No account session was confirmed, so your training area remains locked.</Text></View>
    {__DEV__ && debugDetails ? <View style={styles.notice}><Text style={styles.noticeTitle}>Raw auth error (development only)</Text><Text selectable style={styles.bodySmall}>{debugDetails}</Text></View> : null}
    {needsEmailVerification ? <Action label="Send verification code" onPress={() => void resendForUnconfirmedAccount()} disabled={busy} styles={styles}/> : null}
    {returnView === 'sign-up' ? <Action label="Go to sign in" onPress={() => { setView('sign-in'); setMessage(''); setDebugDetails(''); }} secondary styles={styles}/> : null}
    <Action label="Return to form" onPress={() => setView(returnView)} styles={styles}/><Action label="Back to onboarding" secondary onPress={onBack} styles={styles}/>
  </Frame>;

  if (view === 'verification' || view === 'reset-confirmation') return <Frame title={view === 'verification' ? 'Enter your code' : 'Check your email'} subtitle={message} onBack={() => setView('sign-in')} styles={styles}>
    {view === 'reset-confirmation' && <View style={styles.notice}><Text style={styles.bodySmall}>For privacy, this message is the same whether or not an account matches the address.</Text></View>}
    {view === 'verification' && <View style={styles.form}>
      <FieldLabel text="6-DIGIT EMAIL CODE" styles={styles}/>
      <TextInput value={verificationCode} onChangeText={(value) => { setVerificationCode(value.replace(/\D/g, '').slice(0, 6)); setValidation(''); }} keyboardType="number-pad" inputMode="numeric" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" placeholder="000000" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Email verification code" returnKeyType="done" style={[styles.input, styles.codeInput]}/>
      {validation ? <Text accessibilityRole="alert" style={styles.validation}>{validation}</Text> : null}
      {busy && <Loading styles={styles}/>}
      <Action label="Verify email" onPress={() => {
        if (verificationCode.length !== 6) { setValidation('Enter the 6-digit code from your email.'); return; }
        void perform(() => auth.verifyEmail(email.trim(), verificationCode), finishSignIn, 'We couldn’t verify that code. Check it and try again.');
      }} disabled={busy || verificationCode.length !== 6} styles={styles}/>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void perform(() => auth.resendVerification(email.trim()), () => setMessage(`A new verification code was sent to ${email.trim()}.`), 'We couldn’t resend the verification code. Try again.')} style={styles.textButton}><Text style={styles.linkText}>Resend code</Text></Pressable>
    </View>}
    <Action label="Back to sign in" onPress={() => setView('sign-in')} styles={styles}/>
  </Frame>;

  if (view === 'signed-in') return <Frame title={identity?.fullName ? `Welcome, ${identity.fullName.split(/\s+/)[0]}` : 'You’re signed in'} subtitle="Your account is confirmed. Continue to your training area." onBack={() => identity && onAuthenticated(identity)} styles={styles}>
    <View style={styles.success}><Text style={styles.successMark}>✓</Text><Text style={styles.noticeTitle}>Account confirmed</Text><Text style={styles.bodySmall}>You can continue to your training area.</Text></View>
    <Action label="Continue to Benchless" onPress={() => identity && onAuthenticated(identity)} styles={styles}/>
  </Frame>;

  const mode = view === 'reset' ? 'reset' : view === 'sign-in' ? 'sign-in' : 'sign-up';
  const title = mode === 'sign-in' ? 'Sign in' : mode === 'reset' ? 'Reset your password' : 'Create your account';
  const subtitle = mode === 'sign-in' ? 'Sign in to continue to your training.' : mode === 'reset' ? 'Enter your email and we’ll send a reset link if an account matches.' : 'Your name and email help personalize your training account.';
  return <Frame title={title} subtitle={subtitle} onBack={() => { setValidation(''); setView(mode === 'reset' ? 'sign-in' : 'choice'); }} styles={styles}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        {mode === 'sign-up' && <><FieldLabel text="YOUR NAME" styles={styles}/><TextInput value={fullName} onChangeText={(value) => { setFullName(value); setValidation(''); }} autoComplete="name" textContentType="name" autoCapitalize="words" placeholder="Name" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Your name" returnKeyType="next" style={styles.input}/></>}
        <FieldLabel text="EMAIL" styles={styles}/><TextInput value={email} onChangeText={(value) => { setEmail(value); setValidation(''); }} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCapitalize="none" autoCorrect={false} inputMode="email" placeholder="name@example.com" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Email address" returnKeyType="next" style={styles.input}/>
        {mode !== 'reset' && <><FieldLabel text="PASSWORD" styles={styles}/><TextInput value={password} onChangeText={(value) => { setPassword(value); setValidation(''); }} secureTextEntry textContentType={mode === 'sign-up' ? 'newPassword' : 'password'} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} autoCapitalize="none" autoCorrect={false} placeholder="At least 8 characters" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Password" returnKeyType={mode === 'sign-up' ? 'next' : 'done'} style={styles.input}/></>}
        {mode === 'sign-up' && <><FieldLabel text="CONFIRM PASSWORD" styles={styles}/><TextInput value={confirmation} onChangeText={(value) => { setConfirmation(value); setValidation(''); }} secureTextEntry textContentType="newPassword" autoComplete="new-password" autoCapitalize="none" autoCorrect={false} placeholder="Enter your password again" placeholderTextColor={styles.placeholder.color as string} accessibilityLabel="Confirm password" returnKeyType="done" style={styles.input}/></>}
        {validation ? <Text accessibilityRole="alert" style={styles.validation}>{validation}</Text> : null}
        {busy && <Loading styles={styles}/>}
        <Action label={mode === 'sign-in' ? 'Sign in' : mode === 'reset' ? 'Send reset link' : 'Create account'} onPress={() => submitEmail(mode)} disabled={busy} styles={styles}/>
        {mode === 'sign-in' && <Pressable accessibilityRole="button" onPress={() => setView('reset')} style={styles.textButton}><Text style={styles.linkText}>Forgot password?</Text></Pressable>}
        {mode !== 'reset' && <Pressable accessibilityRole="button" onPress={() => { setValidation(''); setView(mode === 'sign-in' ? 'sign-up' : 'sign-in'); }} style={styles.textButton}><Text style={styles.linkText}>{mode === 'sign-in' ? 'Create an account' : 'Already have an account? Sign in'}</Text></Pressable>}
      </View>
    </KeyboardAvoidingView>
    <Text style={styles.providerNote}>{isSupabaseConfigured ? 'Your password is sent securely to Supabase Auth.' : 'Account requests are not sent until Supabase is configured.'}</Text>
  </Frame>;
}

function Frame({ title, subtitle, onBack, styles, children }: { title: string; subtitle: string; onBack: () => void; styles: ReturnType<typeof makeStyles>; children: React.ReactNode }) {
  return <View style={styles.screen}><TopBar title="Benchless" onBack={onBack} styles={styles}/><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{subtitle}</Text>{children}</ScrollView></View>;
}
function TopBar({ title, onBack, styles }: { title: string; onBack: () => void; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.topTitle}>{title}</Text><View style={styles.spacer}/></View>; }
function Action({ label, onPress, styles, secondary = false, disabled = false }: { label: string; onPress: () => void; styles: ReturnType<typeof makeStyles>; secondary?: boolean; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.secondary, (pressed || disabled) && styles.pressed]}><Text style={[styles.actionText, secondary && styles.secondaryText]}>{label}</Text></Pressable>; }
function FieldLabel({ text, styles }: { text: string; styles: ReturnType<typeof makeStyles> }) { return <Text style={styles.field}>{text}</Text>; }
function Loading({ styles }: { styles: ReturnType<typeof makeStyles> }) { return <View accessibilityLiveRegion="polite" style={styles.loading}><ActivityIndicator color={styles.accent.color as string}/><Text style={styles.bodySmall}>Connecting securely…</Text></View>; }

function makeStyles(appearance: ColorScheme) {
  const c = benchlessColors[appearance];
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background }, topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: designTokens.spacing.lg },
    back: { width: designTokens.control.minimum, height: designTokens.control.minimum, borderRadius: designTokens.radius.control, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, backText: { color: c.text, fontSize: 28, lineHeight: 32 }, topTitle: { color: c.secondaryText, fontSize: designTokens.type.bodyCompact }, spacer: { width: designTokens.control.minimum },
    content: { flexGrow: 1, paddingHorizontal: designTokens.spacing.lg, paddingTop: designTokens.spacing.sm, paddingBottom: designTokens.spacing.xl, gap: designTokens.spacing.md }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: designTokens.spacing.md, padding: designTokens.spacing.xl },
    title: { color: c.text, fontSize: designTokens.type.title, lineHeight: designTokens.lineHeight.title, fontWeight: '700', letterSpacing: -0.5 }, body: { color: c.secondaryText, fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact }, bodySmall: { color: c.secondaryText, fontSize: designTokens.type.footnote, lineHeight: 20 },
    hero: { backgroundColor: c.surfaceSelected, borderWidth: 1, borderColor: c.border, borderRadius: designTokens.radius.card, padding: designTokens.spacing.lg, gap: designTokens.spacing.sm, marginTop: designTokens.spacing.sm }, heroEyebrow: { color: c.accentStrong, fontSize: designTokens.type.caption, fontWeight: '700', letterSpacing: 1 }, heroTitle: { color: c.text, fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.4 },
    action: { minHeight: 54, paddingHorizontal: designTokens.spacing.md, borderRadius: designTokens.radius.control, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', marginTop: designTokens.spacing.xs }, actionText: { color: c.onAccent, fontSize: designTokens.type.bodyCompact, fontWeight: '700' }, secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, secondaryText: { color: c.text }, pressed: { opacity: 0.72 }, textButton: { minHeight: designTokens.control.minimum, alignItems: 'center', justifyContent: 'center', paddingHorizontal: designTokens.spacing.sm }, linkText: { color: c.accentStrong, fontSize: designTokens.type.footnote, fontWeight: '600', textAlign: 'center' },
    providerNote: { color: c.tertiaryText, fontSize: designTokens.type.caption, lineHeight: 18, textAlign: 'center', paddingHorizontal: designTokens.spacing.lg, paddingBottom: designTokens.spacing.md }, form: { gap: designTokens.spacing.xs }, field: { color: c.secondaryText, fontSize: designTokens.type.caption, fontWeight: '700', letterSpacing: 1.1, marginTop: designTokens.spacing.xs }, input: { minHeight: 54, borderRadius: designTokens.radius.control, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, color: c.text, paddingHorizontal: designTokens.spacing.md, fontSize: designTokens.type.bodyCompact }, codeInput: { textAlign: 'center', fontSize: 24, fontWeight: '700', letterSpacing: 8 }, placeholder: { color: c.tertiaryText }, validation: { color: c.danger, fontSize: designTokens.type.footnote, lineHeight: 20 }, loading: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.sm }, accent: { color: c.accentStrong },
    notice: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: designTokens.radius.card, padding: designTokens.spacing.md, gap: designTokens.spacing.xs }, noticeTitle: { color: c.text, fontSize: designTokens.type.bodyCompact, fontWeight: '700' }, success: { alignItems: 'center', gap: designTokens.spacing.sm, padding: designTokens.spacing.lg, backgroundColor: c.surfaceSelected, borderRadius: designTokens.radius.card }, successMark: { color: c.accentStrong, fontSize: 36, fontWeight: '700' }, ageBadge: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: c.danger, alignItems: 'center', justifyContent: 'center' }, ageBadgeText: { color: c.danger, fontSize: 23, fontWeight: '700' },
  });
}
