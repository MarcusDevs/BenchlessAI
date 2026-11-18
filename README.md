# Benchless AI

Benchless AI is an Expo and React Native app for strength training that adapts around a user's injury and routine. The mobile app starts with the onboarding flow and visual direction in the Benchless AI product requirements and supplied screen references.

## Onboarding prototype

The welcome screen leads into the 10 numbered onboarding sections: training goal, experience, equipment, training days, body status and map, pain and onset, safety check, age and coaching disclaimer, account choice, week preview, membership, and reminders. The body map includes front and back views. Knee, lower back, shoulder and ankle are supported in the MVP; other marked areas are listed as coming soon and shown as demand signals in the current onboarding session. A yes answer in the safety check stops the plan preview and advises contacting a qualified clinician.

Screens transition with a short fade and slide. The app follows the device theme by default; use the sun/moon control in the top bar to preview either mode. Both modes use the supplied gym and body-map photos from `assets/onboarding/`. Inputs and selections remain in local app state for the current session. The top banner marks this as a prototype: account sign-in, workout generation, store billing, policy pages, and notification delivery are not connected. The week is illustrative and must not be treated as a reviewed injury-adapted workout. Shared dark and light semantic colors live in `src/design/tokens.ts` and are used across onboarding and training screens.

## Run locally

```sh
npm install
npm start
```

Use Expo Go to scan the QR code, or run `npm run android` / `npm run ios` with a configured native development environment. Expo Router remains the app foundation.
