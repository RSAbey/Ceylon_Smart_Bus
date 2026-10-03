// Status pill that always shows an icon AND text, so meaning never depends on colour alone.
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamilies, radii, sizes, spacing, typography } from '../../theme';

/** Supported statuses -> label, icon and palette colours (light background + dark text). */
const STATUS_APPEARANCES = Object.freeze({
  onTime: { label: 'On time', iconName: 'checkmark-circle', tone: colors.success },
  delayed: { label: 'Delayed', iconName: 'time', tone: colors.warning },
  disrupted: { label: 'Disrupted', iconName: 'warning', tone: colors.error },
  valid: { label: 'Valid', iconName: 'shield-checkmark', tone: colors.success },
  invalid: { label: 'Invalid', iconName: 'close-circle', tone: colors.error },
  active: { label: 'Active', iconName: 'radio-button-on', tone: colors.information },
  cancelled: { label: 'Cancelled', iconName: 'ban', tone: colors.error },
});

/**
 * Small badge such as "Delayed" or "Valid".
 * @param {object} props - Component props.
 * @param {'onTime'|'delayed'|'disrupted'|'valid'|'invalid'|'active'|'cancelled'} props.status - Which status to show.
 * @param {string} [props.label] - Override text (for example "Delayed 15 min").
 * @returns {import('react').JSX.Element} The badge.
 */
export default function StatusBadge({ status, label }) {
  const statusAppearance = STATUS_APPEARANCES[status] || STATUS_APPEARANCES.active;
  const badgeLabel = label || statusAppearance.label;

  return (
    <View
      style={[styles.badge, { backgroundColor: statusAppearance.tone.light }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${badgeLabel}`}
    >
      <Ionicons name={statusAppearance.iconName} size={sizes.iconSmall} color={statusAppearance.tone.dark} />
      <Text style={[typography.caption, styles.badgeText, { color: statusAppearance.tone.dark }]}>{badgeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontFamily: fontFamilies.semiBold,
  },
});
