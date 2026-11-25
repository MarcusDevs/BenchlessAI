# Prompt 01 — Foundation and app shell

Implement the foundation for the Benchless AI mobile app in this repository.

## Read first

- `AGENTS.md`
- `docs/requirements/Benchless_AI_Mobile_Frontend_FRD.docx`
- `docs/requirements/Benchless_AI_Backend_FRD.docx`
- `.agents/skills/apple-design/SKILL.md` and relevant accessibility, color, layout, typography, onboarding, tab-bar, and React Native references
- Existing app routes, `src/design/tokens.ts`, and supplied images under `Benchless screens/`

## Work

1. Keep the Expo Router / React Native application as one product codebase. Establish feature folders, shared typed domain models, repository/service interfaces, and a local persistence adapter that can later be replaced or paired with backend APIs.
2. Make `src/design/tokens.ts` the single source for semantic light/dark colors and shared type/spacing/radius tokens. Apply the current Benchless neutral green-black and soft-lime look consistently across onboarding and main-app screens.
3. Establish accessible app navigation for Today, Plan, Library, Progress, and Me, plus detail-flow navigation with predictable back behavior and preserved state.
4. Keep preview/demo entry points out of normal product navigation. Provide a development-only route or mechanism when needed, clearly separated from real user-facing flows.
5. Define typed service boundaries for auth, profile/setup, plan/rules bundle, workout logs, check-ins, progress, entitlements/billing, notifications, and account/privacy actions. Implementations must distinguish remote, local-preview, and unavailable results; local adapters must never claim remote success.
6. Make app loading, offline, empty, and error presentation reusable and make each state recoverable.
7. Establish the MVP trust boundary: public Supabase URL/key only in the app; no service-role or provider secrets; user rows are owner-scoped with RLS; private health and red-flag answers stay out of analytics. The unauthenticated onboarding draft remains local until an account is confirmed.

## Acceptance

- A new feature can be implemented inside the app without creating a separate frontend/backend repository.
- Navigation, theme, safe-area, typography, and accessible component conventions are documented and shared.
- Existing onboarding and training screens still build and share exactly the same base palette.
- No health-safety rule or user data is fabricated by the shell.
- No signed-out user can reach the training tabs, and a local draft is never presented as a remote account or profile.

## Report back

List the architecture decisions, files changed, commands run, what is still preview-only, and the next prompt to review. Stop after this foundation slice; do not implement accounts or onboarding in this prompt.
