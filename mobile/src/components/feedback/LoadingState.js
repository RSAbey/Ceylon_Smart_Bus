// Full-area loading indicator with a short message (the "loading" state every screen must have).
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

/**
 * Centered spinner and message.
 * @param {object} props - Component props.
 * @param {string} [props.message] - What is loading, for example "Loading your tickets...".
 * @returns {import('react').JSX.Element} Loading view.
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <View style={styles.centeredArea} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.primary[500]} />
      <Text style={[typography.bodyMedium, styles.messageText]}>{message}</Text>
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
  messageText: {
    color: colors.text.secondary,
  },
});
