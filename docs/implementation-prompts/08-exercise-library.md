# Prompt 08 — Exercise library

Implement the searchable exercise library and filters from the frontend FRD.

## Requirements

- Search and filter by category, muscle, equipment, and user safety context; show available, modified/safe-now, and phase-locked states with understandable labels.
- Use the real exercise catalogue and safety rules when configured. Do not advertise a catalogue count that is not present or claim safety from a placeholder filter.
- Link exercise rows to the same detail and swap flows used by workouts. Keep filter selections understandable and resettable.
- Include useful empty, loading, offline, and error states.

## Acceptance

- Search and filters combine correctly and are accessible by touch and assistive technology.
- A locked movement cannot be added to a plan by accident; an allowed alternative has a traceable reason.
- No unsupported “safe for you” claims are displayed.

Implement only the library, report catalogue/rules dependencies and verification, then stop for review.
