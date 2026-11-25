# Configure Benchless account access

Benchless uses Supabase Auth for email/password and Google sign-in. The app reads only the Supabase project URL and public anon/publishable key from Expo's `EXPO_PUBLIC_` environment. Those two values are expected to ship in a mobile app; never put a Supabase `service_role` key, Google client secret, SMTP password, or other server secret in `.env` or app code.

## 1. Add the app environment

Copy `.env.example` to `.env` and replace the placeholders:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
# Optional for development/installed builds only. Omit this line in Expo Go.
# EXPO_PUBLIC_AUTH_REDIRECT_URL=benchlessai://auth/callback
```

Find the project URL and anon/publishable key in Supabase Dashboard → Project Settings → API. Keep `.env` local; it is ignored by Git. Restart Expo after changing these values:

```powershell
npx expo start --clear
```

## 2. Set up Supabase Auth

In Authentication → URL Configuration, add the callback URL to the allowed redirect URLs. The app computes it with Expo Linking: Expo Go uses `exp://<Metro-host>:8081/--/auth/callback`, the web preview uses `http://localhost:8081/auth/callback`, and a development or installed build uses `benchlessai://auth/callback`. For Expo Go you can allow local preview callbacks with `exp://**/--/auth/callback`; for web preview add `http://localhost:8081/auth/callback`; for a development build, allow the exact `benchlessai://auth/callback`. The app scheme is declared in `app.json`; rebuild/reinstall the native app after changing the scheme. `http://localhost:8081` is the web origin, not a callback route.

In Authentication → Sign In / Providers:

- Enable Email and password. Keep email confirmation enabled so an unverified address cannot open the training area.
- If the Email Templates editor is locked, configure a custom SMTP provider under Authentication → SMTP Settings first, or use a Supabase plan that permits template editing. New free-tier projects using Supabase's default SMTP cannot customize auth email templates. The default sender is limited to project team addresses and a low send rate, so it is for development only.
- After template editing is available, replace the Confirm signup body with [`supabase/templates/confirmation.html`](../supabase/templates/confirmation.html), which sends `{{ .Token }}` as a six-digit code. Remove `{{ .ConfirmationURL }}` from this template and set the subject to `Your Benchless verification code`. The app verifies the code with Supabase Auth and continues in place. If the template still contains `{{ .ConfirmationURL }}`, Supabase sends a link and the app cannot turn that email into a code from the client.
- Keep SMTP host, username, and password in Supabase's dashboard settings only. Never add them to `.env`, Expo config, or the mobile app bundle.
- Configure a production SMTP sender before inviting real users; the default test sender is limited.
- Enable Google. Create a Google OAuth web client in Google Cloud. Set its authorized redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`, then put the Google client ID and secret in the Supabase Google provider settings. Do not copy the Google secret into the mobile app.

The app starts Google OAuth in the system browser, uses the PKCE code flow, and returns through the callback URL for the current Expo runtime. Password-reset links use this callback; signup email confirmation uses an in-app code and does not need to open it.

## 3. Create the initial profile table

Run [`202611190001_auth_profiles.sql`](../supabase/migrations/202611190001_auth_profiles.sql) and [`202611190002_onboarding_profile_preferences.sql`](../supabase/migrations/202611190002_onboarding_profile_preferences.sql) in Supabase SQL Editor, or apply them with the Supabase CLI after linking this repository to your project. They create an owner-only `profiles` table, mirror signup name/year from Auth metadata, reject an under-18 year on email signup and profile writes, and add the FRD profile preferences, onboarding snapshot, and completion timestamp. The app also blocks account creation before the adult check.

This first migration covers account identity only. The remaining FRD tables, policies, Edge Functions, plan/data synchronization, billing, and server-side Google-age preflight are future backend slices; do not treat those as connected by adding the env values.

## 4. Account journeys in the app

- **First run:** welcome → training goal, experience, equipment and days → body status and safety questions as needed → adult check → create/access account → save onboarding preferences to that confirmed account → review the personalized first week → review the 14-day no-card trial offer → reminder preferences → start training. The offer is a preview until entitlement/billing integration is active; no trial starts in this build. Onboarding stays in local storage until the account is confirmed, then syncs into that user's profile. The training area stays locked until the account is confirmed and setup is complete.
- **Returning account:** choose “I already have an account” on welcome → sign in → load that account's saved setup. Do not overwrite an existing profile with an unrelated local draft.
- **Email signup:** finish the intake and adult check → enter name/email/password twice → Supabase creates the user → enter the emailed 6-digit code in the app using email OTP verification (`type: 'email'`) → confirmed session saves the onboarding profile and continues to the personalized plan, trial preview, and reminder setup. This requires the Confirm signup email template above to use `{{ .Token }}`; the default `{{ .ConfirmationURL }}` template sends a browser link instead.
- **Email sign-in:** enter email/password → Supabase verifies the credentials → confirmed session opens the saved setup.
- **Google:** confirm an adult birth year → continue in the browser → Supabase returns through the app callback → session is persisted in SecureStore on iOS/Android.
- **Forgot password:** request a reset link → open it on the device → choose and confirm a new password → return to sign-in.
- **Sign out:** Me → Sign out → session is revoked and the app returns to its welcome/onboarding entry.
- **Under 18:** account creation is blocked in the app. Email signup also carries the birth year into Supabase, where the profile migration checks it before allowing account creation. For Google, the app requires and records the age confirmation after OAuth; a server-side pre-user-creation age hook is still needed before production.

If the app says Supabase is not configured, check the three `.env` names, ensure the values are for the same Supabase project, restart Expo, and rebuild the native app if its scheme changed. If Google returns an OAuth redirect error, check both the Supabase allowed redirect list and the Google client's Supabase callback URI.
