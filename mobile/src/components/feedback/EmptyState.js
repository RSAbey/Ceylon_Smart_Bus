// "Nothing here yet" view with an icon, explanation and optional next action (the "empty" state).
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../theme';
import AppButton from '../ui/AppButton';

const ICON_CIRCLE_SIZE = sizes.iconHuge + spacing.xxl;

/**
 * Empty list / no results view.
 * @param {object} props - Component props.
 * @param {string} props.title - Short headline, for example "No tickets yet".
 * @param {string} [props.message] - One sentence telling the user what to do next.
 * @param {string} [props.iconName] - Ionicons name.
 * @param {string} [props.actionLabel] - Button text for the next step.
 * @param {Function} [props.onActionPress] - Button handler (button shown only when both are set).
 * @returns {import('react').JSX.Element} Empty view.
 */
export default function EmptyState({ title, message, iconName = 'file-tray-outline', actionLabel, onActionPress }) {
  return (
    <View style={styles.centeredArea}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={sizes.iconXLarge} color={colors.primary[500]} />
      </View>
      <Text style={[typography.heading3, styles.titleText]}>{title}</Text>
      {Boolean(message) && <Text style={[typography.bodyMedium, styles.messageText]}>{message}</Text>}
      {Boolean(actionLabel && onActionPress) && <AppButton label={actionLabel} onPress={onActionPress} />}
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
    backgroundColor: colors.primary[100],
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
