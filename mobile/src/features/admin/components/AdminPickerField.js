// A choose-one field for the admin forms. The dashboard uses a <select>; a dropdown on a phone
// hides its options behind a tap, so the options are drawn as pills instead — every choice is
// visible, and each one is a full-size touch target.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';

/**
 * The field.
 * @param {object} props - Component props.
 * @param {string} props.label - Field label.
 * @param {Array<{key: string, label: string}>} props.options - The choices, in display order.
 * @param {string | null} props.selectedKey - Which option is chosen.
 * @param {Function} props.onSelect - Called with the key that was tapped.
 * @param {string} [props.helperText] - Hint under the field when there is no error.
 * @param {string} [props.errorText] - Error under the field; shown with an icon, never colour alone.
 * @returns {import('react').JSX.Element} The field.
 */
export default function AdminPickerField({
  label,
  options,
  selectedKey,
  onSelect,
  helperText,
  errorText,
}) {
  const hasError = Boolean(errorText);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[typography.label, styles.labelText]}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((pickerOption) => {
          const isSelected = pickerOption.key === selectedKey;
          return (
            <Pressable
              key={pickerOption.key}
              onPress={() => onSelect(pickerOption.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={pickerOption.label}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  isSelected ? styles.optionTextSelected : styles.optionText,
                ]}
              >
                {pickerOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {Boolean(errorText) && (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
          <Text style={[typography.caption, styles.errorText]}>{errorText}</Text>
        </View>
      )}
      {!hasError && Boolean(helperText) && (
        <Text style={[typography.caption, styles.helperText]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    gap: spacing.xs,
  },
  labelText: {
    color: colors.text.primary,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[100],
  },
  optionPressed: {
    backgroundColor: colors.primary[200],
  },
  optionText: {
    color: colors.text.secondary,
  },
  optionTextSelected: {
    color: colors.primary[600],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    color: colors.error.dark,
  },
  helperText: {
    color: colors.text.secondary,
  },
});
