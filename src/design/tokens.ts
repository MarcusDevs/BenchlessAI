/** Shared Benchless AI design tokens. Keep onboarding and product surfaces on one palette. */
export const benchlessColors = {
  dark: {
    background: '#0C1110',
    surface: '#171E1B',
    surfaceRaised: '#202923',
    surfaceSelected: '#242E25',
    accent: '#D2EE8B',
    accentStrong: '#A9C660',
    onAccent: '#0C1110',
    text: '#F4F5F0',
    secondaryText: '#A0AAA4',
    tertiaryText: '#75817A',
    border: '#2A332E',
    danger: '#F0B3A6',
    dangerSurface: '#2A211F',
    progressTrack: '#35413F',
  },
  light: {
    background: '#FAFAF8',
    surface: '#F0F2ED',
    surfaceRaised: '#E7EBE4',
    surfaceSelected: '#EFF5DE',
    accent: '#CDEB8E',
    accentStrong: '#738B45',
    onAccent: '#171C18',
    text: '#171C18',
    secondaryText: '#667068',
    tertiaryText: '#778078',
    border: '#DDE1DA',
    danger: '#A43D30',
    dangerSurface: '#FFF0EC',
    progressTrack: '#E1E4DE',
  },
} as const;

/** Shared type, spacing, radius, and control-size scales, expressed in React Native points. */
export const designTokens = {
  type: { caption: 12, footnote: 13, body: 17, bodyCompact: 15, title: 28, largeTitle: 34 },
  lineHeight: { caption: 16, body: 24, bodyCompact: 21, title: 34, largeTitle: 41 },
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 },
  radius: { control: 12, card: 18, sheet: 26, pill: 999 },
  control: { minimum: 44, tabBar: 64 },
} as const;

export type ColorScheme = keyof typeof benchlessColors;
