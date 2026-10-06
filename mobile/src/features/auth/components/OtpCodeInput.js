// Six separate digit boxes for the confirmation code, matching the Verification screen.
import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { OTP_DIGIT_COUNT } from '../constants';

const BACKSPACE_KEY = 'Backspace';
const SINGLE_DIGIT_PATTERN = /^\d$/;

/**
 * Controlled 6-box code entry. Typing advances to the next box, backspace returns to the previous one.
 * @param {object} props - Component props.
 * @param {string} props.otpCode - Digits entered so far (0 to 6 characters).
 * @param {Function} props.onOtpCodeChange - Called with the new code string.
 * @param {boolean} [props.hasError] - Draws the boxes in the error colour.
 * @param {boolean} [props.isDisabled] - Blocks typing while verifying.
 * @returns {import('react').JSX.Element} The code input row.
 */
export default function OtpCodeInput({ otpCode, onOtpCodeChange, hasError = false, isDisabled = false }) {
  const boxRefs = useRef([]);
  const digitPositions = Array.from({ length: OTP_DIGIT_COUNT }, (_unused, position) => position);

  const writeDigitAt = (position, typedText) => {
    // Pasting the whole code into one box should fill every box.
    if (typedText.length > 1) {
      const pastedDigits = typedText.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT);
      onOtpCodeChange(pastedDigits);
      boxRefs.current[Math.min(pastedDigits.length, OTP_DIGIT_COUNT - 1)]?.focus();
      return;
    }
    if (typedText && !SINGLE_DIGIT_PATTERN.test(typedText)) return;

    const digits = otpCode.padEnd(OTP_DIGIT_COUNT, ' ').split('');
    digits[position] = typedText || ' ';
    onOtpCodeChange(digits.join('').trimEnd());
    if (typedText && position < OTP_DIGIT_COUNT - 1) boxRefs.current[position + 1]?.focus();
  };

  const stepBackOnEmptyBackspace = (position, pressedKey) => {
    if (pressedKey === BACKSPACE_KEY && !otpCode[position] && position > 0) {
      boxRefs.current[position - 1]?.focus();
    }
  };

  return (
    <View style={styles.boxRow}>
      {digitPositions.map((position) => (
        <TextInput
          key={position}
          ref={(boxElement) => {
            boxRefs.current[position] = boxElement;
          }}
          value={otpCode[position] || ''}
          onChangeText={(typedText) => writeDigitAt(position, typedText)}
          onKeyPress={({ nativeEvent }) => stepBackOnEmptyBackspace(position, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={OTP_DIGIT_COUNT}
          editable={!isDisabled}
          selectTextOnFocus
          accessibilityLabel={`Code digit ${position + 1} of ${OTP_DIGIT_COUNT}`}
          style={[
            styles.digitBox,
            typography.heading2,
            hasError && styles.digitBoxError,
            Boolean(otpCode[position]) && styles.digitBoxFilled,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  digitBox: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET + spacing.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    textAlign: 'center',
  },
  digitBoxFilled: {
    borderColor: colors.primary[500],
    borderWidth: sizes.borderThick,
  },
  digitBoxError: {
    borderColor: colors.error.main,
  },
});
