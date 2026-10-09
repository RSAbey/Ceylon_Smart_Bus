// A small state chip for the admin screens.
// StatusBadge is a fixed vocabulary of passenger-facing statuses (On time, Valid, Cancelled...) with
// its own labels and icons. The admin screens show different states entirely — draft, published,
// suspended, on leave, high priority — so this chip takes the words and a tone instead, and keeps
// an icon beside them so a state is never told by colour alone (NFR-09).
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, sizes, spacing, typography } from '../../../theme';

/** One entry per tone: the palette family and the icon that carries the same meaning. */
const CHIP_TONES = Object.freeze({
  success: { palette: colors.success, iconName: 'checkmark-circle' },
  warning: { palette: colors.warning, iconName: 'alert-circle' },
  error: { palette: colors.error, iconName: 'close-circle' },
  information: { palette: colors.information, iconName: 'information-circle' },
  neutral: {
    palette: { light: colors.background, dark: colors.text.secondary },
    iconName: 'ellipse-outline',
  },
});

/**
 * The chip.
 * @param {object} props - Component props.
 * @param {string} props.label - Words shown in the chip.
 * @param {'success'|'warning'|'error'|'information'|'neutral'} [props.tone] - Which colours to use.
 * @returns {import('react').JSX.Element} The chip.
 */
export default function AdminStatusChip({ label, tone = 'neutral' }) {
  const chipTone = CHIP_TONES[tone] || CHIP_TONES.neutral;

  return (
    <View style={[styles.chip, { backgroundColor: chipTone.palette.light }]}>
      <Ionicons name={chipTone.iconName} size={sizes.iconSmall} color={chipTone.palette.dark} />
      <Text style={[typography.caption, { color: chipTone.palette.dark }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
  },
});
