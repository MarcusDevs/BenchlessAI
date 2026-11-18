# App foundation conventions

## One product codebase

The app stays in this Expo Router / React Native project. `app/` owns route entry points, `src/features/` owns feature UI and workflows, `src/domain/` owns shared typed records, `src/services/contracts.ts` defines service boundaries, and `src/data/` owns persistence and transport adapters. Features receive services through a composition layer when they are implemented; they do not call AsyncStorage or a future API directly from screens.

## Navigation

`src/navigation/types.ts` is the shared source for the five product tabs. Top-level tabs preserve their mounted screen state. Detail flows keep the originating tab and return to it when dismissed. System Back and visible Back controls should have equivalent outcomes; destructive or unfinished actions must not silently discard edits.

## Theme and layout

`src/design/tokens.ts` is the source for semantic light/dark colors, type, line height, spacing, radii, and minimum control sizes. Use `SafeAreaView` for system insets, scrolling for content that can exceed the available height, and the system font. Keep core reading text near 17 pt where space allows and interactive targets at least 44 pt. Always pair color-coded state with text, shape, or icon.

## Data and preview boundary

`src/data/storage/asyncStorageAdapter.ts` is device-local storage, not a backend. The versioned JSON repository returns local records only; its results must be described as `local-preview` at service boundaries. No local adapter may report remote sync, authentication, billing, plan generation, or safety-rule success. The current training loop still contains illustrative sample workouts and local-only interactions; it is a preview surface and is not a source of real user or clinician-approved data.

## Recoverable states

Use `AppStateView` for loading, offline, empty, and error states. Provide a retry or a safe way to return to locally available content whenever that action exists. Error copy must say what failed without implying that data was synced or changed.

## Service contracts

`src/services/contracts.ts` defines boundaries for auth, profile/setup, plans, workout logs, check-ins, progress, entitlements, notifications, and privacy/account actions. API adapters and feature behavior are added in their respective implementation prompts; this foundation supplies no service implementations.

## Apple design references

Shared conventions translate Apple HIG guidance for React Native: accessibility and adaptable text (`accessibility.md`, `typography.md`), semantic color and contrast (`color.md`), safe-area responsive layout (`layout.md`), familiar platform navigation (`tab-bars.md`, `cross-platform.md`), and actionable loading/error feedback (`loading.md`, `feedback.md`).
