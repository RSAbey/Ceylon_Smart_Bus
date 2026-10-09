// Turning the app lock on for the first time (Member 01, NFR-07): a PIN and the same PIN again, so
// a mistyped digit cannot lock somebody out of their own app.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import { APP_PIN_LENGTH } from '../../../utils/constants';
import { colors, spacing, typography } from '../../../theme';
import { createAppPin } from '../services/appPinApi';
import { APP_LOCK_MESSAGES } from '../constants';

/**
 * The create-a-PIN form, shown while the lock is off.
 * @param {object} props - Component props.
 * @param {Function} props.onCreated - Called with the new lock state once the PIN is stored.
 * @returns {import('react').JSX.Element} The form.
 */
export default function CreateAppPinForm({ onCreated }) {
  const [chosenPin, setChosenPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const turnLockOn = async () => {
    const formErrors = {};
    if (chosenPin.length !== APP_PIN_LENGTH) formErrors.pin = APP_LOCK_MESSAGES.pinTooShort;
    else if (confirmPin !== chosenPin) formErrors.confirmPin = APP_LOCK_MESSAGES.confirmMismatch;
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsSaving(true);
    try {
      const newStatus = await createAppPin(chosenPin);
      setChosenPin('');
      setConfirmPin('');
      onCreated(newStatus);
    } catch (createError) {
      setFieldErrors(
        Object.keys(createError.fieldErrors || {}).length > 0
          ? createError.fieldErrors
          : { pin: createError.message }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.formBlock}>
      <Text style={typography.sectionHeading}>{APP_LOCK_MESSAGES.createHeading}</Text>
      <Text style={[typography.bodySmall, styles.mutedText]}>
        {`${APP_PIN_LENGTH} digits. Choose something you will remember but a stranger would not guess.`}
      </Text>
      <AppTextInput
        label={APP_LOCK_MESSAGES.pinLabel}
        placeholder={'•'.repeat(APP_PIN_LENGTH)}
        value={chosenPin}
        onChangeText={(typedText) => setChosenPin(typedText.replace(/\D/g, ''))}
        errorText={fieldErrors.pin}
        isPasswordField
        keyboardType="number-pad"
        maxLength={APP_PIN_LENGTH}
      />
      <AppTextInput
        label={APP_LOCK_MESSAGES.confirmPinLabel}
        placeholder={'•'.repeat(APP_PIN_LENGTH)}
        value={confirmPin}
        onChangeText={(typedText) => setConfirmPin(typedText.replace(/\D/g, ''))}
        errorText={fieldErrors.confirmPin}
        isPasswordField
        keyboardType="number-pad"
        maxLength={APP_PIN_LENGTH}
      />
      <AppButton
        label={APP_LOCK_MESSAGES.createAction}
        iconName="lock-closed-outline"
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={turnLockOn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formBlock: {
    gap: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
  },
});
