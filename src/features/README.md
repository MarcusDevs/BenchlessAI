# Feature folders

Feature UI and workflows live here as they are implemented, for example `features/auth/`, `features/training/`, `features/progress/`, and `features/profile/`. Keep shared, feature-independent records in `domain/`, service interfaces in `services/`, and persistence/network adapters in `data/`. Expo Router routes should stay small and compose feature screens rather than absorb feature logic.

This foundation does not move the existing onboarding and training prototypes. Those remain in `src/onboarding/` and `src/training/` until their dedicated prompts migrate each flow.
