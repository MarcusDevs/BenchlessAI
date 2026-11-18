import type { CheckInRecord, PlanRecord, ProfileRecord, ProgressSnapshot, UserId, WorkoutLog } from '../../domain/models';

export interface Repository<T, Id extends string = string> {
  get(id: Id): Promise<T | null>;
  save(record: T): Promise<void>;
  remove(id: Id): Promise<void>;
}

export interface ProfileRepository extends Repository<ProfileRecord, UserId> {}
export interface PlanRepository extends Repository<PlanRecord> {
  getCurrent(userId: UserId): Promise<PlanRecord | null>;
}
export interface WorkoutRepository {
  list(userId: UserId): Promise<WorkoutLog[]>;
  save(record: WorkoutLog): Promise<void>;
}
export interface CheckInRepository {
  list(userId: UserId): Promise<CheckInRecord[]>;
  save(record: CheckInRecord): Promise<void>;
}
export interface ProgressRepository {
  get(userId: UserId): Promise<ProgressSnapshot | null>;
}
