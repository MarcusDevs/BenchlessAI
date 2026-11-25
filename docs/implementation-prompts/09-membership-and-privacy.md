# Prompt 09 — Membership and privacy

Implement trial, entitlement, privacy, export, account deletion, and access-expired flows.

## Requirements

- Show the no-card 14-day trial, dates, annual/monthly options, period/price, cancel instructions, Terms/Privacy links, and restore purchases. Use store-local pricing when billing is configured; otherwise mark the current UI as a preview and do not charge or claim entitlement.
- Start the trial only after onboarding is complete and the user has a confirmed account. Use server timestamps and authenticated entitlement state; enforce one trial per account and reconcile Google Play/RevenueCat events before changing access.
- On expiry, lock paid training while leaving safety, history, export, and deletion available.
- Privacy controls explain what is collected and why. Export and deletion must provide real status and safe confirmation; do not claim completion from a local alert.
- Apply owner-only RLS to user data. Deletion removes the auth identity and cascades or schedules deletion of user-owned profile, injury, plan, log, check-in, reminder, and entitlement references according to the backend FRD; export returns the user's actual records.
- Keep deletion confirmation explicit and recoverable, with a clear cancel option.

## Acceptance

- Trial and expired states follow backend entitlement, not a hardcoded screen toggle.
- Legal, restore, export, deletion, and manage-subscription actions lead somewhere meaningful or are clearly unavailable.
- No-card and cancellation details are accurate for the configured store.
- Trial start/end and paid access come from server-backed entitlement state; expiry locks training while safety, history, export, and deletion remain available.

Implement only this feature; report billing/legal/backend dependencies and stop for review.
