import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OnboardingProfile, WorkoutHistoryEntry } from '../domain/models';
import { benchlessColors, designTokens, type ColorScheme } from '../design/tokens';
import { AppearancePicker, type AppearancePreference } from '../design/AppearancePicker';
import { APP_TABS, TAB_ACCESSIBILITY_LABELS, type AppTab } from '../navigation/types';
import { AppStateView } from '../components/system/AppStateView';
import { localWorkoutHistory } from './localWorkoutHistory';

type LoopScreen = 'today' | 'tab' | 'overview' | 'why' | 'exercise' | 'active' | 'complete' | 'checkin' | 'result' | 'painTrend' | 'history' | 'sessionDetail' | 'records' | 'settings' | 'membership' | 'trialEnding' | 'locked' | 'privacy' | 'help' | 'injury' | 'logPain' | 'reinjured' | 'healed' | 'move' | 'filters' | 'loading' | 'offline' | 'error' | 'calorieTarget' | 'foodLog' | 'addFood' | 'sleep' | 'bodyMetrics' | 'coach' | 'customWorkout' | 'injuryHistory';
type Tab = AppTab;
type Feel = 'Perfect' | 'A bit much' | 'Too much' | 'Too easy';
type Exercise = {
  id: string; name: string; detail: string; muscles: string; image: number;
  sets: number; reps: number; weight: number; rest: number; status?: 'SWAPPED' | 'MODIFIED'; reason?: string;
};

const strengthImage = require('../../assets/training/strength-session.jpg');
const floorImage = require('../../assets/training/floor-session.jpg');
const gymImage = require('../../assets/training/gym-session.jpg');

const initialExercises: Exercise[] = [
  { id: 'bike', name: 'Bike, easy', detail: '5 min · warm-up', muscles: 'Warm-up', image: gymImage, sets: 1, reps: 5, weight: 0, rest: 30 },
  { id: 'press', name: 'Leg press, light', detail: '3 × 12', muscles: 'Quads · Glutes', image: strengthImage, sets: 3, reps: 12, weight: 40, rest: 60, status: 'SWAPPED', reason: 'Swapped in for jump squats. Same muscles, much less load on your left knee.' },
  { id: 'squat', name: 'Back squat', detail: '3 × 8 · lighter, slower', muscles: 'Quads · Glutes', image: strengthImage, sets: 3, reps: 8, weight: 30, rest: 75, status: 'MODIFIED', reason: 'Lighter weight and a slower lowering phase. Same pattern, less strain on the selected area.' },
  { id: 'deadlift', name: 'Romanian deadlift', detail: '3 × 10', muscles: 'Hamstrings · Glutes', image: strengthImage, sets: 3, reps: 10, weight: 30, rest: 60 },
  { id: 'curl', name: 'Hamstring curl', detail: '3 × 12', muscles: 'Hamstrings', image: gymImage, sets: 3, reps: 12, weight: 20, rest: 60 },
  { id: 'deadbug', name: 'Dead bug', detail: '3 × 30 sec', muscles: 'Core', image: floorImage, sets: 3, reps: 30, weight: 0, rest: 45 },
];
const upperBodyExercises: Exercise[] = [
  { id: 'bike', name: 'Bike, easy', detail: '5 min · warm-up', muscles: 'Warm-up', image: gymImage, sets: 1, reps: 5, weight: 0, rest: 30 },
  { id: 'chestpress', name: 'Dumbbell chest press', detail: '3 × 10', muscles: 'Chest · Triceps', image: strengthImage, sets: 3, reps: 10, weight: 12, rest: 60 },
  { id: 'row', name: 'One-arm dumbbell row', detail: '3 × 10 each side', muscles: 'Back · Biceps', image: strengthImage, sets: 3, reps: 10, weight: 12, rest: 60 },
  { id: 'shoulderpress', name: 'Seated shoulder press', detail: '3 × 10', muscles: 'Shoulders · Triceps', image: gymImage, sets: 3, reps: 10, weight: 8, rest: 60 },
  { id: 'curl', name: 'Biceps curl', detail: '3 × 12', muscles: 'Biceps', image: gymImage, sets: 3, reps: 12, weight: 8, rest: 45 },
  { id: 'deadbug', name: 'Dead bug', detail: '3 × 30 sec', muscles: 'Core', image: floorImage, sets: 3, reps: 30, weight: 0, rest: 45 },
];

type Props = {
  darkMode: boolean;
  appearancePreference: AppearancePreference;
  onAppearanceChange: (value: AppearancePreference) => void;
  hasInjury: boolean;
  selectedArea: string;
  fullName: string;
  onboarding: OnboardingProfile & { completedAt: string | null };
  onEditSetup: () => void;
  onSignOut: () => void;
  remindersActive: boolean;
  onToggleWorkoutReminders: () => void;
  onToggleSessionCheckIns: () => void;
};

