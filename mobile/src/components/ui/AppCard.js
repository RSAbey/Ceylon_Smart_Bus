// Shared white card with border, radius and soft shadow; becomes pressable when onPress is given.
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, opacities, radii, shadows, sizes, spacing } from '../../theme';

/**
 * Card container used for lists (tickets, notifications, routes...).
 * @param {object} props - Component props.
 * @param {import('react').ReactNode} props.children - Card content.
 * @param {Function} [props.onPress] - Makes the whole card a button.
 * @param {string} [props.accessibilityLabel] - Required when onPress is set, so screen readers can name the card.
 * @param {object} [props.style] - Extra style (layout only).
 * @returns {import('react').JSX.Element} The card.
 */
export default function AppCard({ children, onPress, accessibilityLabel, style }) {
  if (!onPress) {
    return <View style={[styles.cardBase, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.cardBase, pressed && styles.cardPressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardPressed: {
    opacity: opacities.pressed,
  },
});
