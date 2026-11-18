# Benchless AI visual foundation

## Design direction

Benchless is a focused strength-training companion. The interface takes its visual cue from a dim, calm training space: near-black green surfaces, soft chalk-like text, and one soft-lime accent for primary actions and selected/progress states. The gym imagery carries the energy; controls stay quiet and familiar.

The onboarding blue-black (`#0C1522`) and brighter lime (`#C6F432`) were inconsistent with the app screens and supplied references. Onboarding now uses the same palette as the training app. The light palette remains intact.

## Shared dark tokens

Source: `src/design/tokens.ts`.

| Role | Color | Use |
| --- | --- | --- |
| Background | `#0C1110` | Main app surface |
| Surface | `#171E1B` | Cards and grouped content |
| Raised surface | `#202923` | Secondary controls |
| Selected surface | `#242E25` | Selected rows and adapted-plan emphasis |
| Accent | `#D2EE8B` | Primary action, selection, progress |
| Primary text | `#F4F5F0` | Titles and key content |
| Secondary text | `#A0AAA4` | Body copy and supporting data |
| Tertiary text | `#75817A` | Quiet supporting labels |
| Border | `#2A332E` | Card/control boundaries |
| Danger | `#F0B3A6` | Safety/error signal, paired with text/icon |

Measured WCAG contrast for dark mode: accent on background **14.81:1**, accent on surface **13.20:1**, primary text on background **17.37:1**, secondary text on background **7.96:1**, and danger on background **10.61:1**. These values cover the named foreground/background pairs; verify other combinations when adding components.

## Type and layout

- Use the platform system font. Keep reading text at 17 points where space permits; avoid text below 11 points.
- Use a clear title/body/metadata hierarchy, with weight and spacing before extra color.
- Touch controls target 44 points or more. Keep related controls grouped, give actions room, and preserve safe-area scrolling on compact devices and with large text.
- Use color plus a label, icon, or shape for selected, locked, warning, and success states.

## Boundaries

- Do not introduce another dark blue/green palette or a screen-specific accent.
- Use the accent for action and meaningful status; do not turn every decorative label lime.
- The injury body map's figure and hotspot colors are illustration tokens and must remain legible against the shared body-map panel.
- Review light mode and dark mode when changing a shared component.
