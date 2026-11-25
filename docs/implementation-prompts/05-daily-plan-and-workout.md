# Prompt 05 — Daily plan and workout

Implement the core daily training loop from the frontend FRD and `Benchless screens/core-00-overview.png`.

## Requirements

- Connect Today, weekly Plan, workout overview, change explanations, exercise detail, active workout, and session completion.
- Show final plan changes and reasons. Rules—not AI—own keep/modify/swap/unavailable decisions. Make each changed exercise understandable and reversible when allowed.
- Log sets, reps, load or duration, rest, notes, previous values, and PR feedback. Persist workout progress locally before any remote sync.
- Include controllable exercise demo media, set progress, rest controls, finish/pause recovery, and a clearly discoverable “Something hurts?” action. A hurting response pauses the current movement/session and offers safe adaptation/stop actions.
- Keep authenticated-user offline training usable from that user's cached plan and logs. Do not unlock training for a signed-out guest. Clearly show pending or failed sync and reconcile queued writes without duplicating sessions.
- Load the signed-in user's saved goal, experience, equipment, training days, injury state, and reviewed rules version. Keep user data and cached plan ownership scoped to that account.

## Acceptance

- A user can navigate Today → overview → exercise → active sets → completion, review changes, and recover from pause/stop.
- No real video, sync, or rules result is implied if only a placeholder/local adapter is present.
- Controls remain reachable with large text and small phones.

Implement only this loop. Report completed paths and remaining media/rules/API dependencies; stop for review.
