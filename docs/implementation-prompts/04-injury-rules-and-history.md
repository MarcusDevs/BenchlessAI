# Prompt 04 — Injury rules and history

Implement injury tracking and its safety states using the FRDs and current supplied injury screens.

## Requirements

- Model active, healed, and re-injured areas with side, onset, pain, check-in history, phase, and current status. Keep the data ready for multiple injuries; never apply an unsupported area as an adapted rule.
- Display injury history, current phase, settled-day/session progress, pain trend entry point, log pain, mark healed, and re-injury safety check.
- Red flags pause training and show the actual positive answers with clear clinician guidance. Do not allow an action that bypasses the approved rules or progression state.
- Persist injury intake, red-flag answers/outcome, dates, and status to the authenticated user's private records with owner-only RLS. A positive answer creates the safety state and prevents injury plan generation; preserve this stop when offline or entitlement has expired.
- If overlapping injuries are enabled, communicate that the strictest reviewed rule controls. Until multiple injury support is approved in the plan engine, record and present the extra condition without pretending the plan accounts for it.
- Use plain coaching language; no diagnosis, healing claim, or rehabilitation prescription.

## Acceptance

- Safety stops remain available without paid access.
- Injury changes have a confirmation/recovery path and update the app's displayed context consistently.
- No screen invents phases, dates, pain history, or plan safety.
- Profile/injury reads and writes are scoped to the signed-in user's ID; failed sync remains visible and does not clear local answers.

Implement only this feature slice, report service/rules dependencies and verification, then stop for review.
