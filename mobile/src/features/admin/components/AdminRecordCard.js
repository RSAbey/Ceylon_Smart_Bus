// One row of an admin list. The dashboard shows these as table rows with a row-action menu; a table
// does not fit a phone, so each record becomes a card with its details stacked and its actions
// spelled out as buttons underneath.
import { StyleSheet, Text, View } from 'react-native';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import { colors, spacing, typography } from '../../../theme';
import AdminStatusChip from './AdminStatusChip';

/**
 * The card.
 * @param {object} props - Component props.
 * @param {string} props.title - The record's heading, for example a route number and name.
 * @param {string} [props.subtitle] - One line under the title.
 * @param {Array<{key: string, label: string, tone: string}>} [props.chips] - State chips to show.
 * @param {Array<{key: string, label: string}>} [props.detailLines] - "label: text" lines of detail.
 * @param {Array<object>} [props.actions] - Buttons: { key, label, iconName, variant, onPress, isDisabled }.
 * @returns {import('react').JSX.Element} The card.
 */
export default function AdminRecordCard({
  title,
  subtitle,
  chips = [],
  detailLines = [],
  actions = [],
}) {
  return (
    <AppCard>
      <View style={styles.cardBody}>
        <Text style={typography.heading3}>{title}</Text>
        {Boolean(subtitle) && (
          <Text style={[typography.bodyMedium, styles.mutedText]}>{subtitle}</Text>
        )}

        {chips.length > 0 && (
          <View style={styles.chipRow}>
            {chips.map((recordChip) => (
              <AdminStatusChip key={recordChip.key} label={recordChip.label} tone={recordChip.tone} />
            ))}
          </View>
        )}

        {detailLines.length > 0 && (
          <View style={styles.detailBlock}>
            {detailLines.map((detailLine) => (
              <Text key={detailLine.key} style={[typography.bodySmall, styles.mutedText]}>
                {detailLine.label}
              </Text>
            ))}
          </View>
        )}

        {actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.map((recordAction) => (
              <AppButton
                key={recordAction.key}
                label={recordAction.label}
                iconName={recordAction.iconName}
                variant={recordAction.variant || 'outline'}
                size="small"
                isDisabled={recordAction.isDisabled}
                onPress={recordAction.onPress}
              />
            ))}
          </View>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    gap: spacing.sm,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailBlock: {
    gap: spacing.xxs,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
