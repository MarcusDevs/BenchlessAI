# Prompt 10 — Reminders and app settings

Implement training and check-in preferences using the settings/reminder requirements.

## Requirements

- Configure training days/time and workout/check-in reminder toggles with OS permission requested only in context.
- If permission is denied, keep reminders visibly off and explain how to change permission later. “Not now” remains available.
- Keep units, rest timer, training goal/level/equipment, and settings linked to the canonical profile rather than duplicating values.
- Schedule, update, and cancel local notifications consistently when preferences change.
- Persist user preferences and timezone to the authenticated profile; when server push delivery is connected, honor opt-in, quiet hours, timezone changes, and trial dates. Local scheduling alone must not be described as server delivery.

## Acceptance

- UI status matches actual OS permission and scheduled notification state.
- Settings changes are validated, persisted, and reflected in Today/Plan.
- No reminder is claimed active when permission or scheduling failed.

Implement only reminders/settings; report OS behavior tested and stop for review.
