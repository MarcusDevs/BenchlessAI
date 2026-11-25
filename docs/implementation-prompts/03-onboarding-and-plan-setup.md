# Prompt 03 — Onboarding and plan setup

Complete the first-run onboarding flow in the existing Benchless AI app.

## Requirements

- Follow the frontend FRD flow: welcome; goal; experience; equipment/cardio; training days; body status; supported/coming-soon body-map markers; pain/onset/cause; red flags; adults-only age and coaching disclaimer; account creation/sign-in; first-week plan review; 14-day no-card trial offer preview; reminder preferences and permission.
- The welcome screen offers “Get started” for first-run onboarding and “I already have an account” for direct sign-in. First-run onboarding reaches account setup after the adult check; after account confirmation and profile sync, show the personalized plan and trial preview. Returning accounts load their own saved profile.
- No-injury users must reach a standard useful plan without injury questions. A positive red flag must stop injury plan generation and show the selected concern with review/close actions.
- Preserve selected-area semantics: only supported MVP body areas (knee, lower back, shoulder, ankle) can drive adaptation. Unreleased markers may collect a demand signal but must not imply safety or a plan change. Permit multiple selections in the data model while respecting MVP plan-engine support.
- Keep progress and answers recoverable when a person goes back. Persist an explicitly local onboarding draft before leaving the intake and keep it through account setup, plan review, and trial preview. Attach it to the authenticated user's profile only after Supabase confirms the account; do not expose guest training access or overwrite an existing account's profile when using the returning-account route.
- Show the 14-day, no-card trial offer after account setup. Label it as a preview until the backend entitlement and billing services actually create a trial; do not imply a live trial or purchase.
- Use the shared dark green-black/soft-lime tokens; never bring back the blue onboarding palette. Keep the body front/back art and markers aligned, tappable, labeled, and accessible.
- Ask for notification permission only after explaining its use and preserve a “Not now” path.

## Acceptance

- Adult with no injury reaches a standard plan preview; adult with supported area and all-No safety answers reaches an adapted-plan preview with reasons; any Yes stops the flow; under 18 is blocked.
- Selection, validation, back behavior, text scaling, and compact-phone scrolling work.
- Trial offer is visible as 14 days with no card, but is not represented as an active entitlement or purchase unless backend billing is connected.
- New account flow order is intake → account → plan review → trial offer → reminders → training. Existing-account sign-in from welcome remains a direct sign-in path and restores that user's saved onboarding/profile.

Implement only onboarding. Report the full flow, persistence/service boundary, files, verification, and unresolved asset or policy approvals; stop for review.
