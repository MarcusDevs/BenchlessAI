/** Shared frontend contracts for local storage and future API payloads. */
export type Goal = 'Build muscle' | 'Get stronger' | 'Lose fat' | 'Feel fitter' | 'Sport performance';
export type Experience = 'Beginner' | 'Intermediate' | 'Advanced';
export type InjuryStatus = 'No current injury' | 'I’m managing an injury' | 'I’m returning from injury';
export type BodyArea = 'Head' | 'Neck' | 'Shoulder' | 'Elbow' | 'Wrist' | 'Chest' | 'Abdomen' | 'Hip' | 'Lower back' | 'Knee' | 'Calf' | 'Ankle';
export type Side = 'Left' | 'Right';
export type Equipment = 'Full gym' | 'Dumbbells at home' | 'Bodyweight';

export type OnboardingProfile = {
  goal: Goal;
  experience: Experience;
  equipment: Equipment[];
  cardio: boolean;
  days: number[];
  injuryStatus: InjuryStatus;
  area: BodyArea;
  side: Side;
  areas: { area: BodyArea; side: Side }[];
  face: 'front' | 'back';
  pain: number;
  onset: string;
  cause: string;
  redFlags: boolean[];
  birthYear: string;
  acknowledged: boolean;
  membership: 'Annual' | 'Monthly';
  trainingTime: string;
  workoutReminders: boolean;
  sessionCheckIns: boolean;
};

export type LoggedSet = {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  durationSeconds?: number;
  completedAt: string;
};

export type SessionCheckIn = {
  feel: 'Perfect' | 'A bit much' | 'Too much' | 'Too easy';
  pain: number;
  exerciseId?: string;
  createdAt: string;
};

export type PhaseProgress = {
  phase: number;
  sessionsInPhase: number;
  settledDays: number;
  decision: 'HOLD' | 'ADVANCE' | 'STEP BACK';
  updatedAt: string;
};

export type UserId = string;
export type RecordId = string;

export type ProfileRecord = {
  userId: UserId;
  onboarding: OnboardingProfile;
  updatedAt: string;
};

export type PlanRecord = {
  id: RecordId;
  userId: UserId;
  generatedAt: string;
  /** Server-owned rules version; clients must not invent or reinterpret safety rules. */
  rulesVersion: string;
  payload: unknown;
};

export type WorkoutLog = {
  id: RecordId;
  userId: UserId;
  startedAt: string;
  completedAt: string | null;
  sets: LoggedSet[];
};

export type CheckInRecord = {
  id: RecordId;
  userId: UserId;
  createdAt: string;
  value: SessionCheckIn;
};

export type ProgressSnapshot = {
  userId: UserId;
  updatedAt: string;
  payload: unknown;
};

export type EntitlementStatus = 'unknown' | 'trial' | 'active' | 'expired' | 'grace-period';
export type EntitlementRecord = {
  userId: UserId;
  status: EntitlementStatus;
  productId: string | null;
  renewsAt: string | null;
};

export type NotificationPreferences = {
  workoutReminders: boolean;
  sessionCheckIns: boolean;
  trainingTime: string | null;
};

export type ExportRequest = { requestedAt: string; status: 'queued' | 'ready' | 'failed' };
