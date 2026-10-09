// The number pad on the app lock screen (Member 01). A pad rather than a text field: the lock is the
// first thing seen when the app opens, and a pad needs no keyboard to appear over it.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_TOUCH_TARGET, colors, opacities, radii, sizes, spacing, typography } from '../../../theme';

/** The two keys that are not digits. */
const KEYPAD_KEYS = Object.freeze({ BLANK: 'blank', BACKSPACE: 'backspace' });

/** Rows exactly as they are drawn, so the layout is readable in one glance. */
const KEYPAD_ROWS = Object.freeze([
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [KEYPAD_KEYS.BLANK, '0', KEYPAD_KEYS.BACKSPACE],
]);

const KEY_DIAMETER = 72;

/**
 * The keypad.
 * @param {object} props - Component props.
 * @param {Function} props.onDigitPress - Called with the digit that was tapped.
 * @param {Function} props.onBackspacePress - Called when the delete key is tapped.
 * @param {boolean} [props.isDisabled] - Blocks every key while a PIN is being checked.
 * @returns {import('react').JSX.Element} The keypad.
 */
export default function PinKeypad({ onDigitPress, onBackspacePress, isDisabled = false }) {
  return (
    <View style={styles.keypad}>
      {KEYPAD_ROWS.map((keypadRow) => (
        <View key={keypadRow.join('')} style={styles.keypadRow}>
          {keypadRow.map((keyLabel) => {
            if (keyLabel === KEYPAD_KEYS.BLANK) {
              return <View key={keyLabel} style={styles.keyCircle} />;
            }
            const isBackspace = keyLabel === KEYPAD_KEYS.BACKSPACE;
            return (
              <Pressable
                key={keyLabel}
                onPress={() => (isBackspace ? onBackspacePress() : onDigitPress(keyLabel))}
                disabled={isDisabled}
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Delete the last digit' : keyLabel}
                style={({ pressed }) => [
                  styles.keyCircle,
                  !isBackspace && styles.digitKey,
                  pressed && styles.keyPressed,
                  isDisabled && styles.keyDisabled,
                ]}
              >
                {isBackspace ? (
                  <Ionicons
                    name="backspace-outline"
                    size={sizes.iconLarge}
                    color={colors.text.secondary}
                  />
                ) : (
                  <Text style={typography.heading2}>{keyLabel}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  keypad: {
    gap: spacing.md,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  keyCircle: {
    width: KEY_DIAMETER,
    height: KEY_DIAMETER,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitKey: {
    backgroundColor: colors.surface,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
  },
  keyPressed: {
    backgroundColor: colors.primary[100],
  },
  keyDisabled: {
    opacity: opacities.disabled,
  },
});
