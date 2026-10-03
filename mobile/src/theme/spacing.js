// Spacing (4-based), radii, sizes and shadows shared by every screen and component.
import { colors } from './colors';

export const spacing = Object.freeze({
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
});

export const radii = Object.freeze({
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
});

/** Minimum touch target from the design brief (WCAG / Material guidance). */
export const MIN_TOUCH_TARGET = 44;

export const sizes = Object.freeze({
  /** App header height and side insets from the Navigation Components PNG. */
  headerHeight: 64,
  screenGutter: 16,
  /** Button heights from the Button Components PNG. */
  buttonSmall: 36,
  buttonMedium: 44,
  buttonLarge: 52,
  bottomTabHeight: 56,
  iconSmall: 16,
  iconMedium: 20,
  iconLarge: 24,
  iconXLarge: 32,
  iconHuge: 48,
  avatar: 36,
  unreadDot: 8,
  activeIndicatorWidth: 24,
  activeIndicatorHeight: 3,
  drawerWidth: 300,
  borderThin: 1,
  borderThick: 2,
});

export const opacities = Object.freeze({
  pressed: 0.85,
  disabled: 0.6,
});

/** Soft card shadow (iOS) + elevation (Android). Shadow colour = Primary Text. */
export const shadows = Object.freeze({
  card: {
    shadowColor: colors.text.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: colors.text.primary,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});

/** Animation durations (ms) for the drawer and toast. */
export const durations = Object.freeze({
  fast: 150,
  normal: 250,
  toastVisible: 3000,
});
