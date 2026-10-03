// Shared button from Button_Components.png: variants, three sizes and default/pressed/focused/disabled/loading states.
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../theme';

const LOADING_LABEL = 'Loading...';

/**
 * Colours per variant, mapped onto palette tokens (see docs/design/DESIGN_DEVIATIONS.md for why).
 * Semantic buttons use the palette "dark" shade so white text keeps WCAG AA contrast.
 */
const VARIANT_COLORS = Object.freeze({
  primary: { background: colors.primary[500], pressedBackground: colors.primary[600], text: colors.text.onColor },
  secondary: { background: colors.secondary[500], pressedBackground: colors.secondary[700], text: colors.text.onColor },
  outline: {
    background: colors.surface,
    pressedBackground: colors.primary[100],
    text: colors.primary[500],
    border: colors.primary[500],
  },
  text: { background: 'transparent', pressedBackground: colors.primary[100], text: colors.primary[500] },
  success: { background: colors.success.dark, pressedBackground: colors.success.main, text: colors.text.onColor },
  error: { background: colors.error.dark, pressedBackground: colors.error.main, text: colors.text.onColor },
  warning: { background: colors.warning.dark, pressedBackground: colors.warning.main, text: colors.text.onColor },
  information: { background: colors.information.dark, pressedBackground: colors.information.main, text: colors.text.onColor },
});

const SIZE_HEIGHTS = Object.freeze({
  small: sizes.buttonSmall,
  medium: sizes.buttonMedium,
  large: sizes.buttonLarge,
});

/**
 * Works out background, border and text colours for the current state.
 * @param {object} variantColors - Entry from VARIANT_COLORS.
 * @param {{isPressed: boolean, isFocused: boolean, isInactive: boolean}} buttonState - Current interaction state.
 * @returns {{backgroundColor: string, borderColor: string, borderWidth: number, textColor: string}} Resolved colours.
 */
function resolveStateColors(variantColors, { isPressed, isFocused, isInactive }) {
  if (isInactive) {
    return {
      backgroundColor: colors.border,
      borderColor: colors.border,
      borderWidth: sizes.borderThin,
      textColor: colors.text.disabled,
    };
  }
  const restingBorder = variantColors.border || variantColors.background;
  return {
    backgroundColor: isPressed ? variantColors.pressedBackground : variantColors.background,
    // The design shows focus as a thicker blue outline around the button.
    borderColor: isFocused ? colors.primary[700] : restingBorder,
    borderWidth: isFocused ? sizes.borderThick : sizes.borderThin,
    textColor: variantColors.text,
  };
}

/**
 * Accessible button used on every screen. The touch area is never smaller than 44 px (small buttons get hitSlop).
 * @param {object} props - Component props.
 * @param {string} props.label - Visible text.
 * @param {Function} props.onPress - Called when tapped.
 * @param {'primary'|'secondary'|'outline'|'text'|'success'|'error'|'warning'|'information'} [props.variant] - Visual style.
 * @param {'small'|'medium'|'large'} [props.size] - Height 36 / 44 / 52.
 * @param {string} [props.iconName] - Optional Ionicons name shown before the label.
 * @param {boolean} [props.isDisabled] - Greys out and blocks presses.
 * @param {boolean} [props.isLoading] - Shows a spinner + "Loading..." and blocks presses.
 * @param {boolean} [props.isFullWidth] - Stretch to the container width.
 * @param {string} [props.accessibilityLabel] - Screen-reader text (defaults to label).
 * @param {object} [props.style] - Extra container style (layout only).
 * @returns {import('react').JSX.Element} The button.
 */
export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  iconName,
  isDisabled = false,
  isLoading = false,
  isFullWidth = false,
  accessibilityLabel,
  style,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isInactive = isDisabled || isLoading;
  const variantColors = VARIANT_COLORS[variant] || VARIANT_COLORS.primary;
  const buttonHeight = SIZE_HEIGHTS[size] || SIZE_HEIGHTS.medium;
  // Small buttons are drawn at 36 px but must still be tappable over 44 px.
  const extraTouchSpace = Math.max(0, (sizes.buttonMedium - buttonHeight) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      hitSlop={extraTouchSpace}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      style={({ pressed }) => {
        const stateColors = resolveStateColors(variantColors, { isPressed: pressed, isFocused, isInactive: isDisabled });
        return [
          styles.buttonBase,
          {
            minHeight: buttonHeight,
            backgroundColor: stateColors.backgroundColor,
            borderColor: stateColors.borderColor,
            borderWidth: stateColors.borderWidth,
          },
          isFullWidth && styles.fullWidth,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const { textColor } = resolveStateColors(variantColors, { isPressed: pressed, isFocused, isInactive: isDisabled });
        return (
          <View style={styles.contentRow}>
            {isLoading ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : (
              Boolean(iconName) && <Ionicons name={iconName} size={sizes.iconMedium} color={textColor} />
            )}
            <Text style={[typography.button, { color: textColor }]} numberOfLines={1}>
              {isLoading ? LOADING_LABEL : label}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
