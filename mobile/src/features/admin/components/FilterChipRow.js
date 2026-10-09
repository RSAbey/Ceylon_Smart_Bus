// The filter chips above an admin list, the phone version of the dashboard's filter row. Each chip
// carries its own count, which is how an administrator sees there are 3 drafts without opening the
// filter at all.
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';

/**
 * A scrolling row of filter chips.
 * @param {object} props - Component props.
 * @param {Array<{key: string, label: string, count: number | undefined}>} props.chips - Chips to draw.
 * @param {string} props.selectedKey - Key of the chip currently applied.
 * @param {Function} props.onSelect - Called with the key of the chip that was tapped.
 * @returns {import('react').JSX.Element} The row.
 */
export default function FilterChipRow({ chips, selectedKey, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {chips.map((filterChip) => {
        const isSelected = filterChip.key === selectedKey;
        return (
          <Pressable
            key={filterChip.key}
            onPress={() => onSelect(filterChip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              filterChip.count === undefined
                ? filterChip.label
                : `${filterChip.label}, ${filterChip.count}`
            }
            style={({ pressed }) => [
              styles.chip,
              isSelected && styles.chipSelected,
              pressed && styles.chipPressed,
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                isSelected ? styles.chipTextSelected : styles.chipText,
              ]}
            >
              {filterChip.count === undefined
                ? filterChip.label
                : `${filterChip.label} ${filterChip.count}`}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chip: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipPressed: {
    backgroundColor: colors.primary[100],
  },
  chipText: {
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.text.onColor,
  },
});
