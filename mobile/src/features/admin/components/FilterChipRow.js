// The filter chips above an admin list, the phone version of the dashboard's filter row. Each chip
// carries its own count in a badge, which is how an administrator sees there are 3 drafts without
// opening the filter at all.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';

/**
 * One filter chip.
 * @param {object} props - Component props.
 * @param {object} props.filterChip - { key, label, count }; count may be undefined.
 * @param {boolean} props.isSelected - Whether this filter is the one applied.
 * @param {Function} props.onPress - Applies this filter.
 * @returns {import('react').JSX.Element} The chip.
 */
function FilterChip({ filterChip, isSelected, onPress }) {
  const hasCount = filterChip.count !== undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={hasCount ? `${filterChip.label}, ${filterChip.count}` : filterChip.label}
      style={({ pressed }) => [
        styles.chip,
        isSelected && styles.chipSelected,
        pressed && !isSelected && styles.chipPressed,
      ]}
    >
      <Text style={[typography.bodySmall, isSelected ? styles.chipTextSelected : styles.chipText]}>
        {filterChip.label}
      </Text>
      {hasCount && (
        <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
          <Text
            style={[
              typography.caption,
              isSelected ? styles.countTextSelected : styles.countText,
            ]}
          >
            {filterChip.count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

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
      // A ScrollView gives itself flexGrow: 1, so inside a scrolling screen this row would swallow
      // every spare pixel of height and the chips would stretch down the page with it.
      style={styles.row}
      contentContainerStyle={styles.rowContent}
    >
      {chips.map((filterChip) => (
        <FilterChip
          key={filterChip.key}
          filterChip={filterChip}
          isSelected={filterChip.key === selectedKey}
          onPress={() => onSelect(filterChip.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexGrow: 0,
  },
  rowContent: {
    flexDirection: 'row',
    // Without this the chips stretch to the full height of the row rather than hugging their text.
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: MIN_TOUCH_TARGET,
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
  countBadge: {
    minWidth: sizes.iconMedium,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: colors.primary[500],
  },
  countText: {
    color: colors.text.secondary,
  },
  countTextSelected: {
    color: colors.text.onColor,
  },
});
