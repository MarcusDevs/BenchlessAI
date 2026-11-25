import type {
  AccountIdentity, CheckInRecord, EntitlementRecord, ExportRequest, NotificationPreferences, OnboardingProfile,
  PlanRecord, ProfileRecord, ProgressSnapshot, UserId, WorkoutLog,
} from '../domain/models';

export type DataSource = 'local-preview' | 'remote';
export type ServiceResult<T> = { ok: true; value: T; source: DataSource } | {
  ok: false;
  error: { code: 'offline' | 'unavailable' | 'unauthorized' | 'email-unconfirmed' | 'not-found' | 'invalid' | 'unknown'; message: string; recoverable: boolean; debugDetails?: string };
};

export interface AuthService {
  signIn(email: string, password: string): Promise<ServiceResult<AccountIdentity>>;
  signUp(fullName: string, email: string, password: string, birthYear: string): Promise<ServiceResult<AccountIdentity & { verificationRequired: boolean }>>;
  signInWithGoogle(birthYear: string): Promise<ServiceResult<AccountIdentity>>;
  verifyEmail(email: string, token: string): Promise<ServiceResult<AccountIdentity>>;
  signOut(): Promise<ServiceResult<void>>;
  requestPasswordReset(email: string): Promise<ServiceResult<void>>;
  resendVerification(email: string): Promise<ServiceResult<void>>;
  currentUser(): Promise<ServiceResult<AccountIdentity | null>>;
}

export interface ProfileService {
  get(userId: UserId): Promise<ServiceResult<ProfileRecord | null>>;
  save(userId: UserId, profile: OnboardingProfile, completedAt: string | null): Promise<ServiceResult<ProfileRecord>>;
}

export interface PlanService {
  getCurrent(userId: UserId): Promise<ServiceResult<PlanRecord | null>>;
  refresh(userId: UserId): Promise<ServiceResult<PlanRecord>>;
}

export interface WorkoutLogService {
  list(userId: UserId): Promise<ServiceResult<WorkoutLog[]>>;
  save(log: WorkoutLog): Promise<ServiceResult<WorkoutLog>>;
}

export interface CheckInService {
  list(userId: UserId): Promise<ServiceResult<CheckInRecord[]>>;
  save(record: CheckInRecord): Promise<ServiceResult<CheckInRecord>>;
}

export interface ProgressService {
  get(userId: UserId): Promise<ServiceResult<ProgressSnapshot | null>>;
}

export interface EntitlementService {
  get(userId: UserId): Promise<ServiceResult<EntitlementRecord>>;
  restorePurchases(userId: UserId): Promise<ServiceResult<EntitlementRecord>>;
}

export interface NotificationService {
  getPreferences(userId: UserId): Promise<ServiceResult<NotificationPreferences>>;
  savePreferences(userId: UserId, preferences: NotificationPreferences): Promise<ServiceResult<NotificationPreferences>>;
  requestPermission(): Promise<ServiceResult<'granted' | 'denied' | 'not-determined'>>;
}

export interface AccountPrivacyService {
  requestExport(userId: UserId): Promise<ServiceResult<ExportRequest>>;
  deleteAccount(userId: UserId): Promise<ServiceResult<void>>;
  updatePrivacyPreferences(userId: UserId, preferences: { productAnalytics: boolean; crashReports: boolean }): Promise<ServiceResult<void>>;
}

/** Boundaries only. Implementations are wired per feature prompt; local data must be labeled preview. */
export type AppServices = {
  auth: AuthService;
  profile: ProfileService;
  plan: PlanService;
  workouts: WorkoutLogService;
  checkIns: CheckInService;
  progress: ProgressService;
  entitlements: EntitlementService;
  notifications: NotificationService;
  accountPrivacy: AccountPrivacyService;
};
