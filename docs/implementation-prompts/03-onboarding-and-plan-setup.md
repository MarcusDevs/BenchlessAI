# Prompt 03 — Onboarding and plan setup

Complete the first-run onboarding flow in the existing Benchless AI app.

## Requirements

- Follow the frontend FRD flow: welcome; goal; experience; equipment/cardio; training days; body status; supported/coming-soon body-map markers; pain/onset/cause; red flags; adults-only age and coaching disclaimer; guest/account choice; first-week plan review; no-card trial offer; reminder preferences and permission.
- No-injury users must reach a standard useful plan without injury questions. A positive red flag must stop injury plan generation and show the selected concern with review/close actions.
- Preserve selected-area semantics: only supported MVP body areas (knee, lower back, shoulder, ankle) can drive adaptation. Unreleased markers may collect a demand signal but must not imply safety or a plan change. Permit multiple selections in the data model while respecting MVP plan-engine support.
- Keep progress and answers recoverable when a person goes back. Persist local guest state and attach it during account upgrade.
- Use the shared dark green-black/soft-lime tokens; never bring back the blue onboarding palette. Keep the body front/back art and markers aligned, tappable, labeled, and accessible.
- Ask for notification permission only after explaining its use and preserve a “Not now” path.

## Acceptance

- Adult with no injury reaches a standard plan preview; adult with supported area and all-No safety answers reaches an adapted-plan preview with reasons; any Yes stops the flow; under 18 is blocked.
- Selection, validation, back behavior, text scaling, and compact-phone scrolling work.
- Trial choice is not represented as a real purchase unless billing is connected.

Implement only onboarding. Report the full flow, persistence/service boundary, files, verification, and unresolved asset or policy approvals; stop for review.
