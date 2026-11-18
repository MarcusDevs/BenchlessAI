import { JsonRepository } from '../data/storage/JsonRepository';
import { asyncStorageAdapter } from '../data/storage/AsyncStorageAdapter';

/** Versioned client storage boundary. A remote repository can replace this when the API is ready. */
const STORAGE_KEY = 'benchless.onboarding.v1';
const onboardingRepository = new JsonRepository<SavedOnboarding<unknown>>(asyncStorageAdapter, STORAGE_KEY, 1);

export type SavedOnboarding<T> = {
  version: 1;
  answers: T;
  completedAt: string | null;
};

export async function loadOnboarding<T>(): Promise<SavedOnboarding<T> | null> {
  let record = await onboardingRepository.load();
  // Migrate the original v1 shape in place so the foundation keeps existing setup intact.
  if (!record) {
    const raw = await asyncStorageAdapter.get(STORAGE_KEY);
    if (raw) {
      try {
        const legacy: unknown = JSON.parse(raw);
        if (legacy && typeof legacy === 'object') {
          const candidate = legacy as Partial<SavedOnboarding<T>>;
          if (candidate.version === 1 && candidate.answers && typeof candidate.answers === 'object') {
            record = { version: 1, answers: candidate.answers, completedAt: typeof candidate.completedAt === 'string' ? candidate.completedAt : null };
            await onboardingRepository.save(record);
          }
        }
      } catch {
        // Malformed local setup remains recoverable as an empty setup.
      }
    }
  }
  if (!record || !record.answers || typeof record.answers !== 'object') return null;
  return { version: 1, answers: record.answers as T, completedAt: typeof record.completedAt === 'string' ? record.completedAt : null };
}

export async function saveOnboarding<T>(answers: T, completedAt: string | null): Promise<void> {
  const record: SavedOnboarding<T> = { version: 1, answers, completedAt };
  await onboardingRepository.save(record);
}

export async function clearOnboarding(): Promise<void> {
  await onboardingRepository.clear();
}
