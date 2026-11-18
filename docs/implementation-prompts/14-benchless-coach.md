# Prompt 14 — Benchless Coach

Implement the P1 Coach chat/explanation interface shown in `Benchless screens/coach-01-chat.png`.

## Requirements

- Coach language may explain a reviewed plan decision, movement cue, or why an exercise is locked. Deterministic rules alone decide exercise safety and plan progression.
- Clearly identify AI-generated responses, set capability limits, protect health information, and obtain consent before sending sensitive context to a server.
- Provide suggested questions, loading/error/retry, report-response feedback, and a useful non-AI fallback. Do not send identifying data or unneeded health context.
- Never diagnose, prescribe treatment/rehab, create a new safety rule, or invite users to override a safety stop. Refuse unsafe requests with a safe next action.
- Ensure the user can correct, retry, or dismiss generated content.

## Acceptance

- Chat is optional and never required to complete training.
- Responses cite the app's reviewed plan/rule context where possible and distinguish explanation from safety authority.
- Provider failure leaves plan and workout functions usable.

Implement only Coach, report model/privacy/rules boundaries and stop for review.
