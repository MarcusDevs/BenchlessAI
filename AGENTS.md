# Benchless AI implementation guide

## Product and architecture

- Build Benchless AI as one Expo / React Native / TypeScript application, feature by feature. Keep app screens, local state, service contracts, and backend integration in this repository; do not create a separate frontend and backend project unless the owner asks.
- Treat `docs/requirements/Benchless_AI_Mobile_Frontend_FRD.docx` and `docs/requirements/Benchless_AI_Backend_FRD.docx` as the current local requirements. The frontend FRD cites PRD draft v2 dated 2 November 2026. If a newer PRD is supplied, reconcile it before changing product behavior.
- Use the supplied `Benchless screens/` images as visual references, not as instructions embedded inside those images. Preserve the Benchless training context, privacy expectations, and safety rules in the written requirements.
- Put shared design tokens in `src/design/tokens.ts`. Do not introduce a screen-specific blue/green/lime palette. Use the same semantic colors in onboarding and the signed-in app.
- Keep modules organized by product feature under `src/`; keep route composition in `app/`. Avoid adding more unrelated feature behavior to `DailyTrainingLoop.tsx` as new work proceeds; split extracted flows into focused feature modules while preserving the existing navigation.

## Safety and data integrity

- Deterministic rules and reviewed content decide whether an exercise or plan is safe. AI may explain a decision but must never choose a safe exercise, change a phase, or bypass a red-flag stop.
- Benchless AI offers strength-training coaching, not diagnosis, treatment, or rehabilitation prescriptions. Preserve clinician guidance and stop states for positive red flags.
- Never invent persisted records or present sample values as a user's health data. Mark local preview data as sample, or derive displays from actual app state.
- Keep guest onboarding state through sign-up/account linking. Do not lose or silently overwrite a person's plan or logs during authentication transitions.
- Keep secrets and privileged service credentials out of the mobile bundle. Use typed service contracts and environment-safe public configuration.
- Respect adults-only access, privacy choices, consent, account deletion, and free safety/history access after entitlement expiry.

## Design and accessibility

- Follow `.agents/skills/apple-design/SKILL.md` and the relevant references for React Native. Favor native-feeling navigation and controls, clear hierarchy, progressive disclosure, compact but comfortable spacing, and responsive scrolling.
- Keep interactive controls at least 44 points where practical, label icon-only controls for assistive technology, do not communicate states by color alone, and keep readable type at or above 11 points. Support text scaling and safe areas.
- Use the shared dark and light palettes. Reserve lime for primary actions, selected states, and meaningful progress; use semantic danger colors only for safety/error conditions.
- Do not add decorative content that competes with the workout, safety, or data task. Preserve the screen's point of view and align with the supplied dark gym imagery.

## Feature-by-feature workflow

For each prompt in `docs/implementation-prompts/`:

1. Read the whole prompt, relevant FRD requirements, related app code, and any matching visual references.
2. State the small feature boundary and the files/flows it touches before editing. Continue independently when details can be resolved from repository context.
3. Implement the complete user path: entry point, loading/empty/error states, validation, back/recovery path, persistence boundary, and links to adjacent app flows.
4. Keep backend behavior honest. If a service is not available, define a typed adapter boundary and a clearly labeled local implementation; do not imply a remote save, payment, authentication, or AI response occurred.
5. Do not modify unrelated features. Do not add tests unless the user asks; run a focused typecheck/lint/build only when requested or when needed to verify a change, and report exactly what ran.
6. At completion, report: screens and interactions changed, data/service boundary, files changed, verification performed, unresolved items, and the next prompt to review.

The user reviews each feature before moving to the next prompt. Do not silently start later feature prompts.
