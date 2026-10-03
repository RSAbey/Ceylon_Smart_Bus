// Colour tokens copied from docs/design/color-palette.png (the source of truth). Screens must use these, never raw hex.

export const colors = Object.freeze({
  /** Primary — Transit Blue: primary buttons, active navigation, links, selected states. */
  primary: Object.freeze({
    100: '#E6F0FA',
    200: '#C2DCF4',
    300: '#8FBEEC',
    400: '#5299E0',
    500: '#1E75D5',
    600: '#0F4C81',
    700: '#0C3C67',
    800: '#092E4E',
    900: '#051C30',
  }),
  /** Secondary — Action Amber/Orange: secondary actions, accents, highlights, attention areas. */
  secondary: Object.freeze({
    100: '#FFF3E6',
    200: '#FFE0BD',
    300: '#FFC585',
    400: '#FFA347',
    500: '#FF7A00',
    600: '#E66700',
    700: '#BF5300',
    800: '#993F00',
    900: '#662700',
  }),
  /** Success — valid ticket / on time. */
  success: Object.freeze({ light: '#ECFDF5', main: '#10B981', dark: '#047857' }),
  /** Warning — bus delayed / low balance. */
  warning: Object.freeze({ light: '#FFFBEB', main: '#F59E0B', dark: '#B45309' }),
  /** Error — ticket expired / cancelled, destructive actions. */
  error: Object.freeze({ light: '#FEF2F2', main: '#EF4444', dark: '#B91C1C' }),
  /** Information — route updates. The palette has no "Info Dark"; #1D4ED8 is our addition (see DESIGN_DEVIATIONS.md). */
  information: Object.freeze({ light: '#EFF6FF', main: '#3B82F6', dark: '#1D4ED8' }),

  /** Neutrals & surfaces. */
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: Object.freeze({
    primary: '#0F172A',
    secondary: '#64748B',
    disabled: '#94A3B8',
    onColor: '#FFFFFF',
  }),
  /** Dimmed backdrop behind dialogs and the drawer: Primary Text (#0F172A) at 50 % opacity. */
  overlay: 'rgba(15, 23, 42, 0.5)',
});
