# Benchless AI feature prompts

These prompts let us build the mobile app one reviewable feature at a time. Use them in order for the first app build. Each prompt is intended to be pasted on its own and asks for a finished vertical feature slice, not a disconnected mock screen.

The local source of truth is the mobile and backend FRD in `docs/requirements/`. The frontend FRD references PRD draft v2 dated 2 November 2026. Product phases below follow that FRD: P0 is MVP; P1 is the next release. The user-provided screen images in `Benchless screens/` are visual references.

Each P0 prompt must deliver its user path end to end across the app, typed service boundary, and required Supabase schema/RLS or backend dependency. Keep remote, local-preview, and unavailable behavior distinct. Never expose service-role credentials, bypass red-flag stops, fabricate user records, or claim a trial, payment, or remote save that did not happen. Keep every feature review checkpoint; do not start a later prompt before the user reviews the current one.

## Suggested order

| Build order | Prompt file | Scope | Priority |
| --- | --- | --- | --- |
| 01 | [Foundation and app shell](01-foundation-and-app-shell.md) | Navigation, shared state, service boundaries, shared design system | P0 foundation |
| 02 | [Onboarding and plan setup](03-onboarding-and-plan-setup.md) | Intake through plan and trial offer, then account and reminders | P0 |
| 03 | [Accounts and access](02-accounts-and-access.md) | Welcome sign-in, post-offer signup, OTP, OAuth, recovery, adult gate | P0 |
| 04 | [Injury rules and history](04-injury-rules-and-history.md) | Injury states, multi-injury-ready data, red flags, healed/re-injury | P0/P1 |
| 05 | [Daily plan and workout](05-daily-plan-and-workout.md) | Today, weekly plan, exercise details, workout logging, swaps | P0 |
| 06 | [Check-in and progression](06-check-in-and-progression.md) | Pain/feel, safety stops, phase outcome | P0 |
| 07 | [Progress and history](07-progress-and-history.md) | Dashboard, pain trend, session history/detail, records, volume | P0 |
| 08 | [Exercise library](08-exercise-library.md) | Search, filters, equipment and safety states | P0 |
| 09 | [Membership and privacy](09-membership-and-privacy.md) | Trial, billing boundary, expiry, privacy, export, deletion | P0 |
| 10 | [Reminders and app settings](10-reminders-and-settings.md) | Notification permissions and settings | P0 |
| 11 | [Nutrition and recovery](11-nutrition-and-recovery.md) | Calories, food log, sleep | P1 |
| 12 | [Body metrics](12-body-metrics.md) | Weight and measurements | P1 |
| 13 | [Custom workouts](13-custom-workouts.md) | Create, edit, and save user sessions | P1 |
| 14 | [Benchless Coach](14-benchless-coach.md) | AI explanations/chat with guardrails | P1 |

Build in the order above. The onboarding prompt comes before the accounts prompt because new users must complete intake, plan review, and the trial offer preview before account creation; returning users still use the direct sign-in entry. The prompt files retain their original numbers for traceability. After each prompt, return a concise review report and wait for the user's review before continuing.
