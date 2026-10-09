// Turning the app lock off (Member 01, NFR-07). The account password is what proves ownership here,
// not the PIN: that way forgetting the PIN never locks somebody out of their own app for good.
import { useState } from 'react';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import { deleteAppPin } from '../services/appPinApi';
import { APP_LOCK_MESSAGES } from '../constants';
import BottomSheetCard from './BottomSheetCard';

/**
 * The turn-off sheet.
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Whether the sheet is open.
 * @param {Function} props.onClose - Closes the sheet without removing anything.
 * @param {Function} props.onRemoved - Called with the new lock state once the PIN is gone.
 * @returns {import('react').JSX.Element} The sheet.
 */
export default function RemoveAppPinDialog({ isVisible, onClose, onRemoved }) {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const closeAndForget = () => {
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const turnLockOff = async () => {
    if (!password) {
      setErrorMessage(APP_LOCK_MESSAGES.passwordRequired);
      return;
    }

    setIsRemoving(true);
    try {
      const newStatus = await deleteAppPin(password);
      closeAndForget();
      onRemoved(newStatus);
    } catch (removeError) {
      setErrorMessage(removeError.fieldErrors?.password || removeError.message);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <BottomSheetCard
      isVisible={isVisible}
      title={APP_LOCK_MESSAGES.removeHeading}
      explanation={APP_LOCK_MESSAGES.removeExplanation}
      onClose={closeAndForget}
    >
      <AppTextInput
        label={APP_LOCK_MESSAGES.passwordLabel}
        placeholder="The password you sign in with"
        value={password}
        onChangeText={setPassword}
        errorText={errorMessage}
        isPasswordField
        autoComplete="current-password"
      />
      <AppButton
        label={APP_LOCK_MESSAGES.removeAction}
        variant="error"
        size="large"
        isFullWidth
        isLoading={isRemoving}
        onPress={turnLockOff}
      />
    </BottomSheetCard>
  );
}
