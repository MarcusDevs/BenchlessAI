import type { BodyArea, Experience, Goal, Side } from '../domain/models';
export type { BodyArea, Experience, Goal, InjuryStatus, Side } from '../domain/models';

export const goals: { title: Goal; detail: string; symbol: string }[] = [
  { title: 'Build muscle', detail: 'Build size, steadily.', symbol: '↗' },
  { title: 'Get stronger', detail: 'Make progress with every session.', symbol: '⌁' },
  { title: 'Lose fat', detail: 'Stay strong while you lean down.', symbol: '◒' },
  { title: 'Feel fitter', detail: 'More energy for everyday life.', symbol: '⌁' },
  { title: 'Sport performance', detail: 'Train for the way you play.', symbol: '◎' },
];

export const experienceLevels: { title: Experience; detail: string }[] = [
  { title: 'Beginner', detail: 'New to training, or returning after a break.' },
  { title: 'Intermediate', detail: 'Training consistently for a year or more.' },
  { title: 'Advanced', detail: 'Several years of structured training.' },
];

export const equipmentOptions = [
  { title: 'Full gym', detail: 'Machines, barbells and cables.', symbol: '✳' },
  { title: 'Dumbbells at home', detail: 'A pair or an adjustable set.', symbol: '⌁' },
  { title: 'Bodyweight', detail: 'Just you and a little space.', symbol: '◌' },
];

// MVP body map: one visible, tappable marker per supported location. Side is
// chosen below the image, so no invisible or duplicate hotspots are needed.
export const bodyMapMarkers: { area: BodyArea; side: Side; face: 'front' | 'back'; left: number; top: number }[] = [
  { area: 'Shoulder', side: 'Left', face: 'front', left: 68, top: 19.1 },
  { area: 'Knee', side: 'Left', face: 'front', left: 63, top: 68.3 },
  { area: 'Ankle', side: 'Left', face: 'front', left: 63, top: 89.2 },
  { area: 'Shoulder', side: 'Left', face: 'back', left: 67.1, top: 16.9 },
  { area: 'Lower back', side: 'Left', face: 'back', left: 50, top: 32 },
  { area: 'Knee', side: 'Left', face: 'back', left: 37.4, top: 69.6 },
  { area: 'Ankle', side: 'Left', face: 'back', left: 36.5, top: 91.7 },
];

export const redFlagQuestions = [
  'I can’t put weight on it or move the joint normally.',
  'There is visible swelling or a change in shape.',
  'The joint gives way or feels unstable.',
  'I have numbness, tingling or pain spreading down a limb.',
  'The pain feels very severe.',
];

export const lowerBackRedFlagQuestions = [
  'I have numbness around my groin, trouble controlling my bladder or bowel, or spreading leg weakness.',
];

export const weekDays = [
  { short: 'M', name: 'Monday' }, { short: 'T', name: 'Tuesday' }, { short: 'W', name: 'Wednesday' },
  { short: 'T', name: 'Thursday' }, { short: 'F', name: 'Friday' }, { short: 'S', name: 'Saturday' }, { short: 'S', name: 'Sunday' },
];

export const sectionLabels: Record<number, string> = {
  1: 'YOUR TRAINING', 2: 'YOUR TRAINING', 3: 'YOUR TRAINING', 4: 'YOUR TRAINING',
  5: 'YOUR BODY', 6: 'YOUR BODY', 7: 'YOUR BODY', 8: 'YOUR BODY', 9: 'YOUR ACCOUNT',
  10: 'YOUR PLAN', 11: 'YOUR MEMBERSHIP', 12: 'READY TO GO',
};