export default function DailyTrainingLoop({ darkMode, appearancePreference, onAppearanceChange, hasInjury, selectedArea, fullName, onboarding, onEditSetup, onSignOut, remindersActive, onToggleWorkoutReminders, onToggleSessionCheckIns }: Props) {
  const weekdayIndex = (new Date().getDay() + 6) % 7;
  const todaySessionNumber = onboarding.days.indexOf(weekdayIndex);
  const nextDayIndex = onboarding.days.find((day) => day > weekdayIndex) ?? onboarding.days[0] ?? 0;
  const sessionNumber = todaySessionNumber >= 0 ? todaySessionNumber : Math.max(0, onboarding.days.indexOf(nextDayIndex));
  const workoutName = sessionNumber % 2 === 0 ? 'Upper body' : 'Lower body';
  const upcomingDayIndex = onboarding.days.find((day) => day > weekdayIndex) ?? onboarding.days[0] ?? 0;
  const upcomingWorkoutDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][upcomingDayIndex];
  const upcomingSessionNumber = Math.max(0, onboarding.days.indexOf(upcomingDayIndex));
  const upcomingWorkoutName = upcomingSessionNumber % 2 === 0 ? 'Upper body' : 'Lower body';
  const initialPlan = workoutName === 'Upper body' ? upperBodyExercises : initialExercises;
  const [screen, setScreen] = useState<LoopScreen>('today');
  const [tab, setTab] = useState<Tab>('Today');
  const [exercises, setExercises] = useState(() => initialPlan.map((item) => ({ ...item, reason: item.reason?.replace(/your left knee/gi, selectedArea.toLowerCase()) })));
  const [selectedExercise, setSelectedExercise] = useState(1);
  const [activeExercise, setActiveExercise] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [setLogs, setSetLogs] = useState<Record<string, { weight: number; reps: number }[]>>({});
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<{ name: string; weight: number; reps: number; date: string }[]>([]);
  const [painHistory, setPainHistory] = useState<number[]>([]);
  const [weight, setWeight] = useState(40);
  const [reps, setReps] = useState(12);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [restSkipped, setRestSkipped] = useState(false);
  const [feel, setFeel] = useState<Feel>('Perfect');
  const [pain, setPain] = useState(1);
  const [selectedTooMuchExercise, setSelectedTooMuchExercise] = useState('');
  const [phase, setPhase] = useState(2);
  const [phaseSessions, setPhaseSessions] = useState(0);
  const [settledDays, setSettledDays] = useState(0);
  const [checkInResult, setCheckInResult] = useState<{ status: 'HOLD' | 'ADVANCE' | 'STEP BACK'; title: string; body: string; phase: number; sessions: number; settled: number } | null>(null);
  const [hurtPaused, setHurtPaused] = useState(false);
  const [sessionStart, setSessionStart] = useState(Date.now());
  const [networkState, setNetworkState] = useState<'online' | 'offline' | 'error'>('online');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('All');
  const [libraryMuscles, setLibraryMuscles] = useState<string[]>([]);
  const [libraryEquipment, setLibraryEquipment] = useState<string[]>([]);
  const [safeOnly, setSafeOnly] = useState(hasInjury);
  const [showLocked, setShowLocked] = useState(false);
  const [progressRange, setProgressRange] = useState<'Week' | 'Month' | 'All time'>('Week');
  const [moveTarget, setMoveTarget] = useState('');
  const [moveSourceDay, setMoveSourceDay] = useState(weekdayIndex);
  const [moveSourceLabel, setMoveSourceLabel] = useState('');
  const [movedSessions, setMovedSessions] = useState<Record<number, string>>({});
  const [skippedDays, setSkippedDays] = useState<number[]>([]);
  const [injuryActive, setInjuryActive] = useState(hasInjury);
  const [redFlagAnswers, setRedFlagAnswers] = useState<Record<string, boolean>>({});
  const [injuryNote, setInjuryNote] = useState('');
  const [settingsDraft, setSettingsDraft] = useState({ reminders: remindersActive, checkIns: onboarding.sessionCheckIns });
  const [privacyAnalytics, setPrivacyAnalytics] = useState(false);
  const [privacyCrashReports, setPrivacyCrashReports] = useState(false);
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const [membershipChoice, setMembershipChoice] = useState(onboarding.membership);
  const [isTrialEnded, setIsTrialEnded] = useState(false);
  const [detailSessionIndex, setDetailSessionIndex] = useState(0);
  const [planWeekOffset, setPlanWeekOffset] = useState(0);
  const [targetCalories, setTargetCalories] = useState(2350);
  const [calorieDraft, setCalorieDraft] = useState('2350');
  const [foodSearch, setFoodSearch] = useState('');
  const [meal, setMeal] = useState('Lunch');
  const [foodEntries, setFoodEntries] = useState<{ name: string; kcal: number; meal: string }[]>([
    { name: 'Oats with milk', kcal: 310, meal: 'Breakfast' }, { name: 'Banana', kcal: 110, meal: 'Breakfast' }, { name: 'Boiled eggs, 2', kcal: 100, meal: 'Breakfast' }, { name: 'Rice and chicken', kcal: 640, meal: 'Lunch' },
  ]);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [weightEntries, setWeightEntries] = useState([76.4, 76.8, 77.1, 77.6]);
  const [weightDraft, setWeightDraft] = useState('');
  const [coachPrompt, setCoachPrompt] = useState('');
  const [coachMessages, setCoachMessages] = useState([{ from: 'coach', text: 'I can explain your plan and available exercise swaps. Your plan’s safety rules stay in control.' }]);
  const [customWorkoutName, setCustomWorkoutName] = useState('Lower body, my way');
  const [customExercises, setCustomExercises] = useState<string[]>(['Leg press, light', 'Romanian deadlift']);
  const [injuryAreas, setInjuryAreas] = useState<string[]>(hasInjury ? [selectedArea] : []);

  const c = darkMode ? darkColors : lightColors;
  const s = useMemo(() => styles(c), [c]);
  const currentExercise = exercises[activeExercise] ?? exercises[0];
  const previewExercise = exercises[selectedExercise] ?? exercises[1];
  const areaLabel = injuryActive ? selectedArea : 'No current injury';
  const displayName = fullName.trim().split(/\s+/)[0];
  const moveWorkoutName = Math.max(0, onboarding.days.indexOf(moveSourceDay)) % 2 === 0 ? 'Upper body' : 'Lower body';
  const isTodayTrainingDay = onboarding.days.includes(weekdayIndex);
  const hasChanges = injuryActive && exercises.some((item) => item.status);
  const selectedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((_, index) => onboarding.days.includes(index));
  const now = new Date();
  const week = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => {
      const date = new Date(monday); date.setDate(monday.getDate() + i);
      return { name, number: date.getDate(), isToday: date.toDateString() === today.toDateString() };
    });
  }, []);

  useEffect(() => {
    let active = true;
    localWorkoutHistory.load().then((stored) => {
      if (active) {
        setSessionHistory(stored ?? []);
        setHistoryReady(true);
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (historyReady) void localWorkoutHistory.save(sessionHistory).catch(() => undefined);
  }, [historyReady, sessionHistory]);

  useEffect(() => {
    if (restSeconds === null) return;
    if (restSeconds <= 0) { setRestSeconds(null); return; }
    const timer = setTimeout(() => setRestSeconds((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [restSeconds]);

  function openOverview() { setTab('Today'); setScreen('overview'); }
  function backToToday() { setScreen('today'); setTab('Today'); }
  function openExercise(index: number) { setSelectedExercise(index); setScreen('exercise'); }
  function setMainTab(next: Tab) { setTab(next); setScreen(next === 'Today' ? 'today' : 'tab'); }
  function startWorkout() {
    setActiveExercise(0); setCompletedSets({}); setSetLogs({}); setRestSeconds(null); setHurtPaused(false);
    setSessionStart(Date.now()); setScreen('active');
  }
  function finishWorkout() {
    setWorkoutsCompleted((count) => count + 1);
    const totalSets = Object.values(completedSets).reduce((sum, count) => sum + count, 0);
    setSessionHistory((items) => [{ id: `workout-${Date.now()}`, date: new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }), title: workoutName, minutes: Math.max(1, Math.round((Date.now() - sessionStart) / 60000)), sets: totalSets, exercises: exercises.filter((item) => (completedSets[item.id] ?? 0) > 0).map((item) => ({ name: item.name, detail: `${completedSets[item.id]} sets` })) }, ...items]);
    setScreen('complete');
  }
  function beginExercise() {
    setActiveExercise(selectedExercise); setWeight(previewExercise.weight); setReps(previewExercise.reps);
    setHurtPaused(false); setRestSeconds(null); setScreen('active');
  }
  function offerExerciseSwap() {
    Alert.alert('Choose an alternative', 'Select an available movement for this session.', [
      { text: 'Keep current', style: 'cancel' },
      { text: 'Leg extension, light', onPress: () => setExercises((items) => items.map((item, index) => index === selectedExercise ? { ...item, name: 'Leg extension, light', detail: '3 × 12 · alternative', status: 'SWAPPED', reason: 'Alternative selected for this session.' } : item)) },
    ]);
  }
  function completeSet() {
    const done = completedSets[currentExercise.id] ?? 0;
    const next = done + 1;
    setCompletedSets((previous) => ({ ...previous, [currentExercise.id]: next }));
    const loggedWeight = isNaN(weight) ? currentExercise.weight : weight;
    const loggedReps = isNaN(reps) ? currentExercise.reps : reps;
    setSetLogs((previous) => ({ ...previous, [currentExercise.id]: [...(previous[currentExercise.id] ?? []), { weight: loggedWeight, reps: loggedReps }] }));
    if (!currentExercise.weight || loggedWeight * loggedReps > currentExercise.weight * currentExercise.reps) setPersonalRecords((items) => {
      const existing = items.find((item) => item.name === currentExercise.name);
      if (existing && existing.weight * existing.reps >= loggedWeight * loggedReps) return items;
      return [{ name: currentExercise.name, weight: loggedWeight, reps: loggedReps, date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) }, ...items.filter((item) => item.name !== currentExercise.name)];
    });
      if (currentExercise.id === 'bike' || next < currentExercise.sets) {
      setRestSkipped(false); setRestSeconds(currentExercise.rest);
      if (currentExercise.id === 'bike') setActiveExercise(1);
    } else if (activeExercise >= exercises.length - 1) {
      finishWorkout();
    } else {
      setActiveExercise((index) => index + 1);
      const upcoming = exercises[activeExercise + 1];
      setWeight(upcoming.weight); setReps(upcoming.reps); setRestSeconds(null);
    }
  }
  function saveCheckIn() {
    if (feel === 'Too much' && !selectedTooMuchExercise) {
      Alert.alert('Choose an exercise', 'Select the exercise that felt like too much so it can be included with your check-in.');
      return;
    }
    setPainHistory((history) => [...history, pain]);
    setSessionHistory((items) => items.length ? [{ ...items[0], pain, feel }, ...items.slice(1)] : items);
    const stepBack = feel === 'Too much' && pain > 1;
    const settledAfter = feel === 'Perfect' && pain <= 1 ? Math.min(3, settledDays + 1) : settledDays;
    const sessionsAfter = phaseSessions + 1;
    const advance = !stepBack && feel === 'Perfect' && pain <= 1 && settledAfter >= 3 && sessionsAfter >= 4 && phase < 4;
    let nextPhase = phase;
    let nextSessions = sessionsAfter;
    let nextSettled = settledAfter;
    let outcome: { status: 'HOLD' | 'ADVANCE' | 'STEP BACK'; title: string; body: string };

    if (stepBack) {
      nextPhase = Math.max(1, phase - 1);
      nextSessions = 0;
      nextSettled = 0;
      outcome = { status: 'STEP BACK', title: 'Let’s ease back a phase.', body: 'Your pain is higher after a session that felt like too much. The next session is reduced and flagged for review.' };
    } else if (advance) {
      nextPhase = phase + 1;
      nextSessions = 0;
      nextSettled = 0;
      outcome = { status: 'ADVANCE', title: 'You’re ready for the next phase.', body: 'Your settled check-ins and phase sessions have met the progression criteria.' };
    } else if (feel === 'Too much') {
      outcome = { status: 'HOLD', title: 'Keep the phase steady.', body: 'We’ll hold your current phase and review the exercise that felt like too much before your next session.' };
    } else if (feel === 'A bit much') {
      outcome = { status: 'HOLD', title: 'Stay in this phase.', body: 'We’ll keep the phase steady and make the next session a little lighter.' };
    } else if (feel === 'Too easy' && pain <= 1) {
      outcome = { status: 'HOLD', title: 'A small load increase next time.', body: 'Your pain is low, so the next session can gently increase the load. Phase progression follows your check-in history.' };
    } else {
      outcome = { status: 'HOLD', title: 'Nice. Your body is settling.', body: 'Your current phase stays in place while you build a consistent training record.' };
    }

    setPhase(nextPhase);
    setPhaseSessions(nextSessions);
    setSettledDays(nextSettled);
    setCheckInResult({ ...outcome, phase: nextPhase, sessions: nextSessions, settled: nextSettled });
    setScreen('result');
  }
  function getResult() {
    return checkInResult ?? { status: 'HOLD' as const, title: 'Nice. Your body is settling.', body: 'Your current phase stays in place.', phase, sessions: phaseSessions, settled: settledDays };
  }
  function phaseLabel(value = phase) { return value === 1 ? 'Building a base' : value === 2 ? 'Controlled loading' : value === 3 ? 'Building strength' : 'Return to performance'; }

  function Header({ title, right, onBack }: { title: string; right?: string; onBack?: () => void }) {
    return <View style={s.header}><Pressable onPress={onBack ?? backToToday} accessibilityRole="button" accessibilityLabel="Go back" style={s.iconButton}><Text style={s.iconButtonText}>‹</Text></Pressable><Text style={s.headerTitle}>{title}</Text><View style={s.headerRight}>{right ? <Text style={s.headerMeta}>{right}</Text> : null}</View></View>;
  }
  function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
    return <Pressable onPress={onPress} disabled={disabled} style={[s.button, secondary && s.secondaryButton, disabled && s.disabled]}><Text style={[s.buttonText, secondary && s.secondaryButtonText]}>{label}</Text></Pressable>;
  }
  function Tag({ children, accent = false }: { children: string; accent?: boolean }) { return <View style={[s.tag, accent && s.tagAccent]}><Text style={[s.tagText, accent && s.tagAccentText]}>{children}</Text></View>; }
  function ExerciseRow({ item, index, onPress }: { item: Exercise; index: number; onPress: () => void }) {
    const completed = completedSets[item.id] ?? 0;
    return <Pressable onPress={onPress} style={s.exerciseRow}>
      <Image source={item.image} style={s.exerciseThumb} resizeMode="cover" />
      <View style={s.exerciseCopy}><Text style={s.exerciseName}>{item.name}</Text><Text style={s.metaText}>{item.detail}</Text></View>
      {injuryActive && item.status ? <Tag accent={item.status === 'SWAPPED'}>{item.status}</Tag> : completed ? <Text style={s.completedCheck}>✓</Text> : <Text style={s.chevron}>›</Text>}
    </Pressable>;
  }
  function BottomTabs() {
    const names: readonly Tab[] = APP_TABS;
    const icons = ['⌂', '▦', '✳', '⌁', '◯'];
    return <View accessibilityRole="tablist" style={s.tabs}>{names.map((name, i) => <Pressable key={name} onPress={() => setMainTab(name)} accessibilityRole="tab" accessibilityLabel={TAB_ACCESSIBILITY_LABELS[name]} accessibilityState={{ selected: tab === name }} style={s.tabItem}><Text accessible={false} style={[s.tabIcon, tab === name && s.tabActive]}>{icons[i]}</Text><Text accessible={false} style={[s.tabLabel, tab === name && s.tabActive]}>{name}</Text></Pressable>)}</View>;
  }
  function TodayContent() {
    return <>
      <View style={s.todayDateRow}>
        <Text style={s.dateText}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>Dark mode</Text>
          <Switch accessibilityLabel="Dark mode" accessibilityHint="Turn dark appearance on or off" value={darkMode}
            onValueChange={(enabled) => onAppearanceChange(enabled ? 'dark' : 'light')}
            trackColor={{ false: c.border, true: c.limeDark }} thumbColor={darkMode ? c.lime : c.raised} />
        </View>
      </View>
      <Text style={s.pageTitle}>{displayName ? `Hello, ${displayName}` : 'Today'}</Text>
      <Text style={s.subTitle}>Here’s your training for today.</Text>
      {networkState === 'offline' && <Pressable onPress={() => setScreen('offline')} style={s.offlineBanner}><Text style={s.offlineIcon}>⌁</Text><View style={{ flex: 1 }}><Text style={s.exerciseName}>You’re offline</Text><Text style={s.metaText}>Your saved workouts still work. We’ll sync when you’re back.</Text></View></Pressable>}
      <View style={s.weekRow}>{week.map((day, index) => { const trainingDay = onboarding.days.includes(index); return <View key={day.name} style={[s.weekDay, day.isToday && s.weekDayActive]}><Text style={[s.weekDayName, day.isToday && s.limeText]}>{day.name}</Text><Text style={[s.weekDayNumber, day.isToday && s.primaryText]}>{day.number}</Text><View style={[s.dayDot, trainingDay && s.dayDotActive]} /></View>; })}</View>
      {injuryActive ? <View style={s.phaseCard}><View style={s.cardTopRow}><Tag accent>{areaLabel.toUpperCase()}</Tag><Text style={s.metaText}>Phase {phase} of 4</Text></View><Text style={s.phaseTitle}>{phaseLabel()}</Text><View style={s.phaseLineRow}><Text style={s.metaText}>{settledDays} of 3 settled days · {phaseSessions} of 4 phase sessions</Text><View style={s.phaseDots}>{[0,1,2].map((dot) => <View key={dot} style={dot < settledDays ? s.dotOn : s.dotOff}/>)}</View></View></View> : <View style={s.phaseCard}><Tag accent>{onboarding.goal.toUpperCase()}</Tag><Text style={s.phaseTitle}>{onboarding.experience} starting point</Text><Text style={s.metaText}>Training {onboarding.days.length} days per week · {onboarding.equipment.join(', ') || 'No equipment selected'}</Text></View>}
      <View style={s.heroCard}><Image source={strengthImage} style={s.heroImage} resizeMode="cover"/><View style={s.heroShade}/><View style={s.heroContent}><Tag accent>{hasChanges ? 'ADAPTED PLAN' : 'TODAY’S SESSION'}</Tag><Text style={s.heroTitle}>{workoutName}</Text><Text style={s.heroMeta}>40 min · {exercises.length} exercises{injuryActive ? ` · Phase ${phase}` : ''}</Text><View style={s.heroActionRow}><Pressable onPress={openOverview} style={s.heroButton}><Text style={s.heroButtonText}>{isTodayTrainingDay ? 'Start workout' : 'View next session'}</Text></Pressable>{hasChanges && <Pressable onPress={() => setScreen('why')} style={s.heroLink}><Text style={s.heroLinkText}>What changed</Text></Pressable>}</View></View></View>
      {hasChanges && <Pressable onPress={() => setScreen('why')} style={s.inlineWhy}><Text style={s.swapIcon}>⇄</Text><View style={s.exerciseCopy}><Text style={s.exerciseName}>2 changes for your {areaLabel.toLowerCase()}</Text><Text style={s.metaText}>See what changed and why</Text></View><Text style={s.chevron}>›</Text></Pressable>}
      <View style={s.upNext}><Text style={s.sectionEyebrow}>YOUR ROUTINE</Text><Text style={s.exerciseName}>{selectedDays.join(' · ')}</Text><Text style={s.metaText}>Training reminder · {onboarding.trainingTime}</Text></View>
    </>;
  }
  function PageRow({ title, detail, onPress, trailing = '›' }: { title: string; detail?: string; onPress: () => void; trailing?: string }) {
    return <Pressable onPress={onPress} accessibilityRole="button" style={s.simpleRow}><View style={{ flex: 1, gap: 3 }}><Text style={s.exerciseName}>{title}</Text>{detail ? <Text style={s.metaText}>{detail}</Text> : null}</View><Text style={s.chevron}>{trailing}</Text></Pressable>;
  }
  function MeRow({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
    return <Pressable onPress={onPress} accessibilityRole="button" style={s.meRow}><View style={s.meRowCopy}><Text style={s.meRowTitle}>{title}</Text><Text style={s.meRowDetail}>{detail}</Text></View><Text style={s.meRowChevron}>›</Text></Pressable>;
  }
  function Chip({ title, selected, onPress }: { title: string; selected: boolean; onPress: () => void }) {
    return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={[s.filterChip, selected && s.filterChipSelected]}><Text style={[s.filterChipText, selected && s.filterChipTextSelected]}>{title}</Text></Pressable>;
  }
  function ToggleRow({ title, detail, value, onPress }: { title: string; detail?: string; value: boolean; onPress: () => void }) {
    return <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: value }} style={s.simpleRow}><View style={{ flex: 1, gap: 3 }}><Text style={s.exerciseName}>{title}</Text>{detail ? <Text style={s.metaText}>{detail}</Text> : null}</View><View style={[s.switchTrack, value && s.switchTrackOn]}><View style={[s.switchThumb, value && s.switchThumbOn]}/></View></Pressable>;
  }
  function ScreenHeader({ title, right, onBack }: { title: string; right?: string; onBack?: () => void }) {
    return <><Header title={title} right={right} onBack={onBack ?? (() => setScreen('tab'))}/></>;
  }
  function SectionLabel({ children }: { children: string }) { return <Text style={s.sectionHeading}>{children}</Text>; }
  function EmptyState({ icon, title, detail, action, onPress }: { icon: string; title: string; detail: string; action: string; onPress: () => void }) {
    return <View style={s.emptyState}><View style={s.emptyIcon}><Text style={s.emptyIconText}>{icon}</Text></View><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyBody}>{detail}</Text><Button label={action} onPress={onPress}/></View>;
  }
  function PainChart({ values, s: style }: { values: number[]; s: ReturnType<typeof styles> }) {
    const visible = values.slice(-8);
    return <View style={style.chartBars} accessibilityLabel={`Pain scores ${visible.join(', ')}`} accessibilityRole="image">{visible.map((value, index) => <View key={`${index}-${value}`} style={style.chartColumn}><View style={[style.chartBar, { height: 16 + value * 15 }]}/><Text style={style.chartValue}>{value}</Text></View>)}</View>;
  }
  function getRecords() { return personalRecords; }
  function retryPlanLoad() {
    setNetworkState('online');
    setScreen('loading');
    setTimeout(() => setScreen((current) => current === 'loading' ? 'today' : current), 650);
  }
  function TabContent() {
    if (tab === 'Plan') {
      const weekdayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + planWeekOffset * 7);
      const weekDays = weekdayNames.map((name, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return { name, date, index: (i + planWeekOffset * onboarding.days.length + 20 * onboarding.days.length) % Math.max(1, onboarding.days.length) }; });
      const sessions = weekDays.map((day, i) => ({ ...day, workout: onboarding.days.includes(i) ? (onboarding.days.indexOf(i) % 2 === 0 ? 'Upper body' : 'Lower body') : 'Rest day', sessionDay: i }));
      return <><View style={s.pageTopRow}><Text style={s.pageTitle}>Plan</Text><Text style={s.metaText}>Week {Math.max(1, Math.min(4, phase + planWeekOffset))} of 4</Text></View><View style={s.weekNav}><Pressable accessibilityRole="button" accessibilityLabel="Previous week" onPress={() => setPlanWeekOffset((x) => Math.max(-3, x - 1))} style={s.iconButton}><Text style={s.iconButtonText}>‹</Text></Pressable><Text style={s.exerciseName}>{monday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – {new Date(monday.getTime() + 6 * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next week" onPress={() => setPlanWeekOffset((x) => Math.min(3, x + 1))} style={s.iconButton}><Text style={s.iconButtonText}>›</Text></Pressable></View>{injuryActive && <PageRow title={`Adapted around your ${areaLabel.toLowerCase()}`} detail={`Phase ${phase} · ${phaseLabel()}`} onPress={() => setScreen('injury')} trailing="Injury"/>}{sessions.map(({ name, date, workout, sessionDay }) => { const movedTo = movedSessions[sessionDay]; const isToday = date.toDateString() === new Date().toDateString(); const skipped = skippedDays.includes(sessionDay); return <Pressable key={name + sessionDay} onPress={() => workout === 'Rest day' ? undefined : (setMoveSourceDay(sessionDay), setMoveSourceLabel(`${name} ${date.getDate()}`), setMoveTarget(''), setScreen('move'))} style={[s.planDayRow, isToday && s.planDayToday, skipped && s.rowMuted]}><View style={s.planDate}><Text style={s.metaText}>{name}</Text><Text style={s.planDateNumber}>{date.getDate()}</Text></View><View style={{ flex: 1, gap: 3 }}><Text style={s.exerciseName}>{skipped ? 'Session skipped' : movedTo ? `${workout} · moved` : workout}</Text><Text style={s.metaText}>{workout === 'Rest day' ? 'Recovery' : skipped ? 'You can continue with your next planned session.' : `${workout === 'Upper body' ? 45 : 40} min${injuryActive ? ' · Adapted' : ''}`}</Text></View>{workout !== 'Rest day' && <Text style={s.chevron}>{isToday ? 'TODAY' : '›'}</Text>}</Pressable>; })}<View style={s.planNote}><Text style={s.planNoteTitle}>Recovery is part of the plan.</Text><Text style={s.metaText}>Move or skip a session when life changes. Your rest days stay visible.</Text></View></>;
    }
    if (tab === 'Library') {
      const categories = ['All', 'Upper', 'Lower', 'Core', 'Cardio'];
      const filtered = exercises.filter((item) => {
        const queryMatch = `${item.name} ${item.muscles} ${item.detail}`.toLowerCase().includes(libraryQuery.toLowerCase());
        const categoryMatch = libraryCategory === 'All' || item.muscles.toLowerCase().includes(libraryCategory.toLowerCase()) || (libraryCategory === 'Cardio' && item.id === 'bike');
        const muscleMatch = libraryMuscles.length === 0 || libraryMuscles.some((muscle) => item.muscles.toLowerCase().includes(muscle.toLowerCase()));
        const equipmentMatch = libraryEquipment.length === 0 || libraryEquipment.some((equipment) => equipment === 'Bodyweight' ? item.weight === 0 : true);
        const safeMatch = !safeOnly || item.id !== 'squat';
        const lockedMatch = showLocked || !['Jump squat', 'Walking lunge'].includes(item.name);
        return queryMatch && categoryMatch && muscleMatch && equipmentMatch && safeMatch && lockedMatch;
      });
      return <><Text style={s.pageTitle}>Library</Text><TextInput value={libraryQuery} onChangeText={setLibraryQuery} placeholder={`Search ${exercises.length} exercises`} placeholderTextColor={c.dim} accessibilityLabel="Search exercises" style={s.searchField}/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>{categories.map((name) => <Chip key={name} title={name} selected={libraryCategory === name} onPress={() => setLibraryCategory(name)}/>)}</ScrollView><ToggleRow title="Safe for my selected area" value={safeOnly} onPress={() => setSafeOnly((x) => !x)}/><View style={s.rowBetween}><Text style={s.metaText}>{filtered.length} exercises</Text><Pressable onPress={() => setScreen('filters')} style={s.inlineAction}><Text style={s.limeText}>Filters</Text></Pressable></View>{filtered.length ? filtered.map((item) => { const originalIndex = exercises.findIndex((x) => x.id === item.id); return <ExerciseRow key={item.id} item={item} index={originalIndex} onPress={() => openExercise(originalIndex)}/>; }) : <EmptyState icon="⌕" title="No matching movements" detail="Try another search or clear a filter." action="Clear filters" onPress={() => { setLibraryQuery(''); setLibraryCategory('All'); setLibraryMuscles([]); setLibraryEquipment([]); }}/>}</>;
    }
    if (tab === 'Progress') {
      const sessionsThisWeek = Math.min(workoutsCompleted, onboarding.days.length);
      const currentPain = painHistory.at(-1);
      const muscleVolume = exercises.reduce<Record<string, number>>((totals, item) => { const logged = setLogs[item.id]?.length ?? 0; for (const muscle of item.muscles.split(' · ')) totals[muscle] = (totals[muscle] ?? 0) + logged; return totals; }, {});
      if (!workoutsCompleted && !painHistory.length) return <><Text style={s.pageTitle}>Progress</Text><View style={s.rangePills}>{(['Week','Month','All time'] as const).map((range) => <Chip key={range} title={range} selected={progressRange === range} onPress={() => setProgressRange(range)}/>)}</View><EmptyState icon="▥" title="No sessions yet." detail="Finish your first workout and your progress will show up here." action="Go to Today" onPress={backToToday}/></>;
      return <><Text style={s.pageTitle}>Progress</Text><View style={s.rangePills}>{(['Week','Month','All time'] as const).map((range) => <Chip key={range} title={range} selected={progressRange === range} onPress={() => setProgressRange(range)}/>)}</View><Pressable onPress={() => setScreen('history')} style={s.metricWide}><View style={s.rowBetween}><Text style={s.sectionHeading}>CONSISTENCY</Text><Text style={s.limeText}>{sessionsThisWeek} of {onboarding.days.length} done</Text></View><View style={s.consistencyDots}>{['M','T','W','T','F','S','S'].map((day, index) => <View key={day + index} style={s.consistencyDay}><View style={[s.consistencyCircle, index < sessionsThisWeek && s.consistencyDone]}><Text style={s.consistencyMark}>{index < sessionsThisWeek ? '✓' : ''}</Text></View><Text style={s.metaText}>{day}</Text></View>)}</View></Pressable>{injuryActive && <Pressable onPress={() => setScreen('painTrend')} style={s.metricWide}><View style={s.rowBetween}><Text style={s.sectionHeading}>{areaLabel.toUpperCase()} · PAIN</Text><Text style={s.limeText}>{painHistory.length ? `${painHistory[0]} → ${currentPain}` : 'No check-ins yet'}</Text></View>{painHistory.length ? <PainChart values={painHistory} s={s}/> : <Text style={s.metaText}>Your pain trend appears after you save a check-in.</Text>}<View style={s.rowBetween}><Text style={s.metaText}>Based on saved check-ins</Text><Text style={s.limeText}>See trend ›</Text></View></Pressable>}<View style={s.metricWide}><View style={s.rowBetween}><Text style={s.sectionHeading}>VOLUME BY MUSCLE</Text><Text style={s.metaText}>Logged sets</Text></View>{Object.keys(muscleVolume).length ? Object.entries(muscleVolume).map(([muscle, count]) => <View key={muscle} style={s.phaseLineRow}><Text style={s.metaText}>{muscle}</Text><Text style={s.exerciseName}>{count} sets</Text></View>) : <Text style={s.metaText}>Logged muscle volume will appear after your first workout.</Text>}</View><View style={s.metricGrid}><Metric label="SESSIONS" value={String(workoutsCompleted)}/><Metric label="PERSONAL RECORDS" value={String(getRecords().length)}/></View><PageRow title="Personal records" detail="Your best logged sets" onPress={() => setScreen('records')}/><PageRow title="Session history" detail="Review completed workouts" onPress={() => setScreen('history')}/></>;
    }
    const initials = fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
    return <><Text style={s.pageTitle}>Me</Text><View style={s.meIdentity}><View style={s.meAvatar}><Text style={s.meInitials}>{initials || '•'}</Text></View><View style={s.meIdentityCopy}><Text style={s.meName}>{fullName.trim() || 'Your account'}</Text><Text style={s.metaText}>Benchless account</Text></View><Text style={s.meCheck}>✓</Text></View><View style={s.mePlanCard}><Text style={s.sectionHeading}>YOUR TRAINING</Text><Text style={s.mePlanTitle}>{onboarding.goal}</Text><Text style={s.metaText}>{onboarding.experience} · {onboarding.days.length} days a week</Text><View style={s.mePlanDivider}/><Text style={s.metaText}>{onboarding.equipment.join(' · ') || 'Bodyweight'}</Text></View><MeRow title="Training settings" detail="Goal, level, equipment and schedule" onPress={() => setScreen('settings')}/><MeRow title="Injury history" detail={injuryActive ? `${areaLabel} · Phase ${phase} of 4` : 'No active injury'} onPress={() => setScreen('injuryHistory')}/><SectionLabel>YOUR APP</SectionLabel><MeRow title="Reminders & check-ins" detail={`${remindersActive ? 'Reminders on' : 'Reminders off'} · ${onboarding.trainingTime}`} onPress={() => setScreen('settings')}/><MeRow title="Body metrics" detail="Weight and measurements" onPress={() => setScreen('bodyMetrics')}/><MeRow title="Food & calories" detail={`${targetCalories.toLocaleString()} kcal target`} onPress={() => setScreen('foodLog')}/><MeRow title="Sleep" detail="Log rest and recovery" onPress={() => setScreen('sleep')}/><MeRow title="Ask your coach" detail="Get an explanation for your plan" onPress={() => setScreen('coach')}/><SectionLabel>SUPPORT</SectionLabel><MeRow title="Membership" detail="Membership status and options" onPress={() => setScreen('membership')}/><MeRow title="Privacy & data" detail="Manage your information" onPress={() => setScreen('privacy')}/><MeRow title="Help & safety" detail="Training guidance and support" onPress={() => setScreen('help')}/><Button label="Edit training setup" secondary onPress={onEditSetup}/><Button label="Sign out" secondary onPress={onSignOut}/></>;
  }
  function DetailScreen() {
    if (screen === 'settings') return <><ScreenHeader title="Settings"/><Text style={s.pageTitle}>Training settings</Text><SectionLabel>APPEARANCE</SectionLabel><AppearancePicker value={appearancePreference} scheme={darkMode ? 'dark' : 'light'} onChange={onAppearanceChange}/><SectionLabel>TRAINING</SectionLabel><PageRow title="Goal" detail={onboarding.goal} onPress={onEditSetup}/><PageRow title="Level" detail={onboarding.experience} onPress={onEditSetup}/><PageRow title="Equipment" detail={onboarding.equipment.join(' + ')} onPress={onEditSetup}/><PageRow title="Training days" detail={selectedDays.join(' · ')} onPress={onEditSetup}/><SectionLabel>APP</SectionLabel><ToggleRow title="Workout reminders" detail={`${remindersActive ? 'On' : 'Off'} · ${onboarding.trainingTime}`} value={settingsDraft.reminders} onPress={() => { setSettingsDraft((x) => ({ ...x, reminders: !x.reminders })); onToggleWorkoutReminders(); }}/><ToggleRow title="Session check-ins" value={settingsDraft.checkIns} onPress={() => { setSettingsDraft((x) => ({ ...x, checkIns: !x.checkIns })); onToggleSessionCheckIns(); }}/><Button label="Edit onboarding answers" secondary onPress={onEditSetup}/></>;
    if (screen === 'calorieTarget') return <><ScreenHeader title="Daily calories"/><Text style={s.pageTitle}>Set your daily calorie target</Text><Text style={s.subTitle}>A starting estimate. You can change it any time.</Text><View style={s.phaseCard}><Text style={s.metaText}>DAILY TARGET</Text><View style={s.rowBetween}><Pressable accessibilityLabel="Decrease calorie target" onPress={() => setCalorieDraft(String(Math.max(1200, Number(calorieDraft || targetCalories) - 50)))} style={s.iconButton}><Text style={s.iconButtonText}>−</Text></Pressable><TextInput value={calorieDraft} onChangeText={(v) => setCalorieDraft(v.replace(/\D/g, '').slice(0, 5))} keyboardType="number-pad" accessibilityLabel="Calories per day" style={[s.pageTitle, { textAlign: 'center', flex: 1 }]}/><Pressable accessibilityLabel="Increase calorie target" onPress={() => setCalorieDraft(String(Math.min(6000, Number(calorieDraft || targetCalories) + 50)))} style={s.iconButton}><Text style={s.iconButtonText}>+</Text></Pressable></View><Text style={s.metaText}>Estimated target · adjust with a qualified professional if you have specific nutrition needs.</Text></View><View style={s.spacerFill}/><Button label="Save calorie target" onPress={() => { const value = Number(calorieDraft); if (value >= 1200 && value <= 6000) { setTargetCalories(value); setScreen('foodLog'); } else Alert.alert('Check your target', 'Choose a daily target from 1,200 to 6,000 calories.'); }}/></>;
    if (screen === 'foodLog') { const total = foodEntries.reduce((sum, item) => sum + item.kcal, 0); return <><ScreenHeader title="Food"/><Text style={s.pageTitle}>Today’s food</Text><Pressable onPress={() => setScreen('calorieTarget')} style={s.metricWide}><View style={s.rowBetween}><Text style={s.metricLarge}>{total.toLocaleString()}</Text><Text style={s.metaText}>of {targetCalories.toLocaleString()} kcal</Text></View><View style={s.progressTrack}><View style={[s.progressFill, { width: `${Math.min(100, total / targetCalories * 100)}%` }]}/></View><Text style={s.metaText}>Food entries are stored on this device preview.</Text></Pressable>{['Breakfast','Lunch','Dinner','Snack'].map((name) => { const items = foodEntries.filter((item) => item.meal === name); return <View key={name} style={s.phaseCard}><View style={s.rowBetween}><Text style={s.exerciseName}>{name}</Text><Text style={s.metaText}>{items.reduce((sum, item) => sum + item.kcal, 0)} kcal</Text></View>{items.map((item) => <View key={item.name} style={s.phaseLineRow}><Text style={s.metaText}>{item.name}</Text><Text style={s.metaText}>{item.kcal}</Text></View>)}<Pressable onPress={() => { setMeal(name); setScreen('addFood'); }} style={s.inlineAction}><Text style={s.limeText}>+ Add food</Text></Pressable></View>; })}<Button label="Add food" onPress={() => setScreen('addFood')}/></>; }
    if (screen === 'addFood') { const foods = [{ name: 'Rice, cooked', kcal: 205 }, { name: 'Jollof rice', kcal: 380 }, { name: 'Fried rice', kcal: 420 }, { name: 'Brown rice, cooked', kcal: 216 }].filter((item) => item.name.toLowerCase().includes(foodSearch.toLowerCase())); return <><ScreenHeader title="Add food"/><TextInput value={foodSearch} onChangeText={setFoodSearch} placeholder="Search foods" placeholderTextColor={c.dim} accessibilityLabel="Search foods" style={s.searchField}/><Text style={s.subTitle}>Adding to {meal}</Text>{foods.map((item) => <Pressable key={item.name} onPress={() => { setFoodEntries((items) => [...items, { ...item, meal }]); setScreen('foodLog'); }} style={s.simpleRow}><View style={{ flex: 1 }}><Text style={s.exerciseName}>{item.name}</Text><Text style={s.metaText}>1 serving · {item.kcal} kcal</Text></View><Text style={s.limeText}>Add +</Text></Pressable>)}<View style={s.phaseCard}><Text style={s.exerciseName}>Can’t find it?</Text><Text style={s.metaText}>Custom food entry will be available with the nutrition catalogue.</Text></View></>; }
    if (screen === 'sleep') return <><ScreenHeader title="Sleep"/><Text style={s.pageTitle}>How did you sleep?</Text><Text style={s.subTitle}>Sleep can help you recover between sessions.</Text><View style={s.phaseCard}><Text style={s.sectionHeading}>LAST NIGHT</Text><View style={s.rowBetween}><Pressable accessibilityLabel="Reduce sleep duration" onPress={() => setSleepHours((h) => Math.max(0, +(h - 0.5).toFixed(1)))} style={s.iconButton}><Text style={s.iconButtonText}>−</Text></Pressable><Text style={s.metricLarge}>{Math.floor(sleepHours)} h {sleepHours % 1 ? '30' : '00'} min</Text><Pressable accessibilityLabel="Increase sleep duration" onPress={() => setSleepHours((h) => Math.min(16, +(h + 0.5).toFixed(1)))} style={s.iconButton}><Text style={s.iconButtonText}>+</Text></Pressable></View></View><SectionLabel>HOW DID IT FEEL?</SectionLabel><View style={s.chipRow}>{[1,2,3,4,5].map((n) => <Chip key={n} title={String(n)} selected={sleepQuality === n} onPress={() => setSleepQuality(n)}/>)}</View><Text style={s.metaText}>1 · Poor   5 · Rested</Text><View style={s.metricWide}><Text style={s.sectionHeading}>THIS WEEK</Text><Text style={s.exerciseName}>Average {sleepHours.toFixed(1)} hours · latest rating {sleepQuality} of 5</Text></View><Button label="Save sleep" onPress={() => Alert.alert('Sleep saved', 'Your sleep entry is saved for this app preview.')}/></>;
    if (screen === 'bodyMetrics') return <><ScreenHeader title="Body metrics"/><Text style={s.pageTitle}>Body metrics</Text><Text style={s.subTitle}>Track changes over time if they’re useful to you.</Text><View style={s.metricWide}><View style={s.rowBetween}><Text style={s.metricLarge}>{weightEntries.at(-1)} kg</Text><Text style={s.limeText}>{(weightEntries.at(-1)! - weightEntries[0]).toFixed(1)} kg since first entry</Text></View><Text style={s.metaText}>Recent entries: {weightEntries.slice(-4).join(' · ')} kg</Text></View><TextInput value={weightDraft} onChangeText={(v) => setWeightDraft(v.replace(/[^0-9.]/g, '').slice(0, 6))} keyboardType="decimal-pad" placeholder="Weight in kg" placeholderTextColor={c.dim} accessibilityLabel="Weight in kilograms" style={s.searchField}/><SectionLabel>MEASUREMENTS</SectionLabel>{[['Waist','84 cm'],['Chest','101 cm'],['Arm','35 cm']].map(([name,value]) => <PageRow key={name} title={name} detail={value} onPress={() => Alert.alert(name, 'Measurement editing will be available in the full body metrics flow.')}/>)}<Button label="Save weight" disabled={!weightDraft.trim()} onPress={() => { const value = Number(weightDraft); if (value > 20 && value < 400) { setWeightEntries((items) => [...items, value]); setWeightDraft(''); } else Alert.alert('Check the weight', 'Enter a value between 20 and 400 kg.'); }}/></>;
    if (screen === 'coach') return <><ScreenHeader title="Coach"/><Text style={s.pageTitle}>Ask your coach</Text><Text style={s.metaText}>Plan explanations only · coaching, not medical advice.</Text><View style={s.phaseCard}>{coachMessages.map((item, index) => <View key={`${item.from}-${index}`} style={[s.reasonCard, item.from === 'you' && s.planChoiceSelected]}><Text style={s.metaText}>{item.from === 'you' ? 'YOU' : 'BENCHLESS COACH PREVIEW'}</Text><Text style={s.optionBody}>{item.text}</Text></View>)}<Text style={s.helperNote}>This preview uses a fixed response. It does not provide medical guidance.</Text></View><TextInput value={coachPrompt} onChangeText={setCoachPrompt} placeholder="Ask about your plan" placeholderTextColor={c.dim} accessibilityLabel="Message your coach" style={s.searchField}/><Button label="Send question" disabled={!coachPrompt.trim()} onPress={() => { const prompt = coachPrompt.trim(); if (!prompt) return; setCoachMessages((items) => [...items, { from: 'you', text: prompt }, { from: 'coach', text: `I can explain the current plan: ${exercises.find((item) => item.status)?.reason ?? 'your plan follows your selected goal, equipment and schedule'}. Exercise safety and swaps come from the training rules, not this chat.` }]); setCoachPrompt(''); }}/></>;
    if (screen === 'customWorkout') return <><ScreenHeader title="New workout"/><Text style={s.pageTitle}>Build a session</Text><TextInput value={customWorkoutName} onChangeText={setCustomWorkoutName} placeholder="Workout name" placeholderTextColor={c.dim} accessibilityLabel="Workout name" style={s.searchField}/><SectionLabel>EXERCISES</SectionLabel>{customExercises.map((name) => <PageRow key={name} title={name} detail="3 sets · 10 reps" onPress={() => setCustomExercises((items) => items.filter((x) => x !== name))} trailing="Remove"/>)}<SectionLabel>ADD AN EXERCISE</SectionLabel>{exercises.filter((item) => !customExercises.includes(item.name)).slice(0,3).map((item) => <PageRow key={item.id} title={item.name} detail={item.muscles} onPress={() => setCustomExercises((items) => [...items, item.name])} trailing="Add +"/>)}<View style={s.spacerFill}/><Button label="Save workout" disabled={!customWorkoutName.trim() || customExercises.length === 0} onPress={() => Alert.alert('Workout saved', `${customWorkoutName} is saved in this app preview.`)}/></>;
    if (screen === 'injuryHistory') return <><ScreenHeader title="Injury history"/><Text style={s.pageTitle}>Your injuries</Text><Text style={s.subTitle}>If areas overlap, the more restrictive training rule takes priority.</Text><SectionLabel>ACTIVE</SectionLabel>{injuryAreas.map((area, index) => <View key={area} style={s.phaseCard}><View style={s.rowBetween}><Text style={s.exerciseName}>{area}</Text><Tag accent>{`PHASE ${index === 0 ? phase : 1}`}</Tag></View><View style={s.progressTrack}><View style={[s.progressFill, { width: `${(index === 0 ? phase : 1) * 25}%` }]}/></View></View>)}{!injuryAreas.length && <EmptyState icon="⌁" title="No active injuries" detail="Add a supported area if you want it considered in your training plan." action="View injury guidance" onPress={() => setScreen('injury')}/>}<SectionLabel>ADD A SUPPORTED AREA</SectionLabel><View style={s.chipRow}>{['Knee','Lower back','Shoulder','Ankle'].filter((area) => !injuryAreas.includes(area)).map((area) => <Chip key={area} title={area} selected={false} onPress={() => { setInjuryAreas((items) => [...items, area]); setInjuryActive(true); }}/>)}</View><Text style={s.helperNote}>Adding an area here records it in this preview. A rules service is required before it can change your plan.</Text></>;
    if (screen === 'membership') return <><ScreenHeader title="Membership"/><Text style={s.pageTitle}>Your membership</Text><View style={s.trialCard}><View style={s.rowBetween}><Text style={s.limeText}>{'MEMBERSHIP PREVIEW'}</Text><Text style={s.limeText}>{'Not connected'}</Text></View><Text style={s.metaText}>{'Membership and billing are not connected. No trial has started and no payment is being taken.'}</Text></View><SectionLabel>KEEP TRAINING</SectionLabel><View style={s.bulletList}>{['A plan adapted around your selected areas','Session check-ins that shape your next workout','Workout history and personal records'].map((item) => <Text key={item} style={s.bulletText}>✓  {item}</Text>)}</View>{(['Annual','Monthly'] as const).map((plan) => <Pressable key={plan} onPress={() => setMembershipChoice(plan)} style={[s.planChoice, membershipChoice === plan && s.planChoiceSelected]}><View style={{ flex: 1, gap: 3 }}><Text style={s.exerciseName}>{plan} · {plan === 'Annual' ? '$39.99 / year' : '$7.99 / month'}</Text><Text style={s.metaText}>{plan === 'Annual' ? 'About $3.33 / month, billed yearly.' : 'Cancel any time.'}</Text></View><View style={[s.radio, membershipChoice === plan && s.radioSelected]}>{membershipChoice === plan ? <Text style={s.radioTick}>✓</Text> : null}</View></Pressable>)}<Button label="Review subscription options" onPress={() => Alert.alert('Purchases not connected', 'Plan selection is saved for this preview. Store billing will be connected with the backend.')}/><Text style={s.helperNote}>Restore purchases and store management will be available after billing is connected.</Text></>;
    if (screen === 'trialEnding') return <><ScreenHeader title="Membership" right="Preview"/><View style={s.spacerSmall}/><Text style={s.pageTitle}>Your trial is ending.</Text><Text style={s.subTitle}>Here’s what you’ve done so far.</Text><View style={s.metricGrid}><Metric label="SESSIONS" value={String(workoutsCompleted)}/><Metric label="ADAPTED" value={String(exercises.filter((item) => item.status).length)}/><Metric label="LATEST PAIN" value={painHistory.length ? `${painHistory.at(-1)} / 5` : '—'}/></View><PlanChoiceCards/><View style={s.spacerFill}/><Button label="Review membership" onPress={() => setScreen('membership')}/><Button label="Remind me later" secondary onPress={backToToday}/><Text style={s.helperNote}>This is a preview. Trial reminders and billing aren’t connected yet.</Text></>;
    if (screen === 'locked') return <><ScreenHeader title="Today" right="Preview"/><View style={s.statusBadge}><Text style={s.warningTitle}>TRIAL ENDED · PREVIEW</Text></View><View style={s.lockCard}><View style={s.emptyIcon}><Text style={s.emptyIconText}>⌑</Text></View><Text style={s.emptyTitle}>Your trial has ended</Text><Text style={s.emptyBody}>Review membership options to continue training. Your saved history and safety guidance stay available.</Text><Button label="Review membership" onPress={() => setScreen('membership')}/></View><SectionLabel>STILL AVAILABLE</SectionLabel><PageRow title="View your history" detail="Sessions and saved check-ins" onPress={() => { setTab('Progress'); setScreen('history'); }}/><PageRow title="Safety guidance" onPress={() => setScreen('help')}/><PageRow title="Export my data" detail="Data export will be available when account services are connected" onPress={() => Alert.alert('Data export', 'Export is not connected yet. Your current preview data is stored only in this app session.')}/></>;
    if (screen === 'privacy') return <><ScreenHeader title="Privacy"/><Text style={s.pageTitle}>Privacy & data</Text><View style={s.phaseCard}><Text style={s.phaseTitle}>Your health information stays private.</Text><Text style={s.metaText}>In this prototype, training and injury details stay in the app session. Connected account storage is not enabled.</Text></View><SectionLabel>SHARING</SectionLabel><ToggleRow title="Product analytics" detail="Helps us improve the app" value={privacyAnalytics} onPress={() => setPrivacyAnalytics((x) => !x)}/><ToggleRow title="Crash reports" detail="Helps us fix problems" value={privacyCrashReports} onPress={() => setPrivacyCrashReports((x) => !x)}/><SectionLabel>YOUR DATA</SectionLabel><PageRow title="Export my data" detail="Account export is not connected in this preview" onPress={() => Alert.alert('Export not available', 'Data export will be connected with account services.')}/><Pressable onPress={() => Alert.alert('Delete preview data?', 'This clears only the current in-memory preview.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear preview', style: 'destructive', onPress: () => { setPainHistory([]); setSessionHistory([]); setWorkoutsCompleted(0); } }])} style={s.simpleRow}><Text style={s.dangerText}>Delete preview data</Text></Pressable><Text style={s.metaText}>Deleting connected account data will be available after account services are implemented.</Text></>;
    if (screen === 'help') {
      const questions = [{ title: 'How does my plan adapt?', body: 'Your selected body areas, exercise check-ins and pain scores guide the training adjustments shown in this prototype. They are coaching cues, not a diagnosis.' }, { title: 'What if my pain gets worse?', body: 'Stop the movement. For new, severe or worsening pain, swelling, instability, numbness or trouble bearing weight, seek advice from a qualified clinician before training.' }];
      return <><ScreenHeader title="Help"/><Text style={s.pageTitle}>Help & safety</Text><View style={s.warningCard}><Text style={s.warningTitle}>Coaching, not medical advice.</Text><Text style={s.optionBody}>Benchless AI doesn’t diagnose or treat injuries. If you’re hurt, see a qualified clinician.</Text></View><View style={s.phaseCard}><SectionLabel>GET CHECKED IF YOU HAVE</SectionLabel>{['Swelling or a change in shape','Trouble putting weight on it or moving normally','A joint that gives way or feels unstable','Numbness, tingling or pain spreading down a limb','Very severe pain'].map((item) => <Text key={item} style={s.bulletText}>•  {item}</Text>)}</View>{questions.map((item) => <Pressable key={item.title} onPress={() => setExpandedHelp(expandedHelp === item.title ? null : item.title)} style={s.simpleRow}><View style={{ flex: 1, gap: 6 }}><Text style={s.exerciseName}>{item.title}</Text>{expandedHelp === item.title ? <Text style={s.metaText}>{item.body}</Text> : null}</View><Text style={s.chevron}>{expandedHelp === item.title ? '−' : '›'}</Text></Pressable>)}<View style={s.spacerFill}/><Button label="Contact support" secondary onPress={() => Alert.alert('Support', 'Support contact details will be added when the service is configured.')}/><Text style={[s.metaText, { textAlign: 'center' }]}>Benchless AI · preview</Text></>;
    }
    if (screen === 'injury') return <><ScreenHeader title="Injury"/><View style={s.rowBetween}><Text style={s.pageTitle}>{injuryActive ? areaLabel : 'No active injury'}</Text>{injuryActive && <Tag accent>ACTIVE</Tag>}</View>{injuryActive ? <><Text style={s.subTitle}>Tracking your training response. This isn’t a medical assessment.</Text><View style={s.phaseCard}><SectionLabel>YOUR PHASE</SectionLabel>{['Protect','Controlled loading','Rebuild','Back to full training'].map((name, index) => <View key={name} style={s.phaseLineRow}><Text style={[s.exerciseName, phase === index + 1 && s.limeText]}>{phase > index + 1 ? '✓  ' : phase === index + 1 ? '◉  ' : '○  '}{name}</Text><Text style={s.metaText}>{phase > index + 1 ? 'Done' : phase === index + 1 ? 'Now' : index + 1 === phase + 1 ? 'Next' : ''}</Text></View>)}</View><View style={s.metricGrid}><Metric label="SETTLED DAYS" value={`${settledDays} of 3`}/><Metric label="PHASE SESSIONS" value={`${phaseSessions} of 4`}/></View><View style={s.metricWide}><View style={s.rowBetween}><Text style={s.sectionHeading}>PAIN · SAVED CHECK-INS</Text><Text style={s.limeText}>{painHistory.length ? `${painHistory[0]} → ${painHistory.at(-1)}` : '—'}</Text></View>{painHistory.length ? <PainChart values={painHistory} s={s}/> : <Text style={s.metaText}>Log a check-in to begin a trend.</Text>}</View><Button label="Log pain today" onPress={() => setScreen('logPain')}/><View style={s.twoActions}><Button label="Re-injured" secondary onPress={() => setScreen('reinjured')}/><Button label="Mark as healed" secondary onPress={() => setScreen('healed')}/></View></> : <><View style={s.emptyState}><Text style={s.emptyTitle}>No injury selected</Text><Text style={s.emptyBody}>Edit your training setup if you want to add a body area to your plan.</Text><Button label="Edit training setup" onPress={onEditSetup}/></View><Button label="Back to Today" secondary onPress={backToToday}/></>}</>;
    if (screen === 'logPain') return <><ScreenHeader title="Log pain"/><Text style={s.pageTitle}>How is your {areaLabel.toLowerCase()} today?</Text><Text style={s.subTitle}>A quick check keeps your plan matched to how you feel.</Text><SectionLabel>PAIN RIGHT NOW</SectionLabel><View style={s.painScale}>{[0,1,2,3,4,5].map((n) => <Pressable key={n} onPress={() => setPain(n)} accessibilityRole="radio" accessibilityState={{ selected: pain === n }} style={[s.painNumber, pain === n && s.painNumberSelected]}><Text style={[s.painNumberText, pain === n && s.painNumberTextSelected]}>{n}</Text></Pressable>)}</View><View style={s.rowBetween}><Text style={s.metaText}>None</Text><Text style={s.metaText}>Severe</Text></View><SectionLabel>ANY OF THESE TODAY?</SectionLabel>{['Swelling or a change in shape','The joint gives way or feels unstable','Numbness, tingling or spreading pain','Very severe pain'].map((item) => <ToggleRow key={item} title={item} value={!!redFlagAnswers[item]} onPress={() => setRedFlagAnswers((x) => ({ ...x, [item]: !x[item] }))}/ >)}<TextInput value={injuryNote} onChangeText={setInjuryNote} placeholder="Add a note (optional)" placeholderTextColor={c.dim} style={s.searchField}/>{Object.values(redFlagAnswers).some(Boolean) && <View style={s.warningCard}><Text style={s.warningTitle}>Pause training and get advice.</Text><Text style={s.optionBody}>If you have new, severe or worsening symptoms, speak with a qualified clinician before training.</Text></View>}<Button label="Save today’s pain" onPress={() => { setPainHistory((items) => [...items, pain]); setScreen('injury'); }}/></>;
    if (screen === 'reinjured') return <><ScreenHeader title="Injury"/><View style={s.statusBadge}><Text style={s.warningTitle}>SAFETY CHECK</Text></View><Text style={s.pageTitle}>Sorry to hear that.</Text><Text style={s.subTitle}>A new knock deserves a fresh look. Your current plan pauses until you review these questions.</Text><View style={s.phaseCard}>{['Swelling or a change in shape','Trouble putting weight on it','The joint gives way or feels unstable','Numbness or tingling','Very severe pain'].map((item) => <ToggleRow key={item} title={item} value={!!redFlagAnswers[item]} onPress={() => setRedFlagAnswers((x) => ({ ...x, [item]: !x[item] }))}/>)}</View><View style={s.warningCard}><Text style={s.warningTitle}>If any answer is yes</Text><Text style={s.optionBody}>Stop training and seek qualified clinical advice. This app can’t determine whether an injury is safe to train.</Text></View><View style={s.spacerFill}/><Button label="Save safety check" onPress={() => { setInjuryActive(true); setPhase(1); setPhaseSessions(0); setSettledDays(0); setPainHistory([]); setScreen('injury'); }}/><Button label="Cancel" secondary onPress={() => setScreen('injury')}/></>;
    if (screen === 'healed') {
      const ready = painHistory.slice(-3).length >= 3 && painHistory.slice(-3).every((score) => score <= 1) && phaseSessions >= 4 && phase >= 4;
      return <><ScreenHeader title="Injury"/><Text style={s.pageTitle}>Ready to move on?</Text><Text style={s.subTitle}>You know your body best. Here’s what your recent check-ins show.</Text><View style={s.phaseCard}>{[{ label: 'Pain at 0 or 1 for 3 check-ins', ok: painHistory.slice(-3).length >= 3 && painHistory.slice(-3).every((score) => score <= 1) }, { label: '4 sessions in this phase', ok: phaseSessions >= 4 }, { label: 'Reached the final training phase', ok: phase >= 4 }].map((item) => <View key={item.label} style={s.phaseLineRow}><Text style={s.exerciseName}>{item.ok ? '✓' : '○'}  {item.label}</Text></View>)}</View><View style={s.phaseCard}><Text style={s.exerciseName}>You can return to your standard plan when you feel ready.</Text><Text style={s.metaText}>If symptoms return, pause and seek qualified guidance. Before maximal efforts, check with a coach or clinician.</Text></View><View style={s.spacerFill}/><Button label="Mark as healed" disabled={!ready} onPress={() => { setInjuryActive(false); setScreen('injury'); }}/><Button label="Not yet" secondary onPress={() => setScreen('injury')}/></>;
    }
    if (screen === 'move') return <><ScreenHeader title="Plan"/><Text style={s.pageTitle}>{moveSourceLabel} · {moveWorkoutName}</Text><Text style={s.subTitle}>Life got in the way? Move the session to another day or skip it.</Text><SectionLabel>MOVE TO</SectionLabel><View style={s.chipRow}>{week.filter((day) => !day.isToday).map((day) => <Chip key={day.name} title={`${day.name} ${day.number}`} selected={moveTarget === `${day.name} ${day.number}`} onPress={() => setMoveTarget(`${day.name} ${day.number}`)}/>)}</View><Text style={s.metaText}>We’ll keep a recovery day between lower-body sessions.</Text><View style={s.spacerFill}/><Button label="Move session" disabled={!moveTarget} onPress={() => { setMovedSessions((x) => ({ ...x, [moveSourceDay]: moveTarget })); setScreen('tab'); setTab('Plan'); }}/><Button label="Skip this session" secondary onPress={() => { setSkippedDays((items) => items.includes(moveSourceDay) ? items : [...items, moveSourceDay]); setScreen('tab'); setTab('Plan'); }}/><Text style={[s.helperNote, { textAlign: 'center' }]}>Skipped sessions don’t count against you. Your week stays yours.</Text></>;
    if (screen === 'filters') return <><ScreenHeader title="Filters" right="Reset" onBack={() => setScreen('tab')}/><Text style={s.pageTitle}>Filters</Text><SectionLabel>MUSCLE</SectionLabel><View style={s.chipRow}>{['Quads','Hamstrings','Glutes','Chest','Back','Shoulders','Core'].map((name) => <Chip key={name} title={name} selected={libraryMuscles.includes(name)} onPress={() => setLibraryMuscles((items) => items.includes(name) ? items.filter((x) => x !== name) : [...items, name])}/>)}</View><SectionLabel>EQUIPMENT</SectionLabel><View style={s.chipRow}>{['Machine','Dumbbells','Barbell','Bodyweight'].map((name) => <Chip key={name} title={name} selected={libraryEquipment.includes(name)} onPress={() => setLibraryEquipment((items) => items.includes(name) ? items.filter((x) => x !== name) : [...items, name])}/>)}</View><ToggleRow title="Only my equipment" value={libraryEquipment.length > 0} onPress={() => setLibraryEquipment(libraryEquipment.length ? [] : onboarding.equipment.includes('Bodyweight') ? ['Bodyweight'] : ['Dumbbells'])}/><ToggleRow title={`Safe for my ${areaLabel.toLowerCase()}`} value={safeOnly} onPress={() => setSafeOnly((x) => !x)}/><ToggleRow title="Show locked exercises" value={showLocked} onPress={() => setShowLocked((x) => !x)}/><View style={s.spacerFill}/><Button label="Show matching exercises" onPress={() => setScreen('tab')}/><Button label="Reset filters" secondary onPress={() => { setLibraryMuscles([]); setLibraryEquipment([]); setSafeOnly(false); setShowLocked(false); }}/></>;
    const appearance: ColorScheme = darkMode ? 'dark' : 'light';
    if (screen === 'offline') return <><ScreenHeader title="Connection"/><AppStateView kind="offline" appearance={appearance} title="You’re offline" message="This preview is stored on this device. Remote plan loading and sync are not connected." actionLabel="Try again" onAction={retryPlanLoad} secondaryActionLabel="Back to Today" onSecondaryAction={backToToday}/></>;
    if (screen === 'loading') return <><ScreenHeader title="Today"/><AppStateView kind="loading" appearance={appearance} title="Loading your plan" message="Checking the plan available in this preview…" accessibilityLabel="Loading plan"/></>;
    if (screen === 'error') return <AppStateView kind="error" appearance={appearance} title="Couldn’t load the plan" message="Remote plan loading is not connected yet. Your onboarding setup remains on this device." actionLabel="Try again" onAction={retryPlanLoad} secondaryActionLabel="Back to Today" onSecondaryAction={backToToday}/>;
    if (screen === 'history') return <><ScreenHeader title="History"/><Text style={s.pageTitle}>Session history</Text>{sessionHistory.length ? sessionHistory.map((item, index) => <PageRow key={`${item.date}-${index}`} title={item.title} detail={`${item.date} · ${item.minutes} min${item.feel ? ` · ${item.feel}` : ''}`} onPress={() => { setDetailSessionIndex(index); setScreen('sessionDetail'); }}/>) : <EmptyState icon="◷" title="No sessions yet" detail="Completed workouts will appear here." action="Go to Today" onPress={backToToday}/>}</>;
    if (screen === 'sessionDetail') { const item = sessionHistory[detailSessionIndex]; return <><ScreenHeader title={item?.date ?? 'Session'}/><Text style={s.pageTitle}>{item?.title ?? 'Workout'}</Text><View style={s.metricGrid}><Metric label="TIME" value={`${item?.minutes ?? 0} min`}/><Metric label="SETS" value={String(item?.sets ?? 0)}/></View>{item?.feel && <View style={s.phaseCard}><Text style={s.exerciseName}>Felt {item.feel} · pain {item.pain ?? '—'}</Text><Text style={s.metaText}>Saved check-in</Text></View>}<SectionLabel>EXERCISES</SectionLabel>{item?.exercises.length ? item.exercises.map((exercise) => <PageRow key={exercise.name} title={exercise.name} detail={exercise.detail} onPress={() => { const index = exercises.findIndex((x) => x.name === exercise.name); if (index >= 0) openExercise(index); }}/>) : <Text style={s.metaText}>No set details were logged for this session.</Text>}</>; }
    if (screen === 'records') return <><ScreenHeader title="Records"/><Text style={s.pageTitle}>Personal records</Text><Text style={s.subTitle}>Your best logged sets, kept up to date as you train.</Text>{personalRecords.length ? personalRecords.map((item) => <View key={item.name} style={s.simpleRow}><Text style={s.limeText}>♜</Text><View style={{ flex: 1 }}><Text style={s.exerciseName}>{item.name}</Text><Text style={s.metaText}>{item.date}</Text></View><Text style={s.exerciseName}>{item.weight ? `${item.weight} kg × ${item.reps}` : `${item.reps} sec`}</Text></View>) : <EmptyState icon="♜" title="No records yet" detail="Complete a workout and your best logged sets will show here." action="Go to Today" onPress={backToToday}/>}</>;
    if (screen === 'painTrend') return <><ScreenHeader title="Pain trend"/><Text style={s.pageTitle}>{areaLabel}</Text><Text style={s.subTitle}>How your saved pain scores have changed.</Text><View style={s.rangePills}>{(['Week','Month','All time'] as const).map((range) => <Chip key={range} title={range} selected={progressRange === range} onPress={() => setProgressRange(range)}/>)}</View>{painHistory.length ? <View style={s.metricWide}><View style={s.rowBetween}><Text style={s.sectionHeading}>PAIN, 0 TO 5</Text><Text style={s.limeText}>{painHistory[0]} → {painHistory.at(-1)}</Text></View><PainChart values={painHistory} s={s}/><View style={s.rowBetween}><Text style={s.metaText}>Earlier</Text><Text style={s.metaText}>Latest</Text></View></View> : <EmptyState icon="⌁" title="No check-ins yet" detail="Log how you feel to start seeing a trend." action="Log pain" onPress={() => setScreen('logPain')}/>}<SectionLabel>RECENT CHECK-INS</SectionLabel>{painHistory.slice(-3).reverse().map((value, index) => <PageRow key={`${value}-${index}`} title={index === 0 ? 'Most recent' : `Check-in ${index + 1}`} detail={`Pain ${value} of 5`} onPress={() => setScreen('injury')} trailing=""/>)}</>;
    return null;
  }
  function PlanChoiceCards() {
    return <>{(['Annual','Monthly'] as const).map((plan) => <Pressable key={plan} onPress={() => setMembershipChoice(plan)} style={[s.planChoice, membershipChoice === plan && s.planChoiceSelected]}><View style={{ flex: 1, gap: 3 }}><Text style={s.exerciseName}>{plan} · {plan === 'Annual' ? '$39.99 / year' : '$7.99 / month'}</Text><Text style={s.metaText}>{plan === 'Annual' ? 'About $3.33 / month, billed yearly.' : 'Cancel any time.'}</Text></View><View style={[s.radio, membershipChoice === plan && s.radioSelected]}>{membershipChoice === plan ? <Text style={s.radioTick}>✓</Text> : null}</View></Pressable>)}</>;
  }

  function OverviewContent() {
    return <><Header title={now.toLocaleDateString('en-US', { weekday: 'long' })} right="TODAY"/><ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}>
      <View style={s.titleLine}><Text style={s.pageTitleSmall}>{workoutName}</Text><Tag accent>{hasChanges ? 'ADAPTED' : 'PLAN'}</Tag></View>
      <View style={s.tagRow}><Tag>◷ 40 min</Tag><Tag>{`${exercises.length} exercises`}</Tag>{injuryActive && <Tag>{`Phase ${phase}`}</Tag>}</View>
      {hasChanges && <Pressable onPress={() => setScreen('why')} style={s.changeBanner}><Text style={s.swapIcon}>⇄</Text><View style={s.exerciseCopy}><Text style={s.exerciseName}>2 changes for your {areaLabel.toLowerCase()}</Text><Text style={s.metaText}>Tap to see why</Text></View><Text style={s.chevron}>›</Text></Pressable>}
      <View style={s.exerciseList}>{exercises.map((item, index) => <ExerciseRow key={item.id} item={item} index={index} onPress={() => openExercise(index)}/>)}</View>
      <Text style={s.helperNote}>Review each movement. Pause and stop if you feel new or worsening pain.</Text>
      <Button label="Start workout" onPress={startWorkout}/>
      <View style={{ height: 20 }}/>
    </ScrollView></>;
  }

  function WhySheet() {
    return <View style={s.modalScrim}><Pressable onPress={() => setScreen('overview')} style={StyleSheet.absoluteFill}/><View style={s.bottomSheet}><View style={s.sheetHandle}/><Text style={s.sheetTitle}>What changed, and why</Text><Text style={s.metaText}>Phase {phase} · {phaseLabel()} · {areaLabel}</Text>
      <View style={s.reasonCard}><View style={s.outInRow}><Tag>OUT</Tag><Text style={s.struckText}>Jump squats</Text></View><View style={s.outInRow}><Tag accent>IN</Tag><Text style={s.exerciseName}>Leg press, light</Text></View><Text style={s.metaText}>Swapped in for jump squats. Same muscles, much less load on your selected area.</Text></View>
      <View style={s.reasonCard}><View style={s.outInRow}><Tag accent>LIGHTER</Tag><Text style={s.exerciseName}>Back squat</Text></View><Text style={s.metaText}>Lighter weight and a slower lowering phase. Same pattern, less strain on your selected area.</Text></View>
      <Text style={s.helperNote}>If your body starts to hurt more, stop and tell us. Benchless AI provides coaching, not medical advice.</Text><Button label="Got it" onPress={() => setScreen('overview')}/>
    </View></View>;
  }

  function ExerciseContent() {
    return <><Header title={`Exercise ${selectedExercise + 1} of ${exercises.length}`} right=""/><ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}>
      <View style={s.detailImageWrap}><Image source={previewExercise.image} style={s.detailImage} resizeMode="cover"/><View style={s.demoLabel}><Text style={s.demoLabelText}>MOVEMENT GUIDE</Text></View></View>
      <Text style={s.pageTitleSmall}>{previewExercise.name}</Text><View style={s.tagRow}><Tag>{previewExercise.muscles}</Tag><Tag>Movement guide</Tag>{injuryActive && <Tag>Adapted</Tag>}</View>
      {previewExercise.reason ? <View style={s.reasonCard}><Text style={s.sectionEyebrow}>WHY THIS ONE</Text><Text style={s.optionBody}>{previewExercise.reason}</Text></View> : null}
      <View style={s.detailStats}><View style={s.statCard}><Text style={s.sectionEyebrow}>TODAY</Text><Text style={s.exerciseName}>{previewExercise.sets} × {previewExercise.reps}</Text></View><View style={s.statCard}><Text style={s.sectionEyebrow}>REST</Text><Text style={s.exerciseName}>{previewExercise.rest} sec</Text></View></View>
      <View style={s.phaseCard}><Text style={s.sectionEyebrow}>FORM CUES</Text><Text style={s.optionBody}>Move with control and use a comfortable range. Keep your breathing steady. Stop if you feel new or worsening pain.</Text></View>
      <Button label="Start this exercise" onPress={beginExercise}/><Button label="Swap for another" secondary onPress={offerExerciseSwap}/>
    </ScrollView></>;
  }

  function ActiveContent() {
    const done = completedSets[currentExercise.id] ?? 0;
    const isWarmup = currentExercise.id === 'bike';
    const exerciseNumber = exercises.findIndex((item) => item.id === currentExercise.id) + 1;
    return <><View style={s.activeHeader}><Pressable onPress={() => Alert.alert('End workout?', 'Your completed sets will be included in the session summary.', [{ text: 'Keep going' }, { text: 'End workout', style: 'destructive', onPress: finishWorkout }])} style={s.iconButton}><Text style={s.iconButtonText}>×</Text></Pressable><Text style={s.headerTitle}>{workoutName}</Text><Pressable onPress={finishWorkout}><Text style={s.headerMeta}>Finish</Text></Pressable></View><ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}>
      <View style={s.progressTrack}><View style={[s.progressFill, { width: `${exerciseNumber / exercises.length * 100}%` }]}/></View>
      <View style={s.detailImageWrap}><Image source={currentExercise.image} style={s.detailImage} resizeMode="cover"/><View style={s.demoLabel}><Text style={s.demoLabelText}>MOVEMENT GUIDE</Text></View></View>
      <Text style={s.pageTitleSmall}>{currentExercise.name}</Text><Text style={s.metaText}>Exercise {exerciseNumber} of {exercises.length} · {isWarmup ? 'Warm-up' : `${done + 1} of ${currentExercise.sets} sets`}</Text>
      {!isWarmup && <View style={s.setRows}>{Array.from({ length: currentExercise.sets }, (_, i) => <View key={i} style={[s.setRow, i === done && s.setRowActive]}><Text style={s.setLabel}>Set {i + 1}</Text>{i < done ? <Text style={s.completedText}>{setLogs[currentExercise.id]?.[i]?.weight ?? currentExercise.weight} kg × {setLogs[currentExercise.id]?.[i]?.reps ?? currentExercise.reps} ✓</Text> : i === done ? <View style={s.adjustRow}><Pressable onPress={() => setWeight((value) => Math.max(0, value - 2.5))} style={s.adjustButton}><Text style={s.adjustText}>−</Text></Pressable><Text style={s.metricValue}>{weight} kg</Text><Pressable onPress={() => setWeight((value) => value + 2.5)} style={s.adjustButton}><Text style={s.adjustText}>+</Text></Pressable><Pressable onPress={() => setReps((value) => Math.max(1, value - 1))} style={s.adjustButton}><Text style={s.adjustText}>−</Text></Pressable><Text style={s.metricValue}>{reps} reps</Text><Pressable onPress={() => setReps((value) => value + 1)} style={s.adjustButton}><Text style={s.adjustText}>+</Text></Pressable></View> : <Text style={s.metaText}>{currentExercise.weight} kg × {currentExercise.reps}</Text>}</View>)}</View>}
      {restSeconds !== null && <View style={s.restBar}><Text style={s.metaText}>REST</Text><Text style={s.restTime}>{`0:${String(restSeconds).padStart(2, '0')}`}</Text><View style={s.restTrack}><View style={[s.progressFill, { width: `${Math.min(100, (1-restSeconds/currentExercise.rest)*100)}%` }]}/></View><Pressable onPress={() => { setRestSeconds(null); setRestSkipped(true); }}><Text style={s.limeText}>Skip</Text></Pressable></View>}
      {hurtPaused && <View style={s.warningCard}><Text style={s.warningTitle}>Workout paused</Text><Text style={s.optionBody}>Stop this movement. If pain is new, severe or worsening, seek advice from a qualified clinician before training.</Text></View>}
      <Pressable onPress={() => { setHurtPaused(true); setRestSeconds(null); }} style={s.hurtButton}><Text style={s.hurtText}>△  Something hurts</Text></Pressable>
      {hurtPaused ? <Button label="Finish and check in" onPress={finishWorkout}/> : <Button label={isWarmup ? 'Complete warm-up' : done + 1 >= currentExercise.sets ? activeExercise + 1 >= exercises.length - 1 ? 'Finish session' : 'Complete set' : 'Complete set'} disabled={restSeconds !== null} onPress={completeSet}/>}
      {restSkipped && <Text style={s.helperNote}>Rest skipped. Take the time you need before the next set.</Text>}
    </ScrollView></>;
  }

  function Metric({ label, value }: { label: string; value: string }) { return <View style={s.metricCard}><Text style={s.sectionEyebrow}>{label}</Text><Text style={s.metricLarge}>{value}</Text></View>; }
  function CompletionContent() {
    const mins = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
    const completedExerciseCount = Object.values(completedSets).filter((count) => count > 0).length;
    const totalSets = Object.values(completedSets).reduce((sum, count) => sum + count, 0);
    const adaptedCount = injuryActive ? exercises.filter((item) => item.status).length : 0;
    return <><Header title="Session complete" right="✓" onBack={backToToday}/><ScrollView contentContainerStyle={s.pageContent}><View style={s.successMark}><Text style={s.successCheck}>✓</Text></View><Text style={s.pageTitle}>Nice work.</Text><Text style={s.subTitle}>Your session has been added to your training history.</Text><View style={s.metricGrid}><Metric label="TIME" value={`${mins} min`}/><Metric label="EXERCISES" value={`${completedExerciseCount} of ${exercises.length}`}/><Metric label="SETS" value={String(totalSets)}/><Metric label="CHANGES" value={String(adaptedCount)}/></View><View style={s.reasonCard}><Text style={s.sectionEyebrow}>SESSION SUMMARY</Text><Text style={s.exerciseName}>{workoutName} · {totalSets} sets recorded</Text><Text style={s.metaText}>Your completed sets and session time are saved for this visit.</Text></View><View style={{ height: 12 }}/>{onboarding.sessionCheckIns ? <><Button label={`Tell us how your ${injuryActive ? areaLabel.toLowerCase() : 'body'} felt`} onPress={() => setScreen('checkin')}/><Button label="Skip for now" secondary onPress={backToToday}/></> : <Button label="Back to Today" onPress={backToToday}/>}</ScrollView></>;
  }

  function CheckInContent() {
    const feels: { title: Feel; detail: string }[] = [
      { title: 'Perfect', detail: 'No pain, felt controlled.' }, { title: 'A bit much', detail: 'Some discomfort. Ease it back.' },
      { title: 'Too much', detail: 'It hurt. Change what I did.' }, { title: 'Too easy', detail: 'I could do more.' },
    ];
    return <><Header title="Check-in" right=""/><ScrollView contentContainerStyle={s.pageContent}><Text style={s.pageTitleSmall}>How did your {injuryActive ? areaLabel.toLowerCase() : 'body'} feel?</Text><Text style={s.subTitle}>Your answer shapes your next session.</Text><View style={s.optionsList}>{feels.map((item) => <Pressable key={item.title} onPress={() => setFeel(item.title)} style={[s.feelCard, feel === item.title && s.feelCardSelected]}><View style={s.exerciseCopy}><Text style={s.exerciseName}>{item.title}</Text><Text style={s.metaText}>{item.detail}</Text></View><View style={[s.radio, feel === item.title && s.radioSelected]}>{feel === item.title && <Text style={s.radioTick}>✓</Text>}</View></Pressable>)}</View>
      <Text style={s.sectionEyebrow}>PAIN RIGHT NOW</Text><View style={s.painScale}>{[0,1,2,3,4,5].map((n) => <Pressable key={n} onPress={() => setPain(n)} style={[s.painNumber, pain === n && s.painNumberSelected]}><Text style={[s.painNumberText, pain === n && s.painNumberTextSelected]}>{n}</Text></Pressable>)}</View><View style={s.cardTopRow}><Text style={s.metaText}>None</Text><Text style={s.metaText}>Severe</Text></View>
      {feel === 'Too much' && <View style={s.warningCard}><Text style={s.warningTitle}>Which exercise felt like too much?</Text>{exercises.map((item) => <Pressable key={item.id} onPress={() => setSelectedTooMuchExercise(item.id)} style={s.outInRow}><View style={[s.radio, selectedTooMuchExercise === item.id && s.radioSelected]}>{selectedTooMuchExercise === item.id && <Text style={s.radioTick}>✓</Text>}</View><Text style={s.optionBody}>{item.name}</Text></Pressable>)}<Text style={s.metaText}>This helps us review the next session.</Text></View>}
      <Text style={s.helperNote}>Coaching, not medical advice. Stop and seek qualified guidance if pain is new, severe or worsening.</Text><Button label="Save check-in" onPress={saveCheckIn}/></ScrollView></>;
  }
  function ResultContent() {
    const result = getResult();
    const progressWidth = `${Math.round((result.sessions / 4) * 100)}%` as `${number}%`;
    const settledWidth = `${Math.round((result.settled / 3) * 100)}%` as `${number}%`;
    return <><Header title="Check-in" right=""/><ScrollView contentContainerStyle={s.pageContent}><View style={s.successMark}><Text style={s.successCheck}>✓</Text></View><Text style={s.pageTitleSmall}>{result.title}</Text><Text style={s.subTitle}>Pain {pain} today. Here’s your current status.</Text><View style={s.phaseCard}><View style={s.cardTopRow}><Tag accent>{`PHASE ${result.phase} OF 4`}</Tag><Text style={s.metaText}>{result.status}</Text></View><Text style={s.phaseTitle}>{phaseLabel(result.phase)}</Text><View style={s.phaseLineRow}><Text style={s.metaText}>Settled days</Text><Text style={s.limeText}>{result.settled} of 3</Text></View><View style={s.progressTrack}><View style={[s.progressFill,{width:settledWidth}]}/></View><View style={s.phaseLineRow}><Text style={s.metaText}>Phase sessions</Text><Text style={s.limeText}>{result.sessions} of 4</Text></View><View style={s.progressTrack}><View style={[s.progressFill,{width:progressWidth}]}/></View></View><View style={s.reasonCard}><Text style={s.exerciseName}>{result.status === 'ADVANCE' ? 'Your plan moves to the next phase.' : result.status === 'STEP BACK' ? 'Your next session will be reviewed.' : 'Your current phase stays in place.'}</Text><Text style={s.metaText}>{result.body}</Text></View><View style={s.upNext}><Text style={s.sectionEyebrow}>UP NEXT · {upcomingWorkoutDay.toUpperCase()}</Text><Text style={s.exerciseName}>{upcomingWorkoutName} · {injuryActive ? 'check-in aware' : 'scheduled session'}</Text></View><Button label="Back to Today" onPress={backToToday}/></ScrollView></>;
  }

  function MainTabScreen() {
    return <><ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}>{tab === 'Today' ? <TodayContent/> : <TabContent/>}</ScrollView><BottomTabs/></>;
  }

  function SecondaryPage() {
    return <ScrollView contentContainerStyle={s.pageContent} showsVerticalScrollIndicator={false}><DetailScreen/></ScrollView>;
  }

  return <SafeAreaView style={s.safe} edges={['top','bottom']}><StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={c.bg}/>
    {screen === 'today' || screen === 'tab' ? <MainTabScreen/> : null}
    {screen === 'overview' ? <>{OverviewContent()}</> : null}
    {screen === 'why' ? <><OverviewContent/><WhySheet/></> : null}
    {screen === 'exercise' ? <ExerciseContent/> : null}
    {screen === 'active' ? <ActiveContent/> : null}
    {screen === 'complete' ? <CompletionContent/> : null}
    {screen === 'checkin' ? <CheckInContent/> : null}
    {screen === 'result' ? <ResultContent/> : null}
    {screen !== 'today' && screen !== 'tab' && screen !== 'overview' && screen !== 'why' && screen !== 'exercise' && screen !== 'active' && screen !== 'complete' && screen !== 'checkin' && screen !== 'result' ? <SecondaryPage/> : null}
  </SafeAreaView>;
}

