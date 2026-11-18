# Prompt 12 — Body metrics

Implement the P1 weight and measurement tracking flow shown in `Benchless screens/body-01-metrics.png`.

## Requirements

- Let users opt in to tracking body weight and selected measurements, add/edit/delete entries, and inspect a time-based chart.
- Make units explicit and editable. Derive trends only from the user's real entries, support empty state, and allow data export/deletion.
- Do not set body goals, infer health status, or present weight movement as inherently good/bad.
- Protect sensitive data and keep it out of unapproved analytics or coach prompts.

## Acceptance

- Chart labels and screen-reader descriptions report values, units, and dates.
- No fabricated sample metrics appear as recorded user measurements.
- Users can remove all entries.

Implement only body metrics, report storage/privacy boundary and verification, then stop for review.
