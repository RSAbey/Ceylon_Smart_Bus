# Design deviations — where the design PNGs disagree, and what we chose

Rule: **color-palette.png is the source of truth** for colour. Hex values for the button PNG were sampled from the
image pixels (they are not printed on it). The group should confirm each row against the Figma file and update this
table if Figma says otherwise.

| Item | Design PNG A | Design PNG B | Chosen | Reason |
|---|---|---|---|---|
| Primary button default | Button_Components.png: `#2563EB` | color-palette.png Primary 500: `#1E75D5` | `#1E75D5` (primary-500) | Palette is the source of truth; `#2563EB` is not in the palette |
| Primary button hover | Button PNG: `#1E75D5` | Palette Primary 500 | Not used on mobile (no hover); admin hover = primary-600 | Touch screens have no hover; the PNG hover colour equals our default |
| Primary button pressed | Button PNG: `#0F4C81` | Palette Primary 600: `#0F4C81` | primary-600 | Same value — no conflict |
| Secondary button default | Button PNG: `#F97316` | Palette Secondary 500: `#FF7A00` | `#FF7A00` (secondary-500) | Palette is the source of truth |
| Secondary button hover / pressed | Button PNG: `#E66700` / `#BF5300` | Palette Secondary 600 / 700 | hover 600 (admin only), pressed 700 | Same values — no conflict |
| Focus ring | Button PNG: `#2563EB` thick border | Palette has no `#2563EB` | 2 px primary-700 `#0C3C67` | A primary-500 ring would be invisible on a primary-500 button |
| Disabled button background | Button PNG: `#E5E7EB` | Palette Border: `#E2E8F0` | `#E2E8F0` (border token) | Nearly identical; reuse the palette neutral |
| Disabled button text | Button PNG: `#D1D5DB` | Palette Disabled Text: `#94A3B8` | `#94A3B8` | Palette value and more readable (PNG value is ~1.2:1 on its background) |
| Semantic "Success" button | Button PNG: `#22C55E` | Palette Success Main: `#10B981` | Success **Dark** `#047857` background | White text on `#22C55E` / `#10B981` is below WCAG AA (≈2.3–2.5:1); Dark gives ≈5.5:1 |
| Semantic "Warning" button | Button PNG: `#EAB308` | Palette Warning Main: `#F59E0B` | Warning **Dark** `#B45309` | White text on yellow fails contrast (≈2:1) |
| Semantic "Error" button | Button PNG: `#EF4444` | Palette Error Main: `#EF4444` | Error **Dark** `#B91C1C` | Same main value, but white text on `#EF4444` is ≈3.8:1 (below AA for 16 px) |
| Semantic "Information" button | Button PNG: `#0EA5E9` | Palette Info Main: `#3B82F6` | Info **Dark** `#1D4ED8` | `#0EA5E9` is not in the palette; white text needs a darker blue |
| Info Dark token | — | Palette shows only Info Light + Info Main | Added `#1D4ED8` | Every other semantic colour has Light/Main/Dark; needed for text on light info backgrounds |
| Secondary button text contrast | Button PNG: white on orange | Palette Secondary 500 `#FF7A00` | Kept white on secondary-500 (as designed) | **Group to decide:** white on `#FF7A00` is ≈2.6:1 (fails AA). Option: use secondary-700 `#BF5300` (≈4.7:1) |
| Typography sizes / weights | typography-scale.png shows names + samples only | — | Estimated values (see DESIGN_TOKENS.md) | Not printed in the PNG; confirm in Figma |
| Drawer menu items | Navigation PNG lists Travel History and Settings | Milestone 03 scope (no owner) | Omitted | No member builds these screens; recorded in `docs/evidence/m04/deviations.md` |
| Navigation PNG file name | DEVELOPER_GUIDE §5 refers to `docs/design/Navigation_Components.png` | Actual file: `Ceylon_Smart_Bus___Navigation_Components.png` | Kept the actual file name | Docs were not edited; update the guide reference if wanted |
| App icon size | app_icon_1.png is 999 × 999 with a transparent glow margin | Expo expects 1024 × 1024 square | Used as is (not resized or distorted) | **Group to fix:** export a 1024 × 1024 icon without the transparent margin from Figma |
