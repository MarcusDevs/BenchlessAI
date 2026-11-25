# Prompt 07 — Progress and history

Complete the Progress area using FRD requirements and supplied progress screens.

## Requirements

- Provide week/month/all-time dashboard, consistency, sessions per week, pain trend where relevant, muscle volume, session history/detail, and personal records.
- Derive each chart and count from saved logs. Empty states should guide the next useful action; loading/offline/error states must preserve cached data and explain recovery.
- Give charts readable labels, units, time range, values, and screen-reader descriptions. Do not use color alone to convey change.
- Keep historical safety and export access available after entitlement expiry.
- Scope every query to the authenticated user's identity through RLS. Reconcile offline workout/check-in writes before counting sessions, volume, trends, or records; do not manufacture sample health history.

## Acceptance

- Every displayed value traces to a real stored record or is clearly identified as sample content.
- Every dashboard link opens its relevant detail view and returns to Progress correctly.
- Charts remain useful without color perception or visual access.

Implement only this feature and report data sources, files, verification, and outstanding sync dependencies; stop for review.
