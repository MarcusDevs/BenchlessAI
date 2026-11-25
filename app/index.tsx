import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, useColorScheme, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStateView } from '../src/components/system/AppStateView';
import DailyTrainingLoop from '../src/training/DailyTrainingLoop';
import { benchlessColors, designTokens, type ColorScheme } from '../src/design/tokens';
import { AppearancePicker, type AppearancePreference } from '../src/design/AppearancePicker';
import {
  bodyMapMarkers, equipmentOptions, experienceLevels, goals, lowerBackRedFlagQuestions,
  redFlagQuestions, sectionLabels, weekDays,
  type BodyArea, type InjuryStatus, type Side,
} from '../src/onboarding/content';
import { clearOnboarding, loadOnboarding, saveOnboarding } from '../src/onboarding/localOnboardingStore';
import { hasScheduledWorkoutReminders, syncWorkoutReminders } from '../src/onboarding/reminders';
import type { AccountIdentity, OnboardingProfile } from '../src/domain/models';
import { isAdultBirthYear } from '../src/features/auth/age';
import { useAuth } from '../src/features/auth/AuthProvider';
import { AccountAccessScreen } from '../src/features/auth/AccountAccessScreen';
import { identityFromSupabaseUser, supabaseAuthAdapter } from '../src/features/auth/supabaseAuthAdapter';
import { supabaseProfileService } from '../src/features/profile/supabaseProfileService';

type ThemeColors = {
  background: string; surface: string; surfaceRaised: string; surfaceSelected: string;
  lime: string; limeSoft: string; onLime: string; text: string; muted: string; dim: string; border: string;
  red: string; redSurface: string; progressTrack: string; heroGlow: string; heroOrbit: string;
  figureHead: string; figureHeadBorder: string; figureBody: string; figureArm: string; figureLeg: string;
  heroTag: string; heroDecor: string; selectedBorder: string; radioBorder: string; switchOff: string;
  faceActive: string; bodyPanel: string; bodyHead: string; bodyHeadBorder: string; bodyTorso: string;
  bodyTorsoBorder: string; bodyArms: string; bodyLegs: string; hotspotBorder: string; hotspotSurface: string;
  dangerBorder: string; dangerBody: string; checkBorder: string; profileBadge: string; badge: string;
  bodyCaption: string;
};

const palettes: Record<'dark' | 'light', ThemeColors> = {
  dark: {
    background: benchlessColors.dark.background, surface: benchlessColors.dark.surface, surfaceRaised: benchlessColors.dark.surfaceRaised, surfaceSelected: benchlessColors.dark.surfaceSelected,
    lime: benchlessColors.dark.accent, limeSoft: benchlessColors.dark.accent, onLime: benchlessColors.dark.onAccent, text: benchlessColors.dark.text, muted: benchlessColors.dark.secondaryText, dim: benchlessColors.dark.tertiaryText, border: benchlessColors.dark.border,
    red: benchlessColors.dark.danger, redSurface: benchlessColors.dark.dangerSurface, progressTrack: benchlessColors.dark.progressTrack, heroGlow: '#202D25', heroOrbit: '#3A4840',
    figureHead: '#BEC7B7', figureHeadBorder: '#869187', figureBody: '#78877D', figureArm: '#8C998E', figureLeg: '#65756B',
    heroTag: '#253229', heroDecor: '#415048', selectedBorder: '#819650', radioBorder: '#3A4748', switchOff: '#3C4845',
    faceActive: '#2A372E', bodyPanel: '#111714', bodyHead: '#55635F', bodyHeadBorder: '#718079', bodyTorso: '#52615B',
    bodyTorsoBorder: '#718077', bodyArms: '#596761', bodyLegs: '#4B5A54', hotspotBorder: '#A9B4A9', hotspotSurface: '#26352E',
    dangerBorder: '#654038', dangerBody: '#D4BEB7', checkBorder: '#59665B', profileBadge: '#26332A', badge: '#2C3829', bodyCaption: '#F4F6F1',
  },
  light: {
    background: benchlessColors.light.background, surface: benchlessColors.light.surface, surfaceRaised: benchlessColors.light.surfaceRaised, surfaceSelected: benchlessColors.light.surfaceSelected,
    lime: benchlessColors.light.accent, limeSoft: benchlessColors.light.accentStrong, onLime: benchlessColors.light.onAccent, text: benchlessColors.light.text, muted: benchlessColors.light.secondaryText, dim: benchlessColors.light.tertiaryText, border: benchlessColors.light.border,
    red: benchlessColors.light.danger, redSurface: benchlessColors.light.dangerSurface, progressTrack: benchlessColors.light.progressTrack, heroGlow: '#E6EBE1', heroOrbit: '#D4DBD1',
    figureHead: '#BEC7B7', figureHeadBorder: '#869187', figureBody: '#78877D', figureArm: '#8C998E', figureLeg: '#65756B',
    heroTag: '#EFF4E1', heroDecor: '#8B9788', selectedBorder: '#718543', radioBorder: '#D5DAD3', switchOff: '#D5DAD3',
    faceActive: '#E9EFD9', bodyPanel: '#F0F2ED', bodyHead: '#C7CEC7', bodyHeadBorder: '#ADB7AE', bodyTorso: '#C4CCC4',
    bodyTorsoBorder: '#AFB9B0', bodyArms: '#BDC7BD', bodyLegs: '#B5C0B6', hotspotBorder: '#7E897E', hotspotSurface: '#E3E9DF',
    dangerBorder: '#E6B9AF', dangerBody: '#75433B', checkBorder: '#A9B1A6', profileBadge: '#E7EEDB', badge: '#E7EEDB', bodyCaption: '#171C18',
  },
};

type Screen = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
type Equipment = OnboardingProfile['equipment'][number];
type Face = OnboardingProfile['face'];
type OnboardingData = OnboardingProfile;
const APPEARANCE_STORAGE_KEY = 'benchless.appearance.v1';

const initialData: OnboardingData = {
  goal: 'Build muscle', experience: 'Intermediate', equipment: ['Dumbbells at home'], cardio: false,
  days: [0, 1, 3, 4], injuryStatus: 'I’m managing an injury', area: 'Knee', side: 'Left', areas: [{ area: 'Knee', side: 'Left' }], face: 'front',
  pain: 2, onset: 'This week', cause: '', redFlags: Array(redFlagQuestions.length + lowerBackRedFlagQuestions.length).fill(false),
  birthYear: '', acknowledged: false, membership: 'Annual', trainingTime: '18:00',
  workoutReminders: true, sessionCheckIns: true,
};

function progressFor(screen: Screen) {
  if (screen === 0) return 0;
  if (screen <= 4) return screen;
  if (screen <= 8 || screen === 15) return 5;
  if (screen === 9) return 6;
  if (screen === 10) return 7;
  if (screen === 11) return 8;
  if (screen === 12) return 9;
  if (screen === 13) return 10;
  return 10;
}

function formatArea(area: BodyArea, side: Side) {
  if (['Head', 'Neck', 'Chest', 'Abdomen', 'Lower back'].includes(area)) return area;
  return `${side} ${area.toLowerCase()}`;
}

const supportedBodyAreas: BodyArea[] = ['Knee', 'Lower back', 'Shoulder', 'Ankle'];

function timeLabel(time: string) {
  return time;
}

function BrandMark({ styles }: { styles: AppStyles }) {
  return <View style={styles.brandMark}><View style={styles.markBar} /><View style={styles.markStem} /><View style={styles.markFoot} /></View>;
}

function OptionCard({ title, detail, selected, onPress, symbol, thumbnail, styles, compact = false }: {
  title: string; detail?: string; selected: boolean; onPress: () => void; symbol?: string; thumbnail?: number; compact?: boolean;
  styles: AppStyles;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}
      style={({ pressed }) => [styles.optionCard, compact && styles.optionCardCompact, selected && styles.optionSelected, pressed && styles.pressed]}>
      {thumbnail ? <Image source={thumbnail} style={styles.optionThumb} resizeMode="cover" /> : symbol ? <View style={[styles.optionSymbol, selected && styles.optionSymbolSelected]}><Text style={styles.optionSymbolText}>{symbol}</Text></View> : null}
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{title}</Text>
        {detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <Text style={styles.radioTick}>✓</Text> : null}</View>
    </Pressable>
  );
}

