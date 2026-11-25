# Prompt 02 — Accounts and access

Build the sign-up, sign-in, and account recovery flows as one complete mobile feature. First-run account creation follows onboarding and the adult check; after confirmation, save the onboarding profile before showing the personalized plan and 14-day trial offer preview. A returning user can choose “I already have an account” on the welcome screen and go straight to sign-in. A confirmed account is required before entering the training tabs.

## Requirements

- Use Supabase Auth for Google and email/password on Android. Do not add Sign in with Apple in this release. Do not provide guest access to the training tabs.
- Keep onboarding answers as a local draft through account creation and authentication. After Supabase confirms the session, attach the draft to that user's owner-only profile; returning users must load their own saved setup rather than have an unrelated local draft overwrite it.
- Keep the welcome choice explicit: “Get started” begins onboarding; “I already have an account” opens sign-in. New-account choices (Google or email) appear after the trial offer preview.
- Return the authenticated account identity, including the provider's real display name when available. Ask for a name during email account creation; never invent a display name.
- Build sign-up, sign-in, reset-password, verification/loading/error, signed-in, and under-18 blocked states. Offer clear return paths and actionable validation.
- Email/password signup uses a six-digit in-app confirmation code. Configure Supabase Auth → Email Templates → Confirm signup to send `{{ .Token }}`; remove `{{ .ConfirmationURL }}` from that template. Verify the code with the signup email and `verifyOtp` using `type: 'email'`. Do not send new users to a browser for email confirmation. Password recovery follows `docs/auth-setup.md`.
- Google OAuth may use the system browser for provider consent, then must return through the registered app callback and persist the confirmed session securely.
- Do not prefill passwords. Use the correct keyboard and secure entry. Keep auth errors specific without exposing whether an unrelated person's email is registered.
- Do not fabricate successful authentication. If auth is not configured, use an explicitly marked local adapter and report that provider setup remains outstanding.
- Keep the 14-day no-card offer visible after account setup, but never claim a live trial started until the authenticated entitlement service records it. Do not collect payment details in this prompt.
- Follow Apple account/onboarding guidance while keeping platform-specific identity buttons and labels accurate.

## Acceptance

- Each account action has a complete success, failure, and recovery path.
- Completed onboarding remains available through the account flow and can be attached to the authenticated profile by the profile service.
- Signed-out users cannot enter training tabs, including after restarting with a locally saved onboarding draft.
- Under-18 users cannot proceed into account creation or training.
- App surfaces never imply a real account exists when only local preview state is present.
- New-user sequence is onboarding → Google/email account creation or sign-in → save onboarding profile → first-week plan review → 14-day trial offer preview → reminders → training. Welcome sign-in for a returning user loads that user's profile.
- If password sign-in reports an unconfirmed email, offer an in-app resend-code path and verify the signup code without requiring a browser or a second password sign-in.
- Confirm signup sends a code and the app verifies it in place; wrong/expired code and resend paths recover without opening a browser.
- Follow `docs/auth-setup.md` for Expo environment values, provider setup, redirects, and the account profile migration.

Implement only this feature. Report screens, state transitions, service readiness, files, verification, and next prompt; then stop for review.
