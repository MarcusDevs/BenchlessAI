# Benchless AI

Benchless AI is an Expo and React Native app for strength training that adapts around a user's injury and routine. The mobile app starts with the onboarding flow and visual direction in the Benchless AI product requirements and supplied screen references.

## Onboarding and account flow

The welcome screen offers **Get started** for new users and **I already have an account** for direct sign-in. New users complete training goal, experience, equipment, training days, body status and map, pain/onset, safety check, age and coaching disclaimer, first-week plan review, and the 14-day no-card trial offer preview before creating or signing into an account. Reminder preferences follow account confirmation. Returning users load their own saved profile. The body map includes front and back views. Knee, lower back, shoulder and ankle are supported in the MVP; other marked areas are shown as coming soon. A yes answer in the safety check stops plan setup and advises contacting a qualified clinician.

The app saves an onboarding draft locally and attaches it to the authenticated user's owner-only Supabase profile after account confirmation. Email/password signup uses a six-digit in-app verification code; the Supabase Confirm signup email template must use `{{ .Token }}` as described in [`docs/auth-setup.md`](docs/auth-setup.md). Google OAuth uses the registered app callback. The 14-day offer is a preview only: billing and trial activation are not connected, and this build does not start a trial or collect payment. Workout generation and notification delivery also remain integration work. The week preview is not a reviewed injury-adapted workout. Shared dark and light semantic colors live in `src/design/tokens.ts` and are used across onboarding and training screens.

## Run locally

```sh
npm install
npm start
```

Use Expo Go to scan the QR code, or run `npm run android` / `npm run ios` with a configured native development environment. Expo Router remains the app foundation.
