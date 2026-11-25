import { JsonRepository } from '../data/storage/JsonRepository';
import { asyncStorageAdapter } from '../data/storage/AsyncStorageAdapter';
import type { WorkoutHistoryEntry } from '../domain/models';

const historyRepository = new JsonRepository<WorkoutHistoryEntry[]>(asyncStorageAdapter, 'benchless.workouts.v1', 1);
const legacyHistoryRepository = new JsonRepository<WorkoutHistoryEntry[]>(asyncStorageAdapter, 'benchless.guest.workouts.v1', 1);

/** Device persistence for workout history; remote sync remains a separate service concern. */
export const localWorkoutHistory = {
  async load() {
    const current = await historyRepository.load();
    if (current) return current;
    const legacy = await legacyHistoryRepository.load();
    if (legacy) await historyRepository.save(legacy);
    return legacy;
  },
  async save(history: WorkoutHistoryEntry[]) {
    await historyRepository.save(history);
    await legacyHistoryRepository.clear();
  },
};
