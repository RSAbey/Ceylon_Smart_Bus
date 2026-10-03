# Design tokens — Ceylon Smart Bus

Single list of every token used by **mobile** (`mobile/src/theme/*.js`) and **admin** (`admin/src/theme/tokens.css`).
Colours are copied from [color-palette.png](color-palette.png) (source of truth). Type style names come from
[typography-scale.png](typography-scale.png); **sizes and weights are not printed in that PNG, so the values below are
our estimates** — confirm them against Figma. Conflicts between PNGs are logged in [DESIGN_DEVIATIONS.md](DESIGN_DEVIATIONS.md).

Never write a hex colour, font size or spacing number in a screen — import the token.

## Colours

### Primary — Transit Blue (`colors.primary[N]` · `--primary-N`)
| Token | Hex | Typical use |
|---|---|---|
| 100 | `#E6F0FA` | Selected row / pressed tab background, avatar circle |
| 200 | `#C2DCF4` | |
| 300 | `#8FBEEC` | |
| 400 | `#5299E0` | |
| 500 | `#1E75D5` | **Main** — primary button, links, focus border on inputs |
| 600 | `#0F4C81` | Primary button pressed, active tab + indicator, selected text |
| 700 | `#0C3C67` | Keyboard focus ring on buttons |
| 800 | `#092E4E` | |
| 900 | `#051C30` | |

### Secondary — Action Amber/Orange (`colors.secondary[N]` · `--secondary-N`)
| Token | Hex | Typical use |
|---|---|---|
| 100 | `#FFF3E6` | |
| 200 | `#FFE0BD` | |
| 300 | `#FFC585` | |
| 400 | `#FFA347` | |
| 500 | `#FF7A00` | **Main** — secondary button, unread dot |
| 600 | `#E66700` | (button hover on web) |
| 700 | `#BF5300` | Secondary button pressed |
| 800 | `#993F00` | |
| 900 | `#662700` | |

### Semantic (`colors.<name>.light|main|dark` · `--<name>-light|main|dark`)
| Name | Light | Main | Dark | Meaning |
|---|---|---|---|---|
| success | `#ECFDF5` | `#10B981` | `#047857` | Valid ticket / on time |
| warning | `#FFFBEB` | `#F59E0B` | `#B45309` | Bus delayed / low balance |
| error | `#FEF2F2` | `#EF4444` | `#B91C1C` | Ticket expired / cancelled, destructive |
| information | `#EFF6FF` | `#3B82F6` | `#1D4ED8`* | Route updates |

\* Not in the palette — added by us (see DESIGN_DEVIATIONS.md). The token is named `information` (not `info`)
because `info` is on the team's banned-identifier list.

### Neutrals & surfaces
| Token (mobile · admin) | Hex |
|---|---|
| `colors.background` · `--color-background` | `#F8FAFC` |
| `colors.surface` · `--color-surface` | `#FFFFFF` |
| `colors.card` · `--color-card` | `#FFFFFF` |
| `colors.border` · `--color-border` | `#E2E8F0` |
| `colors.text.primary` · `--text-primary` | `#0F172A` |
| `colors.text.secondary` · `--text-secondary` | `#64748B` |
| `colors.text.disabled` · `--text-disabled` | `#94A3B8` |
| `colors.text.onColor` · `--text-on-color` | `#FFFFFF` |
| `colors.overlay` · `--color-overlay` | `rgba(15, 23, 42, 0.5)` (Primary Text at 50 %) |

## Typography — Inter (`typography.<style>` · `.text-<style>` / `--font-size-<style>`)

Mobile loads `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` (@expo-google-fonts/inter).
Admin loads Inter 400–700 from Google Fonts with a system fallback stack.

| Style (PNG name) | Example in PNG | Size / line height (px) | Weight | Extra |
|---|---|---|---|---|
| Display / Page Title | Find Your Bus | 28 / 34 | 700 | |
| Heading 1 | Where are you going? | 24 / 30 | 700 | |
| Heading 2 | Nearby Buses | 20 / 26 | 600 | |
| Heading 3 | Bus 138 — Pettah | 18 / 24 | 600 | |
| Section Heading | RECENT SEARCHES | 13 / 18 | 600 | uppercase, letter-spacing 1.2 |
| Body Large | Find a bus or route… | 16 / 24 | 400 | |
| Body Medium | Your bus is arriving in 5 minutes. | 14 / 20 | 400 | |
| Body Small | Via Kaduwela • 12 stops | 13 / 18 | 400 | |
| Caption | Updated 20 seconds ago | 12 / 16 | 400 | |
| Label | DESTINATION | 12 / 16 | 500 | uppercase, letter-spacing 1 |
| Button Text | Track Bus | 16 / 20 | 600 | |

## Spacing (4-based) — `spacing.<key>` · `--space-<key>`
| xxs | xs | sm | md | lg | xl | xxl | xxxl | huge |
|---|---|---|---|---|---|---|---|---|
| 2 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 48 |

## Radii — `radii.<key>` · `--radius-<key>`
| sm | md | lg | xl | pill |
|---|---|---|---|---|
| 6 | 8 | 12 | 16 | 999 |

## Sizes
| Token | Value | Source |
|---|---|---|
| `MIN_TOUCH_TARGET` | 44 | Design brief (≥ 44 px targets) |
| `sizes.headerHeight` | 64 | Navigation PNG "64px bar" |
| `sizes.screenGutter` | 16 | Navigation PNG "16px horizontal insets" |
| `sizes.buttonSmall / Medium / Large` | 36 / 44 / 52 | Button PNG |
| `sizes.bottomTabHeight` | 56 | Estimate |
| `sizes.iconSmall / Medium / Large / XLarge / Huge` | 16 / 20 / 24 / 32 / 48 | Estimate |
| `sizes.avatar` | 36 | Estimate |
| `sizes.unreadDot` | 8 | Estimate |
| `sizes.activeIndicatorWidth / Height` | 24 / 3 | Estimate from Navigation PNG |
| `sizes.drawerWidth` | 300 | Estimate |
| `sizes.borderThin / Thick` | 1 / 2 | Button PNG (focused = thick) |
| Admin `--sidebar-width` / `--topbar-height` | 248 / 64 | Estimate |

## Shadows, opacity, motion
| Token | Value |
|---|---|
| `shadows.card` · `--shadow-card` | Primary Text colour, opacity 0.06, blur 8, y 2 (elevation 2) |
| `shadows.raised` · `--shadow-raised` | Primary Text colour, opacity 0.12, blur 16, y 6 (elevation 8) |
| `opacities.pressed` / `disabled` | 0.85 / 0.6 |
| `durations.fast` / `normal` / `toastVisible` | 150 / 250 / 3000 ms |

## Button state mapping (palette tokens)
| Variant | Default | Pressed | Text | Disabled |
|---|---|---|---|---|
| primary | primary-500 | primary-600 | on-color | border bg + text-disabled |
| secondary | secondary-500 | secondary-700 | on-color | same |
| outline | surface + primary-500 border | primary-100 bg | primary-500 | same |
| text | transparent | primary-100 bg | primary-500 | same |
| success / error / warning / information | `<name>.dark` | `<name>.main` | on-color | same |

Focused (keyboard / accessibility focus): 2 px primary-700 border. Loading: spinner + "Loading…", presses blocked.
