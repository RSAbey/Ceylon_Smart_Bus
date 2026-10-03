// Shared text field: label, helper or error text, optional leading icon and show/hide password toggle.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../theme';

/**
 * Labelled input. Extra TextInput props (keyboardType, autoCapitalize, autoComplete...) are passed through.
 * @param {object} props - Component props.
 * @param {string} props.label - Visible label (also the accessibility label).
 * @param {string} props.value - Current text (controlled input).
 * @param {Function} props.onChangeText - Called with the new text.
 * @param {string} [props.helperText] - Hint shown under the field when there is no error.
 * @param {string} [props.errorText] - Error shown under the field (icon + text, never colour alone).
 * @param {string} [props.iconName] - Optional Ionicons name shown inside the field.
 * @param {boolean} [props.isPasswordField] - Hides the text and shows a show/hide toggle.
 * @returns {import('react').JSX.Element} The input.
 */
export default function AppTextInput({
  label,
  value,
  onChangeText,
  helperText,
  errorText,
  iconName,
  isPasswordField = false,
  ...textInputProps
}) {
  const [isTextHidden, setIsTextHidden] = useState(isPasswordField);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = Boolean(errorText);
  const fieldBorderColor = hasError ? colors.error.main : isFocused ? colors.primary[500] : colors.border;

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[typography.label, styles.labelText]}>{label}</Text>
      <View style={[styles.inputRow, { borderColor: fieldBorderColor }]}>
        {Boolean(iconName) && <Ionicons name={iconName} size={sizes.iconMedium} color={colors.text.secondary} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isTextHidden}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.text.disabled}
          accessibilityLabel={label}
          accessibilityHint={hasError ? errorText : helperText}
          style={[typography.bodyLarge, styles.textInput]}
          {...textInputProps}
        />
        {isPasswordField && (
          <Pressable
            onPress={() => setIsTextHidden((wasHidden) => !wasHidden)}
            accessibilityRole="button"
            accessibilityLabel={isTextHidden ? 'Show password' : 'Hide password'}
            style={styles.toggleButton}
          >
            <Ionicons
              name={isTextHidden ? 'eye-outline' : 'eye-off-outline'}
              size={sizes.iconMedium}
              color={colors.text.secondary}
            />
          </Pressable>
        )}
      </View>
      {hasError ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
          <Text style={[typography.caption, { color: colors.error.dark }]}>{errorText}</Text>
        </View>
      ) : (
        Boolean(helperText) && <Text style={[typography.caption, styles.helperText]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    gap: spacing.xs,
  },
  labelText: {
    color: colors.text.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: sizes.borderThin,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  toggleButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  helperText: {
    color: colors.text.secondary,
  },
});
