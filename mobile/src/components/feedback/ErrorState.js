// Error view with a clear message and a Retry button (the "error" state every screen must have).
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../theme';
import AppButton from '../ui/AppButton';

const ICON_CIRCLE_SIZE = sizes.iconHuge + spacing.xxl;

/**
 * Shown when loading failed.
 * @param {object} props - Component props.
 * @param {string} [props.title] - Headline.
 * @param {string} [props.message] - The normalised API error message.
 * @param {Function} [props.onRetry] - Retry handler; the button is hidden without it.
 * @returns {import('react').JSX.Element} Error view.
 */
export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <View style={styles.centeredArea} accessibilityRole="alert">
      <View style={styles.iconCircle}>
        <Ionicons name="cloud-offline-outline" size={sizes.iconXLarge} color={colors.error.dark} />
      </View>
      <Text style={[typography.heading3, styles.titleText]}>{title}</Text>
      {Boolean(message) && <Text style={[typography.bodyMedium, styles.messageText]}>{message}</Text>}
      {Boolean(onRetry) && <AppButton label="Try again" iconName="refresh" variant="outline" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.error.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: colors.text.primary,
    textAlign: 'center',
  },
  messageText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