function ToggleRow({ title, detail, value, onPress, styles }: { title: string; detail: string; value: boolean; onPress: () => void; styles: AppStyles }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: value }} style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
      <View style={styles.optionCopy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionDetail}>{detail}</Text></View>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}><View style={[styles.switchKnob, value && styles.switchKnobOn]} /></View>
    </Pressable>
  );
}

function BodyIllustration({ face, areas, onToggle, styles }: { face: Face; areas: { area: BodyArea; side: Side }[]; onToggle: (area: BodyArea, side: Side) => void; styles: AppStyles }) {
  const spots = bodyMapMarkers.filter((spot) => spot.face === face);
  return (
    <View style={styles.bodyPanel}>
      <View style={[styles.bodyFigure, face === 'back' && styles.backFigure]}>
        {face === 'front'
          ? <Image source={require('../assets/onboarding/body-map-front-supported.jpg')} style={styles.bodyPhoto} resizeMode="cover" accessibilityLabel="Front view body map with supported areas" />
          : <Image source={require('../assets/onboarding/body-map-back-supported.jpg')} style={[styles.bodyPhoto, styles.backPhoto]} resizeMode="contain" accessibilityLabel="Back view body map with supported areas" />}
        {spots.map((spot, index) => {
          const selected = areas.some((item) => item.area === spot.area && item.side === spot.side);
          return (
            <Pressable key={`${spot.area}-${spot.side}-${index}`} onPress={() => onToggle(spot.area, spot.side)} hitSlop={17} accessibilityRole="button"
              accessibilityLabel={`Toggle ${spot.side} ${spot.area}`} accessibilityState={{ selected }} style={[styles.bodyHotspot, { left: `${spot.left}%`, top: `${spot.top}%` }]}>
              {selected ? <View style={styles.markerSelected} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.figureCaption}>{face === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}</Text>
    </View>
  );
}

function HeroArtwork({ styles }: { styles: AppStyles }) {
  return <Image source={require('../assets/onboarding/welcome-gym.jpg')} style={styles.heroArtwork} resizeMode="cover" accessibilityLabel="Athlete taking a quiet moment in the gym" />;
}

export default function OnboardingScreen() {
  const { status: authStatus, session, profile: serverProfile, profileError, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>(0);
  const [showTraining, setShowTraining] = useState(false);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [account, setAccount] = useState<AccountIdentity | null>(null);
  const [savingAccountSetup, setSavingAccountSetup] = useState(false);
  const [accountSetupError, setAccountSetupError] = useState('');
  const [remindersActive, setRemindersActive] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState('');
  const systemScheme = useColorScheme();
  const [appearancePreference, setAppearancePreference] = useState<AppearancePreference>('system');
  const appearanceChanged = useRef(false);
  const themeMode: ColorScheme = appearancePreference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : appearancePreference;
  const colors = palettes[themeMode];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fade = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.Value(0)).current;
  const progress = progressFor(screen);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(APPEARANCE_STORAGE_KEY).then((saved) => {
      if (active && !appearanceChanged.current && (saved === 'system' || saved === 'light' || saved === 'dark')) setAppearancePreference(saved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function changeAppearance(value: AppearancePreference) {
    appearanceChanged.current = true;
    setAppearancePreference(value);
    void AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, value).catch(() => undefined);
  }

  useEffect(() => {
    let active = true;
    loadOnboarding<OnboardingData>().then((saved) => {
      if (!active) return;
      if (saved) {
        setData({ ...initialData, ...saved.answers });
        setCompletedAt(null);
      }
      if (authStatus === 'signedIn' && session) {
        const identity = identityFromSupabaseUser(session.user);
        setAccount(identity);
        if (profileError) {
          setShowTraining(false);
        } else if (serverProfile?.completedAt && serverProfile.onboarding) {
          setData({ ...initialData, ...serverProfile.onboarding });
          setCompletedAt(serverProfile.completedAt);
          setShowTraining(true);
        } else if (serverProfile?.onboarding) {
          setData({ ...initialData, ...serverProfile.onboarding });
          setCompletedAt(null);
          setShowTraining(false);
          go(10);
        } else if (saved && saved.currentStep > 0) {
          setCompletedAt(null);
          setShowTraining(false);
          go(saved.currentStep === 14 ? 12 : Math.min(saved.currentStep, 14) as Screen);
        } else {
          setCompletedAt(null);
          setShowTraining(false);
          go(0);
        }
      } else {
        setAccount(null);
        setShowTraining(false);
        setCompletedAt(null);
        if (saved && saved.currentStep > 0) go(Math.min(saved.currentStep, 14) as Screen);
        else go(0);
      }
    }).catch(() => undefined).finally(() => { if (active) setIsHydrated(true); });
    hasScheduledWorkoutReminders().then((isActive) => { if (active) setRemindersActive(isActive); }).catch(() => undefined);
    return () => { active = false; };
  }, [authStatus, session, serverProfile, profileError]);

  useEffect(() => {
    if (isHydrated) void saveOnboarding(data, completedAt, screen).catch(() => undefined);
  }, [data, completedAt, screen, isHydrated]);
  // A year-only picker cannot confirm a birthday, so use a conservative Jan 1 cutoff.
  const isAdult = isAdultBirthYear(data.birthYear);
  const questions = useMemo(() => [...redFlagQuestions, ...(data.area === 'Lower back' ? lowerBackRedFlagQuestions : [])], [data.area]);
  const hasRedFlag = data.redFlags.slice(0, questions.length).some(Boolean);
  const activeDays = weekDays.filter((_, index) => data.days.includes(index));
  const isInjury = data.injuryStatus !== 'No current injury';

  useEffect(() => {
    fade.setValue(0);
    translate.setValue(12);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(translate, { toValue: 0, speed: 20, bounciness: 3, useNativeDriver: true }),
    ]).start();
  }, [screen, fade, translate]);

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setDraftSaveError('');
    setData((previous) => ({ ...previous, [key]: value }));
  }
  function go(next: Screen) { setScreen(next); }
  function toggleDay(index: number) {
    const days = data.days.includes(index) ? data.days.filter((day) => day !== index) : [...data.days, index].sort((a, b) => a - b);
    update('days', days);
  }
  function toggleEquipment(item: Equipment) {
    const equipment = data.equipment.includes(item) ? data.equipment.filter((entry) => entry !== item) : [...data.equipment, item];
    update('equipment', equipment);
  }
  function toggleFlag(index: number) {
    const redFlags = [...data.redFlags];
    redFlags[index] = !redFlags[index];
    update('redFlags', redFlags);
  }
  async function signOut() {
    const result = await supabaseAuthAdapter.signOut();
    if (result.ok && result.source === 'remote') {
      await clearOnboarding().catch(() => undefined);
      setData(initialData);
      setCompletedAt(null);
      setAccount(null);
      setShowTraining(false);
      setScreen(0);
    }
    else if (!result.ok) Alert.alert('Couldn’t sign out', result.error.message);
  }
  function toggleBodyArea(area: BodyArea, side: Side) {
    if (!supportedBodyAreas.includes(area)) return;
    const exists = data.areas.some((item) => item.area === area && item.side === side);
    const areas = exists ? data.areas.filter((item) => item.area !== area || item.side !== side) : [...data.areas, { area, side }];
    update('areas', areas);
    const supported = areas.find((item) => supportedBodyAreas.includes(item.area));
    if (supported) {
      update('area', supported.area);
      update('side', supported.side);
    }
  }
  function changeAreaSide(area: BodyArea, currentSide: Side, nextSide: Side) {
    if (currentSide === nextSide) return;
    const areas = data.areas.map((item) => item.area === area && item.side === currentSide ? { ...item, side: nextSide } : item);
    update('areas', areas);
    update('area', area);
    update('side', nextSide);
  }
  async function next() {
    switch (screen) {
      case 0: go(1); break;
      case 1: go(2); break;
      case 2: go(3); break;
      case 3: go(4); break;
      case 4: if (!data.days.length) return; go(5); break;
      case 5: go(isInjury ? 6 : 9); break;
      case 6:
        if (!data.areas.length || !data.areas.every((item) => supportedBodyAreas.includes(item.area))) {
          Alert.alert('Choose a supported area', 'Select at least one of the four supported areas: shoulder, lower back, knee or ankle.');
          return;
        }
        go(7); break;
      case 7: go(8); break;
      case 8: if (hasRedFlag) go(15); else go(9); break;
      case 9:
        if (isAdult && data.acknowledged) {
          try {
            // Make the local draft durable before the person leaves onboarding for sign-in.
            await saveOnboarding(data, completedAt, 10);
            setDraftSaveError('');
            go(10);
          } catch {
            setDraftSaveError('We couldn’t save your setup on this device yet. Try again before continuing to your account.');
          }
        }
        break;
      case 10:
        if (!account) {
          setShowTraining(true);
          return;
        }
        if (savingAccountSetup) return;
        setSavingAccountSetup(true);
        setAccountSetupError('');
        try {
          const saved = await persistProfile(account, data);
          if (!saved.ok) {
            setAccountSetupError(`${saved.error.message} Your answers are still saved on this device.`);
            return;
          }
          if (saved.source !== 'remote') {
            setAccountSetupError('Account sync is not connected in this preview. Your answers are still saved on this device.');
            return;
          }
          go(11);
        } catch {
          setAccountSetupError('The app could not complete the Supabase save. Try again. Your answers are still saved on this device.');
        } finally {
          setSavingAccountSetup(false);
        }
        break;
      case 11: go(12); break;
      case 12: go(13); break;
      case 13: go(14); break;
      case 14:
        setData(initialData);
        setCompletedAt(null);
        setShowTraining(false);
        go(0);
        break;
      case 15: go(5); break;
    }
  }
  function previous() {
    if (screen === 15) { go(8); return; }
    const previousScreen: Partial<Record<Screen, Screen>> = {
      1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: isInjury ? 8 : 5,
      10: 9, 11: 10, 12: 11, 13: 12,
    };
    if (previousScreen[screen] !== undefined) go(previousScreen[screen]!);
  }
  function adjustTrainingTime(delta: number) {
    const [hour, minute] = data.trainingTime.split(':').map(Number);
    update('trainingTime', `${String((hour + delta + 24) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }

  async function persistProfile(identity: AccountIdentity, answers: OnboardingData) {
    return supabaseProfileService.save(identity.userId, answers, completedAt);
  }
  async function continueFromAccount(identity: AccountIdentity) {
    const existingProfile = await supabaseProfileService.get(identity.userId);
    if (!existingProfile.ok || existingProfile.source !== 'remote') {
      Alert.alert('Could not load your setup', 'Your account is confirmed, but we could not check its saved profile. Your local onboarding draft is safe; check your connection and try again.');
      return;
    }
    if (existingProfile.value) {
      setData({ ...initialData, ...existingProfile.value.onboarding });
      setCompletedAt(existingProfile.value.completedAt);
      setAccount(identity);
      if (existingProfile.value.completedAt) setShowTraining(true);
      else go(11);
      return;
    }
    const saved = await persistProfile(identity, data);
    if (!saved.ok || saved.source !== 'remote') {
      const details = saved.ok ? 'Account sync is not connected in this preview.' : saved.error.message;
      Alert.alert('Setup not synced yet', `${details} Your onboarding remains saved on this device.`);
      return;
    }
    setAccount(identity);
    go(11);
  }
  async function openToday() {
    const completed = completedAt ?? new Date().toISOString();
    if (account) {
      const result = await supabaseProfileService.save(account.userId, data, completed);
      if (!result.ok || result.source !== 'remote') {
        Alert.alert('Setup not synced yet', 'Your latest choices remain saved on this device. Check your connection and try again before opening training.');
        return;
      }
    }
    setCompletedAt(completed);
    setShowTraining(true);
  }
  function editSetup() {
    setShowTraining(false);
    go(1);
  }
  async function toggleWorkoutReminders() {
    const enabled = !data.workoutReminders;
    update('workoutReminders', enabled);
    try {
      const active = await syncWorkoutReminders(enabled, data.days, data.trainingTime);
      setRemindersActive(active);
      if (enabled && !active) {
        update('workoutReminders', false);
        Alert.alert('Reminders are off', 'Allow Benchless AI notifications in your device settings to turn on workout reminders.');
      }
    } catch {
      setRemindersActive(false);
      if (enabled) update('workoutReminders', false);
      Alert.alert('Could not update reminders', 'Please try again from your device settings.');
    }
  }
  async function saveReminderPreferences() {
    if (!data.workoutReminders) { setRemindersActive(false); go(14); return; }
    try {
      const active = await syncWorkoutReminders(true, data.days, data.trainingTime);
      setRemindersActive(active);
      if (!active) {
        update('workoutReminders', false);
        Alert.alert('Reminders are off', 'Allow Benchless AI notifications in your device settings to turn on workout reminders.');
      }
      go(14);
    } catch {
      setRemindersActive(false);
      update('workoutReminders', false);
      Alert.alert('Could not update reminders', 'Your training plan is saved. You can change notification permission in your device settings.');
      go(14);
    }
  }

  const headlines: Partial<Record<Screen, { eyebrow: string; title: string; body: string }>> = {
    1: { eyebrow: '01 / YOUR TRAINING', title: 'What are you working towards?', body: 'Choose your main goal. We’ll shape your plan around it.' },
    2: { eyebrow: '02 / YOUR TRAINING', title: 'Start where you are.', body: 'Your experience helps us set a sensible starting point.' },
    3: { eyebrow: '03 / YOUR TRAINING', title: 'What’s available to you?', body: 'We’ll suggest movements you have the equipment for.' },
    4: { eyebrow: '04 / YOUR TRAINING', title: 'Make room for progress.', body: 'Pick the days that realistically fit your week.' },
    5: { eyebrow: '05 / YOUR BODY', title: 'How’s your body feeling?', body: 'We’ll use this to adapt your training, not to diagnose an injury.' },
    6: { eyebrow: '05 / YOUR BODY', title: 'Where do you need support?', body: 'Tap the area that needs support. You can change it at any time.' },
    7: { eyebrow: '05 / YOUR BODY', title: 'How does it feel?', body: 'A little context helps shape a careful starting point.' },
    8: { eyebrow: '05 / YOUR BODY', title: 'A quick safety check.', body: 'Tell us if any of these are happening right now.' },
    9: { eyebrow: '06 / YOUR BODY', title: 'A little context. A safer start.', body: 'Benchless AI is designed for adults aged 18 and over.' },
    10: { eyebrow: '07 / YOUR ACCOUNT', title: 'Keep your setup with you.', body: 'Create an account or sign in to save your plan and preferences.' },
    11: { eyebrow: '08 / YOUR PLAN', title: 'Your first week, rethought.', body: `${activeDays.length} sessions shaped around the days you chose.` },
    12: { eyebrow: '09 / 14-DAY TRIAL', title: 'Try Benchless for 14 days.', body: 'No payment details are needed for this offer preview.' },
    13: { eyebrow: '10 / READY TO GO', title: 'A nudge, when you want it.', body: 'Choose a time that works for you. You can change this later.' },
    14: { eyebrow: 'SETUP COMPLETE', title: 'You’re ready to move.', body: 'Your account and preferences are saved. Your training area is ready.' },
  };
  const page = headlines[screen];

  function FooterButton({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
    return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, secondary && styles.secondaryButton, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}>
      <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{label}</Text>
      {!secondary && screen !== 0 && screen !== 15 ? <Text style={styles.primaryArrow}>→</Text> : null}
    </Pressable>;
  }

  if (!isHydrated) {
    return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} /><View style={styles.loadingState}><BrandMark styles={styles}/><Text style={styles.brandText}>BENCHLESS</Text></View></SafeAreaView>;
  }

  if (authStatus === 'signedIn' && profileError) {
    return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppStateView
        kind="offline"
        title="Your saved setup isn’t available yet"
        message={profileError}
        appearance={themeMode}
        actionLabel="Try again"
        onAction={() => { void refreshProfile(); }}
        secondaryActionLabel="Sign out"
        onSecondaryAction={() => { void signOut(); }}
      />
    </SafeAreaView>;
  }

  if (showTraining) {
    if (!account) return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} /><AccountAccessScreen appearance={themeMode} birthYear={data.birthYear} onBack={() => { setShowTraining(false); go(0); }} onAuthenticated={async (identity) => {
      const remoteProfile = await supabaseProfileService.get(identity.userId);
      if (!remoteProfile.ok || remoteProfile.source !== 'remote') {
        Alert.alert('Could not load your setup', 'Your account is signed in, but we could not load its saved profile. Check your connection and try again.');
        return;
      }
      if (remoteProfile.value) {
        setData({ ...initialData, ...remoteProfile.value.onboarding });
        setCompletedAt(remoteProfile.value.completedAt);
        if (remoteProfile.value.completedAt) setAccount(identity);
        else { setAccount(identity); setShowTraining(false); go(10); }
      } else {
        setAccount(identity);
        setShowTraining(false);
        go(0);
      }
    }}/></SafeAreaView>;
    return <DailyTrainingLoop
      darkMode={themeMode === 'dark'}
      appearancePreference={appearancePreference}
      onAppearanceChange={changeAppearance}
      hasInjury={isInjury}
      selectedArea={formatArea(data.area, data.side)}
      onboarding={{ ...data, completedAt }}
      fullName={account.fullName ?? ''}
      remindersActive={remindersActive}
      onEditSetup={editSetup}
      onSignOut={() => { void signOut(); }}
      onToggleWorkoutReminders={() => { void toggleWorkoutReminders(); }}
      onToggleSessionCheckIns={() => update('sessionCheckIns', !data.sessionCheckIns)}
    />;
  }

  if (screen === 10 && !account) {
    return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <AccountAccessScreen appearance={themeMode} birthYear={data.birthYear} onBack={() => go(9)} onAuthenticated={(identity) => { void continueFromAccount(identity); }} />
    </SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          {screen > 0 && screen !== 14 ? <Pressable onPress={previous} accessibilityRole="button" style={styles.backButton}><Text style={styles.backText}>‹  Back</Text></Pressable> : <View style={styles.topPlaceholder} />}
        </View>
        <Animated.View style={[styles.animated, { opacity: fade, transform: [{ translateY: translate }] }]}>
          {screen !== 14 && screen !== 15 ? <View style={styles.progressHeader}>
            <View style={styles.brandLine}><BrandMark styles={styles} /><Text style={styles.brandText}>BENCHLESS</Text></View>
            <Text style={styles.progressLabel}>{progress ? `${String(progress).padStart(2, '0')} / ${sectionLabels[progress]}` : 'WELCOME'}</Text>
            <View accessibilityRole="progressbar" accessibilityLabel="Onboarding progress" accessibilityValue={{ min: 0, max: 10, now: progress }} style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress === 0 ? 9 : progress * 10}%` }]} /></View>
          </View> : null}
          <ScrollView key={screen} style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {screen === 0 ? <>
              <Text style={styles.welcomeTitle}>Keep moving.{ '\n' }On your terms.</Text>
              <Text style={styles.welcomeBody}>Adaptive strength training that works around your injury. And with your life.</Text>
              <AppearancePicker value={appearancePreference} scheme={themeMode} onChange={changeAppearance} />
              <HeroArtwork styles={styles} />
              <View style={styles.welcomePill}><View style={styles.liveDot} /><Text style={styles.welcomePillText}>TRAIN AROUND IT. KEEP MOVING.</Text></View>
              <Text style={styles.welcomeNote}>Built for gym-goers, home exercisers, runners and athletes.</Text>
            </> : null}

            {page ? <>
              <Text style={styles.eyebrow}>{page.eyebrow}</Text>
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.body}>{page.body}</Text>
            </> : null}

            {screen === 1 ? <View style={styles.options}>{goals.map((item) => <OptionCard key={item.title} title={item.title} detail={item.detail} symbol={item.symbol} selected={data.goal === item.title} onPress={() => update('goal', item.title)} styles={styles} />)}</View> : null}

            {screen === 2 ? <>
              <View style={styles.options}>{experienceLevels.map((item) => <OptionCard key={item.title} title={item.title} detail={item.detail} selected={data.experience === item.title} onPress={() => update('experience', item.title)} styles={styles} />)}</View>
              <View style={styles.tipCard}><Text style={styles.tipTitle}>Not sure? Start a little lighter.</Text><Text style={styles.optionDetail}>Your plan adjusts as you log your sessions.</Text></View>
            </> : null}

            {screen === 3 ? <>
              <View style={styles.options}>{equipmentOptions.map((item, index) => <OptionCard key={item.title} title={item.title} detail={item.detail} symbol={item.symbol} thumbnail={index === 0 ? require('../assets/WhatsApp Image 2026-11-06 at 19.13.26 (1).jpeg') : index === 1 ? require('../assets/WhatsApp Image 2026-11-06 at 19.13.25.jpeg') : undefined} selected={data.equipment.includes(item.title as Equipment)} onPress={() => toggleEquipment(item.title as Equipment)} styles={styles} />)}</View>
              <ToggleRow title="Cardio equipment" detail="I have a bike or cardio machine." value={data.cardio} onPress={() => update('cardio', !data.cardio)} styles={styles} />
            </> : null}

            {screen === 4 ? <>
              <View style={styles.dayRow}>{weekDays.map((day, index) => <Pressable key={index} onPress={() => toggleDay(index)} accessibilityRole="checkbox" accessibilityLabel={day.name} accessibilityState={{ checked: data.days.includes(index) }} style={[styles.dayChip, data.days.includes(index) && styles.dayChipSelected]}><Text style={[styles.dayLetter, data.days.includes(index) && styles.dayLetterSelected]}>{day.short}</Text></Pressable>)}</View>
              <View style={styles.daysBadge}><Text style={styles.daysBadgeText}>{data.days.length} {data.days.length === 1 ? 'DAY' : 'DAYS'} / WEEK</Text></View>
              {activeDays.length ? <View style={styles.sessionList}>{activeDays.map((day, index) => <View key={day.name} style={styles.sessionRow}><Text style={styles.sessionDay}>{day.name.slice(0, 3)}</Text><Text style={styles.sessionName}>{index % 2 === 0 ? 'Upper body' : 'Lower body'}</Text><Text style={styles.sessionTime}>{index % 2 === 0 ? '45' : '40'} min</Text></View>)}</View> : <Text style={styles.validationText}>Choose at least one training day to continue.</Text>}
              <Text style={styles.smallNote}>Recovery days are built in. You can move a session whenever life happens.</Text>
            </> : null}

            {screen === 5 ? <>
              <View style={styles.options}>{(['No current injury', 'I’m managing an injury', 'I’m returning from injury'] as InjuryStatus[]).map((item, index) => <OptionCard key={item} title={item} detail={['Build my standard training plan.', 'Choose an area on the next screen.', 'Ease back into training gradually.'][index]} selected={data.injuryStatus === item} onPress={() => update('injuryStatus', item)} styles={styles} />)}</View>
              <Text style={styles.safetyCopy}>If you have new, severe or worsening pain, seek advice from a qualified clinician before training.</Text>
            </> : null}

            {screen === 6 ? <>
              <View style={styles.faceSwitch}>
                {(['front', 'back'] as Face[]).map((face) => <Pressable key={face} onPress={() => update('face', face)} style={[styles.faceButton, data.face === face && styles.faceButtonActive]}><Text style={[styles.faceButtonText, data.face === face && styles.faceButtonTextActive]}>{face === 'front' ? 'Front view' : 'Back view'}</Text></Pressable>)}
              </View>
              <BodyIllustration face={data.face} areas={data.areas} onToggle={toggleBodyArea} styles={styles} />
              <View style={styles.areaList}>{data.areas.map((item) => <View key={`${item.area}-${item.side}`} style={styles.selectedArea}>
                <View style={styles.optionCopy}><Text style={styles.optionTitle}>{item.area}</Text><Text style={styles.optionDetail}>Selected: {formatArea(item.area, item.side)}</Text></View>
                <View style={styles.sideActions}>{(['Left', 'Right'] as Side[]).map((side) => <Pressable key={side} accessibilityRole="button" accessibilityLabel={`${side} ${item.area}`} accessibilityState={{ selected: item.side === side }} onPress={() => changeAreaSide(item.area, item.side, side)} style={[styles.sideButton, item.side === side && styles.sideButtonSelected]}><Text style={[styles.sideButtonText, item.side === side && styles.sideButtonTextSelected]}>{side === 'Left' ? 'L' : 'R'}</Text></Pressable>)}
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${formatArea(item.area, item.side)}`} onPress={() => toggleBodyArea(item.area, item.side)} style={styles.removeButton}><Text style={styles.removeArea}>×</Text></Pressable>
                </View>
              </View>)}</View>
              <Text style={styles.smallNote}>Select each area you want us to consider, then choose Left or Right. This is training context, not a diagnosis.</Text>
            </> : null}

            {screen === 7 ? <>
              <View style={styles.painCard}>
                <Text style={styles.fieldLabel}>PAIN RIGHT NOW</Text>
                <View style={styles.painScale}>{[0, 1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => update('pain', value)} accessibilityRole="radio" accessibilityLabel={`Pain ${value} of 5`} accessibilityState={{ selected: data.pain === value }} style={[styles.painNumber, data.pain === value && styles.painNumberSelected]}><Text style={[styles.painNumberText, data.pain === value && styles.painNumberTextSelected]}>{value}</Text></Pressable>)}</View>
                <View style={styles.scaleEnds}><Text style={styles.scaleText}>No pain</Text><Text style={styles.scaleText}>A lot of pain</Text></View>
                <Text style={styles.fieldLabel}>WHEN DID IT START?</Text>
                <View style={styles.onsetRow}>{['Today', 'This week', 'Longer ago'].map((item) => <Pressable key={item} onPress={() => update('onset', item)} style={[styles.onsetChip, data.onset === item && styles.onsetChipSelected]}><Text style={[styles.onsetText, data.onset === item && styles.onsetTextSelected]}>{item}</Text></Pressable>)}</View>
                <Text style={[styles.fieldLabel, styles.causeLabel]}>ANYTHING ELSE? (OPTIONAL)</Text>
                <TextInput value={data.cause} onChangeText={(value) => update('cause', value)} placeholder="A short note about what happened" placeholderTextColor={colors.dim} style={styles.textInput} maxLength={120} returnKeyType="done" />
              </View>
              <Text style={styles.smallNote}>Your answers help us understand your training context. They aren’t used to diagnose a condition.</Text>
            </> : null}

            {screen === 8 ? <>
              <View style={styles.options}>{questions.map((question, index) => <Pressable key={question} onPress={() => toggleFlag(index)} accessibilityRole="checkbox" accessibilityState={{ checked: data.redFlags[index] }} style={({ pressed }) => [styles.flagCard, pressed && styles.pressed]}><View style={[styles.checkbox, data.redFlags[index] && styles.checkboxOn]}>{data.redFlags[index] ? <Text style={styles.checkboxTick}>✓</Text> : null}</View><Text style={styles.flagText}>{question}</Text></Pressable>)}</View>
              <View style={styles.calmCard}><Text style={styles.calmTitle}>{hasRedFlag ? 'A yes answer pauses setup.' : 'A careful next step.'}</Text><Text style={styles.optionDetail}>If you answer yes to any item, we’ll pause setup and suggest getting checked before training.</Text></View>
            </> : null}

            {screen === 9 ? <>
              <View style={styles.birthCard}><Text style={styles.fieldLabel}>YEAR OF BIRTH</Text><View style={styles.yearControl}><Pressable disabled={data.birthYear.length !== 4} onPress={() => update('birthYear', String(Math.max(1900, Number(data.birthYear) - 1)))} accessibilityLabel="Earlier year" style={[styles.yearArrow, data.birthYear.length !== 4 && styles.buttonDisabled]}><Text style={styles.yearArrowText}>−</Text></Pressable><TextInput value={data.birthYear} onChangeText={(value) => update('birthYear', value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" maxLength={4} accessibilityLabel="Year of birth" style={styles.yearInput} /><Pressable disabled={data.birthYear.length !== 4} onPress={() => update('birthYear', String(Math.min(new Date().getFullYear(), Number(data.birthYear) + 1)))} accessibilityLabel="Later year" style={[styles.yearArrow, data.birthYear.length !== 4 && styles.buttonDisabled]}><Text style={styles.yearArrowText}>+</Text></Pressable></View><Text style={styles.smallNote}>Used only to confirm you’re 18 or older.</Text></View>
              <Pressable onPress={() => update('acknowledged', !data.acknowledged)} accessibilityRole="checkbox" accessibilityState={{ checked: data.acknowledged }} style={[styles.disclaimerCard, data.acknowledged && styles.disclaimerSelected]}><View style={[styles.checkMark, data.acknowledged && styles.checkMarkOn]}><Text style={[styles.checkMarkText, data.acknowledged && styles.checkMarkTextOn]}>{data.acknowledged ? '✓' : ''}</Text></View><View style={styles.optionCopy}><Text style={styles.optionTitle}>Coaching, not medical advice.</Text><Text style={styles.optionDetail}>Benchless AI doesn’t diagnose or treat injuries. I’ll follow my clinician’s advice.</Text></View></Pressable>
              {!isAdult && data.birthYear.length === 4 ? <Text style={styles.validationText}>Benchless AI is for adults 18 and over. You can’t continue to an account or training with this year of birth.</Text> : null}
              {isAdult && !data.acknowledged ? <Text style={styles.smallNote}>Please acknowledge the coaching disclaimer to continue.</Text> : null}
              {draftSaveError ? <Text accessibilityRole="alert" style={styles.validationText}>{draftSaveError}</Text> : null}
            </> : null}

            {screen === 10 ? <>
              <View style={styles.accountCard}><View style={styles.accountBadge}><Text style={styles.accountBadgeText}>ACCOUNT CONNECTED</Text></View><Text style={styles.calmTitle}>{account?.fullName ? `Your account is ready, ${account.fullName.split(/\s+/)[0]}.` : 'Your account is connected.'}</Text>{[['▦', 'Your plan and preferences'], ['⌁', 'Your training history'], ['✓', 'Your injury preferences']].map(([symbol, label]) => <View key={label} style={styles.accountFeature}><Text style={styles.accountFeatureSymbol}>{symbol}</Text><Text style={styles.accountFeatureText}>{label}</Text></View>)}</View>
              <View style={styles.calmCard}><Text style={styles.calmTitle}>Save your setup.</Text><Text style={styles.optionDetail}>Continue to sync your plan and preferences to your account. Next, choose your reminder preferences.</Text></View>
              {accountSetupError ? <Text accessibilityRole="alert" style={styles.validationText}>{accountSetupError}</Text> : null}
            </> : null}

            {screen === 11 ? <>
              <View style={styles.planNotice}><Text style={styles.planNoticeTitle}>Your starting week</Text><Text style={styles.optionDetail}>Built around your {data.days.length}-day schedule · {data.goal.toLowerCase()} · {data.experience.toLowerCase()}</Text></View>
              <View style={styles.sessionList}>{activeDays.map((day, index) => <View key={day.name} style={styles.planSession}><Text style={styles.planSessionDay}>{day.name.slice(0, 3).toUpperCase()}</Text><View style={styles.optionCopy}><Text style={styles.optionTitle}>{index % 2 === 0 ? 'Upper body' : 'Lower body'}</Text><Text style={styles.optionDetail}>{isInjury && index % 2 === 1 ? `Check-in: ${formatArea(data.area, data.side)}` : `${index % 2 === 0 ? '6 exercises · 45' : '5 exercises · 40'} min`}</Text></View>{isInjury && index % 2 === 1 ? <View style={styles.adaptedBadge}><Text style={styles.adaptedText}>REVIEW</Text></View> : null}</View>)}</View>
              <View style={styles.calmCard}><Text style={styles.calmTitle}>{isInjury ? 'Built around your check-in.' : 'A steady place to start.'}</Text><Text style={styles.optionDetail}>{isInjury ? `Your ${formatArea(data.area, data.side).toLowerCase()} check-in will stay with your plan.` : 'Your starting plan can adapt as you log sessions and check-ins.'}</Text></View>
            </> : null}

            {screen === 12 ? <>
              <View style={styles.membershipOption}><View style={styles.optionCopy}><Text style={styles.optionTitle}>14 days · No card required</Text><Text style={styles.optionDetail}>The trial offer is shown here. This build does not start a trial or collect payment details.</Text></View><View style={[styles.adaptedBadge]}><Text style={styles.adaptedText}>PREVIEW</Text></View></View>
              <Pressable onPress={() => update('membership', 'Annual')} style={[styles.membershipOption, data.membership === 'Annual' && styles.membershipSelected]}><View style={styles.optionCopy}><Text style={styles.optionTitle}>After the trial · Annual</Text><Text style={styles.optionDetail}>Price and billing will be confirmed when subscriptions are connected.</Text></View><View style={[styles.radio, data.membership === 'Annual' && styles.radioSelected]}>{data.membership === 'Annual' ? <Text style={styles.radioTick}>✓</Text> : null}</View></Pressable>
              <Pressable onPress={() => update('membership', 'Monthly')} style={[styles.membershipOption, data.membership === 'Monthly' && styles.membershipSelected]}><View style={styles.optionCopy}><Text style={styles.optionTitle}>After the trial · Monthly</Text><Text style={styles.optionDetail}>Choose monthly billing when subscriptions become available.</Text></View><View style={[styles.radio, data.membership === 'Monthly' && styles.radioSelected]}>{data.membership === 'Monthly' ? <Text style={styles.radioTick}>✓</Text> : null}</View></Pressable>
              <View style={styles.timeline}>{[['01', 'Review your plan', 'See how onboarding shapes your first week.'], ['02', 'Create or sign in', 'Keep your setup attached to your account.'], ['03', 'Trial activation', 'A live trial starts only when account and billing services support it.']].map(([number, title, detail]) => <View key={number} style={styles.timelineRow}><Text style={styles.timelineNumber}>{number}</Text><View style={styles.optionCopy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionDetail}>{detail}</Text></View></View>)}</View>
            </> : null}

            {screen === 13 ? <>
              <View style={styles.timeCard}><Text style={styles.fieldLabel}>TRAINING TIME</Text><View style={styles.timeValueRow}><Pressable onPress={() => adjustTrainingTime(-1)} accessibilityLabel="Earlier training time" style={styles.yearArrow}><Text style={styles.yearArrowText}>−</Text></Pressable><Text style={styles.timeValue}>{timeLabel(data.trainingTime)}</Text><Pressable onPress={() => adjustTrainingTime(1)} accessibilityLabel="Later training time" style={styles.yearArrow}><Text style={styles.yearArrowText}>+</Text></Pressable></View><Text style={styles.optionDetail}>On {activeDays.map((day) => day.name.slice(0, 3)).join(', ') || 'your training days'}</Text></View>
              <ToggleRow title="Workout reminders" detail="A nudge on your training days." value={data.workoutReminders} onPress={() => update('workoutReminders', !data.workoutReminders)} styles={styles} />
              <ToggleRow title="Session check-ins" detail="Tell us how your body felt." value={data.sessionCheckIns} onPress={() => update('sessionCheckIns', !data.sessionCheckIns)} styles={styles} />
              <View style={styles.notificationPreview}><Text style={styles.fieldLabel}>BENCHLESS AI · {timeLabel(data.trainingTime)}</Text><Text style={styles.calmTitle}>A little time for you.</Text><Text style={styles.optionDetail}>Your next session is ready when you are.</Text></View>
            </> : null}

            {screen === 14 ? <>
              <View style={styles.successMark}><Text style={styles.successCheck}>✓</Text></View>
              <Text style={styles.eyebrow}>YOUR FIRST STEP IS SET</Text>
              <Text style={styles.title}>You’re ready to move.</Text>
              <Text style={styles.body}>Your starting preferences are saved with your account.</Text>
              <View style={styles.summaryCard}><Text style={styles.fieldLabel}>YOUR STARTING POINT</Text><Text style={styles.summaryLine}>{data.goal} · {data.experience}</Text><Text style={styles.summaryLine}>{data.equipment.join(', ') || 'No equipment selected'}</Text><Text style={styles.summaryLine}>{data.days.length} training {data.days.length === 1 ? 'day' : 'days'} per week</Text>{isInjury ? <Text style={styles.summaryLine}>Check-in: {formatArea(data.area, data.side)} · pain {data.pain}/5</Text> : <Text style={styles.summaryLine}>No current injury selected</Text>}</View>
              <View style={styles.calmCard}><Text style={styles.calmTitle}>Coaching, not medical advice.</Text><Text style={styles.optionDetail}>Benchless AI does not diagnose or treat injuries. Follow guidance from your clinician.</Text></View>
            </> : null}

            {screen === 15 ? <>
              <View style={styles.stopCard}><View style={styles.stopIcon}><Text style={styles.stopIconText}>!</Text></View><Text style={styles.stopTitle}>Please get checked before training.</Text><Text style={styles.stopBody}>You selected a safety concern. Please contact a qualified clinician before exercising. If you feel in immediate danger, seek urgent local care.</Text><View style={styles.selectedFlags}>{questions.filter((_, index) => data.redFlags[index]).map((question) => <Text key={question} style={styles.stopFoot}>• {question}</Text>)}</View></View>
            </> : null}
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          {screen === 0 ? <><FooterButton label="Get started" onPress={next} /><FooterButton label="I already have an account" secondary onPress={() => setShowTraining(true)} /><Text style={styles.footerNote}>About 2 minutes to build your starting plan.</Text></> : null}
          {screen > 0 && screen < 15 ? <><FooterButton label={screen === 10 && savingAccountSetup ? 'Saving your setup…' : screen === 6 ? 'Confirm area' : screen === 8 && hasRedFlag ? 'See safety guidance' : screen === 11 ? 'Looks good' : screen === 13 ? data.workoutReminders ? 'Enable reminders' : 'Continue' : screen === 14 ? 'Start training' : 'Continue'} onPress={screen === 13 ? () => { void saveReminderPreferences(); } : screen === 14 ? () => { void openToday(); } : next} disabled={savingAccountSetup || (screen === 4 && data.days.length === 0) || (screen === 9 && (!isAdult || !data.acknowledged))} />
            {screen === 2 ? <Text style={styles.footerNote}>Not sure? Start a little lighter.</Text> : null}
            {screen === 4 ? <Text style={styles.footerNote}>Recovery days are built in.</Text> : null}
            {screen === 5 ? <Text style={styles.footerNote}>Your health information stays private.</Text> : null}
            {screen === 6 ? <Text style={styles.footerNote}>You can change this selection later.</Text> : null}
            {screen === 9 ? <Text style={styles.footerNote}>You’re in control of what you share.</Text> : null}
            {screen === 11 ? <Text style={styles.footerNote}>Plan adapts to your session check-ins.</Text> : null}
            {screen === 12 ? <><Text style={styles.footerNote}>After 14 days, choose whether to continue at {data.membership === 'Annual' ? '$39.99 per year' : '$7.99 per month'}. This preview does not start a trial or take payment.</Text><View style={styles.legalLinks}><Pressable onPress={() => Alert.alert('Purchases', 'Purchases are not connected in this build.')}><Text style={styles.linkText}>Restore purchases</Text></Pressable><Text style={styles.linkDot}>·</Text><Pressable onPress={() => Alert.alert('Terms', 'Benchless AI provides strength-training coaching, not medical diagnosis or treatment. Stop training and seek qualified advice if you have new, severe or worsening symptoms.')}><Text style={styles.linkText}>Terms</Text></Pressable><Text style={styles.linkDot}>·</Text><Pressable onPress={() => Alert.alert('Privacy', 'Your onboarding choices are saved on this device. Do not enter detailed medical information in optional notes.')}><Text style={styles.linkText}>Privacy</Text></Pressable></View></> : null}
            {screen === 13 ? <><Text style={styles.footerNote}>{remindersActive ? 'Workout reminders are scheduled for your selected days.' : 'You can change these preferences later.'}</Text><Pressable onPress={() => { void syncWorkoutReminders(false, data.days, data.trainingTime).catch(() => undefined); setRemindersActive(false); update('workoutReminders', false); go(14); }} style={styles.notNow}><Text style={styles.linkText}>Not now</Text></Pressable></> : null}
          </> : null}
          {screen === 14 ? <Text style={styles.footerNote}>Membership is not connected in this build. No trial or payment has started.</Text> : null}
          {screen === 15 ? <><FooterButton label="Review my answers" onPress={() => go(8)} /><Pressable onPress={() => go(0)} style={styles.notNow}><Text style={styles.linkText}>Close for now</Text></Pressable><Pressable onPress={() => { const cleared = [...data.redFlags]; cleared.fill(false); update('redFlags', cleared); go(8); }} style={styles.notNow}><Text style={styles.linkText}>I answered by mistake</Text></Pressable></> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, keyboard: { flex: 1 },
  loadingState: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  topBar: { height: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topPlaceholder: { width: 50 }, backButton: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  topActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 9 }, themeToggle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }, themeToggleText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  backText: { color: colors.text, fontSize: 13, fontWeight: '600' }, prototype: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.55, flexShrink: 1, textAlign: 'right' },
  animated: { flex: 1 }, progressHeader: { paddingHorizontal: 24, paddingTop: 10 }, brandLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  brandMark: { width: 21, height: 21, borderRadius: 6, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  markBar: { position: 'absolute', top: 5, width: 11, height: 2, borderRadius: 1, backgroundColor: colors.onLime }, markStem: { position: 'absolute', left: 6, top: 6, width: 2, height: 7, backgroundColor: colors.onLime }, markFoot: { position: 'absolute', bottom: 4, width: 10, height: 2, borderRadius: 1, backgroundColor: colors.onLime },
  brandText: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.25, flex: 1 }, progressLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', position: 'absolute', right: 24, top: 15 },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: colors.progressTrack, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: colors.lime, borderRadius: 2 },
  scroll: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: designTokens.spacing.xl, paddingTop: 21, paddingBottom: 22 },
  welcomeTitle: { color: colors.text, fontSize: 40, lineHeight: 43, letterSpacing: -1.8, fontWeight: '700', marginTop: 10, maxWidth: 340 }, welcomeBody: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12, maxWidth: 360 },
  heroArtwork: { width: '100%', height: 270, marginTop: 22, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.lime },
  welcomePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.heroTag, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8, marginTop: 14 }, welcomePillText: { color: colors.limeSoft, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 }, welcomeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 13 },
  eyebrow: { color: colors.muted, fontSize: 11, letterSpacing: 0.7, marginBottom: 10, fontWeight: '600' }, title: { color: colors.text, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, fontWeight: '700', maxWidth: 440 }, body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8, maxWidth: 440 },
  options: { gap: 10, marginTop: 16 }, optionCard: { minHeight: 72, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }, optionCardCompact: { minHeight: 62 }, optionSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.surfaceSelected }, pressed: { opacity: 0.82 },
  optionSymbol: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center' }, optionSymbolSelected: {}, optionSymbolText: { color: colors.limeSoft, fontSize: 22, fontWeight: '600' }, optionThumb: { width: 38, height: 38, borderRadius: 8 }, optionCopy: { flex: 1 }, optionTitle: { color: colors.text, fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, fontWeight: '600' }, optionDetail: { color: colors.muted, fontSize: designTokens.type.footnote, lineHeight: 19, marginTop: 3 }, radio: { width: 22, height: 22, borderRadius: 12, borderWidth: 1, borderColor: colors.radioBorder, alignItems: 'center', justifyContent: 'center' }, radioSelected: { width: 23, height: 23, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, radioTick: { color: colors.onLime, fontSize: 14, lineHeight: 17, fontWeight: '900' },
  tipCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginTop: 12 }, tipTitle: { color: colors.text, fontSize: 15, fontWeight: '600' }, toggleRow: { minHeight: 72, borderRadius: 16, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }, switchTrack: { width: 46, height: 27, borderRadius: 14, backgroundColor: colors.switchOff, justifyContent: 'center', padding: 3 }, switchTrackOn: { backgroundColor: colors.lime }, switchKnob: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.text }, switchKnobOn: { alignSelf: 'flex-end', backgroundColor: colors.onLime },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, gap: 7 }, dayChip: { flex: 1, aspectRatio: 0.88, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, dayChipSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.surfaceSelected }, dayLetter: { color: colors.muted, fontSize: 17, fontWeight: '600' }, dayLetterSelected: { color: colors.limeSoft }, daysBadge: { alignSelf: 'flex-start', backgroundColor: colors.badge, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, marginTop: 14 }, daysBadgeText: { color: colors.limeSoft, fontSize: 11, fontWeight: '800' }, sessionList: { gap: 9, marginTop: 13 }, sessionRow: { minHeight: 57, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, sessionDay: { color: colors.muted, width: 32, fontSize: 12 }, sessionName: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '600' }, sessionTime: { color: colors.muted, fontSize: 12 }, smallNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 12 }, validationText: { color: colors.red, fontSize: 12, marginTop: 12 }, safetyCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  faceSwitch: { alignSelf: 'center', flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 10, padding: 3, marginTop: 12 }, faceButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderRadius: 7 }, faceButtonActive: { backgroundColor: colors.faceActive }, faceButtonText: { color: colors.muted, fontSize: 12, fontWeight: '600' }, faceButtonTextActive: { color: colors.limeSoft }, bodyPanel: { height: 280, marginTop: 12, borderRadius: 20, backgroundColor: colors.bodyPanel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, bodyFigure: { position: 'relative', width: 152, height: 250, alignItems: 'center', justifyContent: 'center' }, backFigure: { width: 144 }, bodyPhoto: { width: 152, height: 250, borderRadius: 18 }, backPhoto: { width: 144 }, figureHead: { position: 'absolute', top: 6, left: 83, width: 39, height: 45, borderRadius: 20, backgroundColor: colors.bodyHead, borderWidth: 2, borderColor: colors.bodyHeadBorder }, figureNeck: { position: 'absolute', top: 43, width: 25, height: 20, backgroundColor: colors.bodyHead }, figureTorso: { position: 'absolute', top: 56, width: 80, height: 116, borderRadius: 36, backgroundColor: colors.bodyTorso, borderWidth: 1, borderColor: colors.bodyTorsoBorder }, figureHip: { position: 'absolute', top: 153, width: 94, height: 45, borderRadius: 28, backgroundColor: colors.bodyTorso }, figureArmLeft: { position: 'absolute', top: 65, left: 34, width: 25, height: 115, borderRadius: 14, backgroundColor: colors.bodyArms, transform: [{ rotate: '9deg' }] }, figureArmRight: { position: 'absolute', top: 65, right: 34, width: 25, height: 115, borderRadius: 14, backgroundColor: colors.bodyArms, transform: [{ rotate: '-9deg' }] }, figureLegLeft: { position: 'absolute', top: 181, left: 63, width: 34, height: 112, borderRadius: 18, backgroundColor: colors.bodyLegs, transform: [{ rotate: '3deg' }] }, figureLegRight: { position: 'absolute', top: 181, right: 63, width: 34, height: 112, borderRadius: 18, backgroundColor: colors.bodyLegs, transform: [{ rotate: '-3deg' }] }, bodyHotspot: { position: 'absolute', width: 10, height: 10, marginLeft: -5, marginTop: -5, alignItems: 'center', justifyContent: 'center' }, markerSelected: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.lime, borderWidth: 1, borderColor: colors.onLime }, areaList: { gap: 8, marginTop: 8 }, sideActions: { flexDirection: 'row', alignItems: 'center', gap: 3 }, sideButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, sideButtonSelected: { borderColor: colors.lime, backgroundColor: colors.lime }, sideButtonText: { color: colors.muted, fontSize: 12, fontWeight: '700' }, sideButtonTextSelected: { color: colors.onLime }, removeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 1 }, removeArea: { color: colors.muted, fontSize: 20, paddingHorizontal: 4 }, figureCaption: { color: colors.limeSoft, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginTop: -4 }, selectedArea: { minHeight: 58, borderRadius: 12, borderWidth: 1, borderColor: colors.selectedBorder, backgroundColor: colors.surfaceSelected, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  painCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 17, marginTop: 23 }, fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.55 }, painScale: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 14 }, painNumber: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, painNumberSelected: { backgroundColor: colors.lime, borderColor: colors.lime }, painNumberText: { color: colors.text, fontSize: 16, fontWeight: '600' }, painNumberTextSelected: { color: colors.onLime }, scaleEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7, marginBottom: 24 }, scaleText: { color: colors.dim, fontSize: 11 }, onsetRow: { flexDirection: 'row', gap: 7, marginTop: 11 }, onsetChip: { flex: 1, borderRadius: 11, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center' }, onsetChipSelected: { backgroundColor: colors.surfaceSelected, borderColor: colors.selectedBorder }, onsetText: { color: colors.muted, fontSize: 11 }, onsetTextSelected: { color: colors.limeSoft }, causeLabel: { marginTop: 22 }, textInput: { minHeight: 46, color: colors.text, borderRadius: 11, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, marginTop: 9, fontSize: 13 },
  flagCard: { minHeight: 65, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }, checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1, borderColor: colors.checkBorder, alignItems: 'center', justifyContent: 'center' }, checkboxOn: { backgroundColor: colors.lime, borderColor: colors.lime }, checkboxTick: { color: colors.onLime, fontWeight: '900' }, flagText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 }, calmCard: { backgroundColor: colors.surfaceSelected, borderRadius: 16, padding: 16, marginTop: 13, gap: 4 }, calmTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '600' }, stopCard: { marginTop: 24, backgroundColor: colors.redSurface, borderRadius: 18, borderWidth: 1, borderColor: colors.dangerBorder, padding: 20 }, stopIcon: { width: 35, height: 35, backgroundColor: colors.red, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, stopIconText: { color: colors.background, fontSize: 22, fontWeight: '900' }, stopTitle: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '700' }, stopBody: { color: colors.dangerBody, fontSize: 14, lineHeight: 21, marginTop: 11 }, stopFoot: { color: colors.red, fontSize: 12, lineHeight: 18, marginTop: 14 }, selectedFlags: { marginTop: 10 },
  birthCard: { backgroundColor: colors.surface, borderRadius: 17, padding: 16, marginTop: 24 }, yearControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 }, yearArrow: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised }, yearArrowText: { color: colors.limeSoft, fontSize: 22, fontWeight: '500' }, yearInput: { color: colors.text, fontSize: 34, fontWeight: '600', minWidth: 130, textAlign: 'center', paddingVertical: 3 }, disclaimerCard: { minHeight: 120, borderRadius: 17, backgroundColor: colors.surface, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, disclaimerSelected: { backgroundColor: colors.surfaceSelected }, checkMark: { width: 23, height: 23, borderRadius: 7, borderWidth: 1, borderColor: colors.checkBorder, alignItems: 'center', justifyContent: 'center' }, checkMarkOn: { backgroundColor: colors.lime, borderColor: colors.lime }, checkMarkText: { color: colors.background, fontWeight: '900' }, checkMarkTextOn: { color: colors.onLime },
  accountCard: { borderRadius: 18, backgroundColor: colors.surface, padding: 17, marginTop: 25 }, accountBadge: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.profileBadge, borderRadius: 7, marginBottom: 14 }, accountBadgeText: { color: colors.limeSoft, fontSize: 11, fontWeight: '800' }, accountFeature: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 11 }, accountFeatureSymbol: { width: 20, color: colors.limeSoft, fontSize: 20, textAlign: 'center' }, accountFeatureText: { color: colors.text, fontSize: 14, fontWeight: '500' }, accountChoice: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, accountChoiceSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.surfaceSelected }, accountChoiceText: { color: colors.text, fontSize: 14, fontWeight: '600' }, accountChoiceCheck: { color: colors.limeSoft, fontSize: 16, position: 'absolute', right: 16 }, prototypeNote: { color: colors.dim, fontSize: 11, lineHeight: 16, marginTop: 13 },
  planNotice: { borderRadius: 15, padding: 15, backgroundColor: colors.surface, marginTop: 22 }, planNoticeTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 }, planSession: { minHeight: 68, borderRadius: 15, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }, planSessionDay: { color: colors.limeSoft, width: 31, fontSize: 11, fontWeight: '800' }, adaptedBadge: { borderRadius: 6, backgroundColor: colors.badge, paddingHorizontal: 7, paddingVertical: 5 }, adaptedText: { color: colors.limeSoft, fontSize: 11, fontWeight: '800' },
  membershipOption: { minHeight: 77, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 12, marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }, membershipSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.surfaceSelected }, timeline: { backgroundColor: colors.surface, borderRadius: 17, padding: 16, marginTop: 13, gap: 17 }, timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, timelineNumber: { color: colors.limeSoft, fontSize: 11, fontWeight: '800', width: 26 },
  timeCard: { borderRadius: 17, backgroundColor: colors.surface, padding: 17, marginTop: 23, marginBottom: 2 }, timeValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }, timeValue: { color: colors.text, fontSize: 39, letterSpacing: 1, fontWeight: '600' }, notificationPreview: { borderRadius: 17, backgroundColor: colors.surfaceSelected, padding: 16, marginTop: 13, gap: 6 },
  successMark: { width: 60, height: 60, borderRadius: 31, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 19 }, successCheck: { color: colors.onLime, fontSize: 35, fontWeight: '600' }, summaryCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 17, gap: 10, marginTop: 22 }, summaryLine: { color: colors.text, fontSize: 14, lineHeight: 19 },
  footer: { paddingHorizontal: designTokens.spacing.xl, paddingTop: 10, paddingBottom: 8, backgroundColor: colors.background }, primaryButton: { minHeight: 58, borderRadius: designTokens.radius.control, backgroundColor: colors.lime, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, primaryButtonText: { color: colors.onLime, textAlign: 'center', fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, fontWeight: '700', flex: 1 }, primaryArrow: { position: 'absolute', right: 19, color: colors.onLime, fontSize: 23, fontWeight: '500' }, buttonDisabled: { opacity: 0.45 }, buttonPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] }, secondaryButton: { minHeight: 53, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, marginTop: 13 }, secondaryButtonText: { color: colors.text }, footerNote: { color: colors.muted, fontSize: designTokens.type.caption, lineHeight: 16, marginTop: 9 }, notNow: { alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 9, marginTop: 2 }, legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 }, linkText: { color: colors.muted, fontSize: designTokens.type.caption }, linkDot: { color: colors.dim, fontSize: designTokens.type.caption },
}); }

type AppStyles = ReturnType<typeof createStyles>;
