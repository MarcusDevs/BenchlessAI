# Prompt 09 — Membership and privacy

Implement trial, entitlement, privacy, export, account deletion, and access-expired flows.

## Requirements

- Show the no-card 14-day trial, dates, annual/monthly options, period/price, cancel instructions, Terms/Privacy links, and restore purchases. Use store-local pricing when billing is configured; otherwise mark the current UI as a preview and do not charge or claim entitlement.
- On expiry, lock paid training while leaving safety, history, export, and deletion available.
- Privacy controls explain what is collected and why. Export and deletion must provide real status and safe confirmation; do not claim completion from a local alert.
- Keep deletion confirmation explicit and recoverable, with a clear cancel option.

## Acceptance

- Trial and expired states follow backend entitlement, not a hardcoded screen toggle.
- Legal, restore, export, deletion, and manage-subscription actions lead somewhere meaningful or are clearly unavailable.
- No-card and cancellation details are accurate for the configured store.

Implement only this feature; report billing/legal/backend dependencies and stop for review.
