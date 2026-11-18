# Prompt 02 — Accounts and access

Build the sign-up, sign-in, guest upgrade, and account recovery flows as one complete mobile feature.

## Requirements

- Use the account requirements in the frontend and backend FRDs. Android MVP supports Google and email; add Apple sign-in for iOS. Keep a guest path and preserve its setup and logs when it is linked to an account.
- Build sign-up, sign-in, reset-password, verification/loading/error, signed-in, and under-18 blocked states. Offer clear return paths and actionable validation.
- Do not prefill passwords. Use the correct keyboard and secure entry. Keep auth errors specific without exposing whether an unrelated person's email is registered.
- Do not fabricate successful authentication. If auth is not configured, use an explicitly marked local adapter and report that provider setup remains outstanding.
- Follow Apple account/onboarding guidance while keeping platform-specific identity buttons and labels accurate.

## Acceptance

- Each account action has a complete success, failure, and recovery path.
- Guest state remains intact through account linking.
- Under-18 users cannot proceed into account creation or training.
- App surfaces never imply a real account exists when only local preview state is present.

Implement only this feature. Report screens, state transitions, service readiness, files, verification, and next prompt; then stop for review.
