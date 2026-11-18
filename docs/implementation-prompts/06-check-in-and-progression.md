# Prompt 06 — Check-in and progression

Implement post-workout feel/pain check-in and phase outcomes.

## Requirements

- Capture feel (Perfect, A bit much, Too much, Too easy) and pain from 0–5. Ask which exercise only after “Too much”.
- Recheck red flags where required. Any positive danger signal must stop training and show clinician guidance.
- Show whether the phase holds, advances, or steps back with the actual approved rule inputs and a plain explanation. The client must not invent phase thresholds; if approval is missing, show a pending/undetermined state instead of advancing.
- Offer a clear path from result to the next planned workout and let people review/correct their check-in before saving.

## Acceptance

- Check-ins without “Too much” do not ask for an exercise.
- Only reviewed deterministic progression rules change phase.
- Saved check-ins are visible in history and pain trends; offline writes show sync state.

Implement only this feature; report which thresholds are configured versus awaiting reviewer approval, then stop for review.
