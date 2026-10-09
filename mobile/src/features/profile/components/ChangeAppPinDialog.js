// Changing the app lock PIN (Member 01, NFR-07): the PIN in use is asked for as well as the new
// one, so a phone left unlocked cannot be used to change the lock on it.
import { useState } from 'react';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import { APP_PIN_LENGTH } from '../../../utils/constants';
import { changeAppPin } from '../services/appPinApi';
import { APP_LOCK_MESSAGES } from '../constants';
import BottomSheetCard from './BottomSheetCard';

/**
 * The change-PIN sheet.
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Whether the sheet is open.
 * @param {Function} props.onClose - Closes the sheet without saving.
 * @param {Function} props.onChanged - Called with the new lock state once the PIN is replaced.
 * @returns {import('react').JSX.Element} The sheet.
 */
export default function ChangeAppPinDialog({ isVisible, onClose, onChanged }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const closeAndForget = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setFieldErrors({});
    onClose();
  };

  const saveNewPin = async () => {
    const formErrors = {};
    if (currentPin.length !== APP_PIN_LENGTH) formErrors.currentPin = APP_LOCK_MESSAGES.pinTooShort;
    if (newPin.length !== APP_PIN_LENGTH) formErrors.newPin = APP_LOCK_MESSAGES.pinTooShort;
    else if (confirmPin !== newPin) formErrors.confirmPin = APP_LOCK_MESSAGES.confirmMismatch;
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsSaving(true);
    try {
      const newStatus = await changeAppPin({ currentPin, newPin });
      closeAndForget();
      onChanged(newStatus);
    } catch (changeError) {
      setFieldErrors(
        Object.keys(changeError.fieldErrors || {}).length > 0
          ? changeError.fieldErrors
          : { newPin: changeError.message }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetCard
      isVisible={isVisible}
      title={APP_LOCK_MESSAGES.changeHeading}
      explanation={APP_LOCK_MESSAGES.cannotShowPin}
      onClose={closeAndForget}
    >
      <AppTextInput
        label={APP_LOCK_MESSAGES.currentPinLabel}
        placeholder={'•'.repeat(APP_PIN_LENGTH)}
        value={currentPin}
        onChangeText={(typedText) => setCurrentPin(typedText.replace(/\D/g, ''))}
        errorText={fieldErrors.currentPin}
        isPasswordField
        keyboardType="number-pad"
        maxLength={APP_PIN_LENGTH}
      />
      <AppTextInput
        label={APP_LOCK_MESSAGES.newPinLabel}
        placeholder={'•'.repeat(APP_PIN_LENGTH)}
        value={newPin}
        onChangeText={(typedText) => setNewPin(typedText.replace(/\D/g, ''))}
        errorText={fieldErrors.newPin}
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
        label={APP_LOCK_MESSAGES.changeAction}
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={saveNewPin}
      />
    </BottomSheetCard>
  );
}