const darkColors = { bg: benchlessColors.dark.background, surface: benchlessColors.dark.surface, raised: benchlessColors.dark.surfaceRaised, selected: benchlessColors.dark.surfaceSelected, lime: benchlessColors.dark.accent, limeDark: benchlessColors.dark.accentStrong, text: benchlessColors.dark.text, muted: benchlessColors.dark.secondaryText, dim: benchlessColors.dark.tertiaryText, border: benchlessColors.dark.border, red: benchlessColors.dark.danger, redBg: benchlessColors.dark.dangerSurface, scrim: 'rgba(0,0,0,0.62)' };
const lightColors = { bg: benchlessColors.light.background, surface: benchlessColors.light.surface, raised: benchlessColors.light.surfaceRaised, selected: benchlessColors.light.surfaceSelected, lime: benchlessColors.light.accent, limeDark: benchlessColors.light.accentStrong, text: benchlessColors.light.text, muted: benchlessColors.light.secondaryText, dim: benchlessColors.light.tertiaryText, border: benchlessColors.light.border, red: benchlessColors.light.danger, redBg: benchlessColors.light.dangerSurface, scrim: 'rgba(0,0,0,0.42)' };
type Palette = { [Key in keyof typeof darkColors]: string };

function styles(c: Palette) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg }, header: { minHeight: designTokens.control.minimum, paddingHorizontal: designTokens.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, activeHeader: { minHeight: designTokens.control.minimum, paddingHorizontal: designTokens.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerTitle: { color: c.text, fontSize: designTokens.type.bodyCompact, fontWeight: '600' }, headerRight: { minWidth: 36, minHeight: designTokens.control.minimum, justifyContent: 'center', alignItems: 'flex-end' }, headerMeta: { color: c.lime, fontSize: designTokens.type.caption, fontWeight: '700' }, iconButton: { width: designTokens.control.minimum, height: designTokens.control.minimum, alignItems: 'center', justifyContent: 'center', borderRadius: designTokens.radius.control, backgroundColor: c.surface }, iconButtonText: { color: c.text, fontSize: 25, lineHeight: 28 }, todayDateRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dateText: { color: c.muted, fontSize: designTokens.type.caption }, pageTitle: { color: c.text, fontSize: designTokens.type.title, lineHeight: designTokens.lineHeight.title, fontWeight: '700', letterSpacing: -0.7, marginTop: 1 }, pageTitleSmall: { color: c.text, fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.5 }, subTitle: { color: c.muted, fontSize: designTokens.type.bodyCompact, lineHeight: designTokens.lineHeight.bodyCompact, marginTop: 3, marginBottom: 4 }, pageContent: { flexGrow: 1, paddingHorizontal: designTokens.spacing.lg, paddingTop: 4, paddingBottom: designTokens.spacing.md, gap: designTokens.spacing.xs },
  weekRow: { flexDirection: 'row', gap: 5, marginTop: 8 }, weekDay: { flex: 1, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', gap: 2 }, weekDayActive: { borderColor: c.limeDark, backgroundColor: c.selected }, weekDayName: { color: c.muted, fontSize: 11 }, weekDayNumber: { color: c.text, fontSize: 12, fontWeight: '700' }, dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'transparent' }, dayDotActive: { backgroundColor: c.lime },
  phaseCard: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 17, padding: 14, gap: 7 }, cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, phaseTitle: { color: c.text, fontSize: 15, fontWeight: '700' }, phaseLineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, phaseDots: { flexDirection: 'row', gap: 4 }, dotOn: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.lime }, dotOff: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.border },
  tag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: c.raised }, tagAccent: { backgroundColor: c.lime }, tagText: { color: c.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.2 }, tagAccentText: { color: '#172015' }, limeText: { color: c.lime, fontSize: 12, fontWeight: '700' }, primaryText: { color: c.text }, metaText: { color: c.muted, fontSize: 13, lineHeight: 18 }, helperNote: { color: c.dim, fontSize: 12, lineHeight: 17, marginTop: 1 },
  heroCard: { minHeight: 202, borderRadius: 19, overflow: 'hidden', backgroundColor: c.surface, justifyContent: 'flex-end' }, heroImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' }, heroContent: { padding: 14, gap: 6 }, heroTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' }, heroMeta: { color: '#E2E6DF', fontSize: 11 }, heroActionRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 }, heroButton: { backgroundColor: c.lime, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 11 }, heroButtonText: { color: '#172015', fontSize: 12, fontWeight: '800' }, heroLink: { backgroundColor: 'rgba(12,17,16,0.72)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11 }, heroLinkText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' }, inlineWhy: { minHeight: 51, borderRadius: 14, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, swapIcon: { color: c.lime, fontSize: 19, fontWeight: '700' }, exerciseCopy: { flex: 1 }, exerciseName: { color: c.text, fontSize: 12, fontWeight: '700' }, chevron: { color: c.muted, fontSize: 23 }, upNext: { borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, padding: 13, gap: 3 }, sectionEyebrow: { color: c.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tabs: { minHeight: designTokens.control.tabBar, borderTopWidth: 1, borderColor: c.border, backgroundColor: c.bg, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 3 }, tabItem: { flex: 1, minHeight: designTokens.control.minimum, alignItems: 'center', justifyContent: 'center', gap: 1 }, tabIcon: { color: c.dim, fontSize: 17 }, tabLabel: { color: c.dim, fontSize: designTokens.type.caption }, tabActive: { color: c.lime }, simpleRow: { minHeight: 68, padding: designTokens.spacing.md, backgroundColor: c.surface, borderRadius: designTokens.radius.control, borderWidth: 1, borderColor: c.border, gap: 5 },
  planScreen: { flexGrow: 1, justifyContent: 'space-between', gap: 20 }, planMain: { gap: 8 }, planRows: { gap: 9, marginTop: 8 }, planRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, planRowName: { color: c.text, fontSize: 16, fontWeight: '600' }, planRowAction: { color: c.lime, fontSize: 12, fontWeight: '600' }, planNote: { borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, padding: 16, gap: 8 }, planNoteTitle: { color: c.text, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  profileScreen: { flexGrow: 1, justifyContent: 'space-between', gap: 20 }, profileDetails: { gap: 10 }, profileSettings: { gap: 9 }, profileActions: { gap: 9, paddingBottom: 4 }, progressScreen: { flexGrow: 1, justifyContent: 'space-between', gap: 20 }, progressMain: { gap: 8 }, progressFooter: { gap: 10 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 9 }, tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, changeBanner: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, exerciseList: { gap: 8 }, exerciseRow: { minHeight: 62, borderRadius: 14, backgroundColor: c.surface, padding: 9, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 10 }, exerciseThumb: { width: 44, height: 44, borderRadius: 10, backgroundColor: c.raised },
  button: { minHeight: 52, borderRadius: 13, backgroundColor: c.lime, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 2 }, buttonText: { color: '#172015', fontSize: 15, fontWeight: '700' }, secondaryButton: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, secondaryButtonText: { color: c.text }, disabled: { opacity: 0.45 },
  modalScrim: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: c.scrim, zIndex: 5 }, bottomSheet: { maxHeight: '78%', backgroundColor: c.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 19, paddingTop: 10, paddingBottom: 21, gap: 11 }, sheetHandle: { alignSelf: 'center', width: 37, height: 4, backgroundColor: c.border, borderRadius: 3, marginBottom: 4 }, sheetTitle: { color: c.text, fontSize: 19, fontWeight: '700' }, reasonCard: { borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 12, gap: 8 }, outInRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, struckText: { color: c.dim, fontSize: 11, textDecorationLine: 'line-through' }, optionBody: { color: c.muted, fontSize: 12, lineHeight: 18 },
  detailImageWrap: { width: '100%', height: 235, borderRadius: 17, overflow: 'hidden', backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' }, detailImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, videoPlay: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }, videoPlayText: { color: '#FFFFFF', fontSize: 18, marginLeft: 3 }, demoLabel: { position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(12,17,16,0.72)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, demoLabelText: { color: c.lime, fontSize: 11, fontWeight: '800' }, detailStats: { flexDirection: 'row', gap: 8 }, statCard: { flex: 1, padding: 12, borderRadius: 13, backgroundColor: c.surface, gap: 6 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metricCard: { width: '48%', minHeight: 76, padding: 12, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 7 }, metricLarge: { color: c.text, fontSize: 20, fontWeight: '700' }, successMark: { alignSelf: 'center', width: 53, height: 53, borderRadius: 27, borderWidth: 1, borderColor: c.limeDark, alignItems: 'center', justifyContent: 'center', marginTop: 4, backgroundColor: c.bg }, successCheck: { color: c.lime, fontSize: 28 }, completedCheck: { color: c.lime, fontSize: 17, fontWeight: '800' },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: c.lime, borderRadius: 2 }, setRows: { gap: 7, marginTop: 3 }, setRow: { minHeight: 44, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, setRowActive: { borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected }, setLabel: { color: c.muted, fontSize: 12, width: 44 }, adjustRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 }, adjustButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: c.raised, alignItems: 'center', justifyContent: 'center' }, adjustText: { color: c.text, fontSize: 16 }, metricValue: { color: c.text, fontSize: 12, fontWeight: '700' }, completedText: { color: c.lime, fontSize: 12, fontWeight: '700' }, restBar: { minHeight: 45, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 9 }, restTime: { color: c.text, fontSize: 16, fontWeight: '700' }, restTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border, overflow: 'hidden' }, hurtButton: { minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: c.limeDark, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, hurtText: { color: c.lime, fontSize: 13, fontWeight: '700' }, warningCard: { borderRadius: 14, borderWidth: 1, borderColor: c.red, backgroundColor: c.redBg, padding: 12, gap: 7 }, warningTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  optionsList: { gap: 8, marginTop: 8 }, feelCard: { minHeight: 57, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 10 }, feelCardSelected: { borderColor: c.limeDark, backgroundColor: c.selected }, radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, radioSelected: { backgroundColor: c.lime, borderColor: c.lime }, radioTick: { color: '#172015', fontSize: 12, fontWeight: '900' }, painScale: { flexDirection: 'row', gap: 6, marginTop: 3 }, painNumber: { flex: 1, height: 40, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, painNumberSelected: { backgroundColor: c.lime, borderColor: c.lime }, painNumberText: { color: c.text, fontSize: 13, fontWeight: '700' }, painNumberTextSelected: { color: '#172015' },
  pageTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, weekNav: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, planDayRow: { minHeight: 66, padding: 11, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }, planDayToday: { borderColor: c.limeDark, backgroundColor: c.selected }, planDate: { width: 34, alignItems: 'center', gap: 1 }, planDateNumber: { color: c.text, fontSize: 16, fontWeight: '700' }, rowMuted: { opacity: 0.6 }, rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, twoActions: { flexDirection: 'row', gap: 8 }, sectionHeading: { color: c.muted, fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 0.8 }, chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 2 }, rangePills: { flexDirection: 'row', gap: 5, padding: 4, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, filterChip: { minHeight: 40, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' }, filterChipSelected: { backgroundColor: c.selected, borderColor: c.limeDark }, filterChipText: { color: c.muted, fontSize: 13, fontWeight: '600' }, filterChipTextSelected: { color: c.text }, searchField: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 14, color: c.text, fontSize: 15 }, inlineAction: { minWidth: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, switchTrack: { width: 49, height: 30, padding: 3, borderRadius: 16, backgroundColor: c.raised, justifyContent: 'center' }, switchTrackOn: { backgroundColor: c.lime }, switchThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.text }, switchThumbOn: { alignSelf: 'flex-end', backgroundColor: '#172015' },
  emptyState: { flexGrow: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 13 }, emptyIcon: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }, emptyIconText: { color: c.lime, fontSize: 32 }, emptyTitle: { color: c.text, fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center' }, emptyBody: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 }, statusBadge: { minHeight: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.redBg, alignSelf: 'flex-start', justifyContent: 'center' }, offlineBanner: { minHeight: 70, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: '#806137', backgroundColor: '#282318', flexDirection: 'row', alignItems: 'center', gap: 12 }, offlineIcon: { color: '#F3C77E', fontSize: 24 }, lockCard: { borderRadius: 18, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, padding: 18, alignItems: 'center', gap: 12 }, dangerText: { color: c.red, fontSize: 15, fontWeight: '700' },
  metricWide: { padding: 14, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, gap: 12 }, consistencyDots: { flexDirection: 'row', justifyContent: 'space-between' }, consistencyDay: { alignItems: 'center', gap: 5 }, consistencyCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, consistencyDone: { backgroundColor: c.lime, borderColor: c.lime }, consistencyMark: { color: '#172015', fontSize: 15, fontWeight: '800' }, chartBars: { minHeight: 126, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border }, chartColumn: { minWidth: 26, alignItems: 'center', justifyContent: 'flex-end', gap: 6 }, chartBar: { width: 24, borderRadius: 7, backgroundColor: c.lime }, chartValue: { color: c.muted, fontSize: 11, fontWeight: '700' },
  accountHero: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13 }, avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, alignItems: 'center', justifyContent: 'center' }, avatarMark: { color: c.lime, fontSize: 30 }, meRow: { minHeight: 70, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 15, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12 }, meRowCopy: { flex: 1, gap: 3 }, meRowTitle: { color: c.text, fontSize: 16, lineHeight: 21, fontWeight: '600' }, meRowDetail: { color: c.muted, fontSize: 13, lineHeight: 18 }, meRowChevron: { color: c.dim, fontSize: 24 }, meIdentity: { minHeight: 88, padding: 15, borderRadius: 17, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 }, meAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: c.selected, borderWidth: 1, borderColor: c.limeDark, alignItems: 'center', justifyContent: 'center' }, meInitials: { color: c.lime, fontSize: 18, fontWeight: '700' }, meIdentityCopy: { flex: 1, gap: 3 }, meName: { color: c.text, fontSize: 18, lineHeight: 23, fontWeight: '700' }, meCheck: { color: c.lime, fontSize: 19, fontWeight: '800' }, mePlanCard: { padding: 16, borderRadius: 17, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, gap: 7, marginTop: 4, marginBottom: 4 }, mePlanTitle: { color: c.text, fontSize: 20, lineHeight: 26, fontWeight: '700' }, mePlanDivider: { height: 1, backgroundColor: c.border, marginVertical: 4 }, trialCard: { padding: 15, borderRadius: 16, borderWidth: 1, borderColor: c.limeDark, backgroundColor: c.selected, gap: 9 }, trialSegments: { flexDirection: 'row', gap: 5 }, trialSegment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.border }, trialSegmentOn: { backgroundColor: c.lime }, bulletList: { gap: 12, paddingHorizontal: 5 }, bulletText: { color: c.text, fontSize: 14, lineHeight: 21 }, planChoice: { minHeight: 70, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 10 }, planChoiceSelected: { borderColor: c.limeDark, backgroundColor: c.selected },
  spacerFill: { height: 12 }, spacerSmall: { height: 12 }, skeletonBar: { height: 20, width: '48%', borderRadius: 10, backgroundColor: c.surface, marginTop: 18 }, skeletonTitle: { height: 36, width: '68%', borderRadius: 10, backgroundColor: c.surface }, skeletonCard: { height: 122, borderRadius: 17, backgroundColor: c.surface },
}); }
