// Type scale using Inter. Style names come from docs/design/typography-scale.png; sizes/weights are our estimates
// because the PNG does not print them (recorded in docs/design/DESIGN_TOKENS.md).

/** Inter files loaded in app/_layout.js. On Android the weight must be chosen through the font family name. */
export const fontFamilies = Object.freeze({
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
});

export const typography = Object.freeze({
  /** Display / Page Title — "Find Your Bus". */
  display: { fontFamily: fontFamilies.bold, fontSize: 28, lineHeight: 34 },
  /** Heading 1 — "Where are you going?". */
  heading1: { fontFamily: fontFamilies.bold, fontSize: 24, lineHeight: 30 },
  /** Heading 2 — "Nearby Buses". */
  heading2: { fontFamily: fontFamilies.semiBold, fontSize: 20, lineHeight: 26 },
  /** Heading 3 — "Bus 138 — Pettah". */
  heading3: { fontFamily: fontFamilies.semiBold, fontSize: 18, lineHeight: 24 },
  /** Section Heading — "RECENT SEARCHES" (uppercase, letter-spaced). */
  sectionHeading: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** Body Large — "Find a bus or route to your destination.". */
  bodyLarge: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  /** Body Medium — "Your bus is arriving in 5 minutes.". */
  bodyMedium: { fontFamily: fontFamilies.regular, fontSize: 14, lineHeight: 20 },
  /** Body Small — "Via Kaduwela • 12 stops". */
  bodySmall: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 18 },
  /** Caption — "Updated 20 seconds ago". */
  caption: { fontFamily: fontFamilies.regular, fontSize: 12, lineHeight: 16 },
  /** Label — "DESTINATION" (uppercase). */
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  /** Button Text — "Track Bus". */
  button: { fontFamily: fontFamilies.semiBold, fontSize: 16, lineHeight: 20 },
});
