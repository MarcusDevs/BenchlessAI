# Prompt 13 — Custom workouts

Implement P1 custom workout creation/editing based on `Benchless screens/builder-01-new-workout.png`.

## Requirements

- Create a named workout, add/remove/reorder exercises, edit sets/reps/load/rest, and save/update/delete it.
- Check every exercise against the deterministic safety/rules engine. Clearly explain locked/modified movements and offer an allowed swap. Never let a custom workout bypass a safety block.
- Make unsaved changes recoverable and distinguish draft from saved workout.
- Link saved workouts into Plan/Today only when the rules service says they are eligible.

## Acceptance

- A draft can be edited, saved, reopened, and deleted with confirmation.
- Unsafe/locked choices cannot silently enter an active session.
- The UI never claims a rules check succeeded if only a local placeholder exists.

Implement only custom workouts, report safety-service dependencies and stop for review.
