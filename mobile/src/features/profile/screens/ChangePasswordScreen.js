// Change password (Member 01, NFR-07): the current password is asked for as well as the new one, so
// a phone left unlocked cannot be used to lock its owner out of their own account.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import PasswordStrengthMeter from '../../../components/ui/PasswordStrengthMeter';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, spacing, typography } from '../../../theme';
import { measurePassword } from '../../../utils/passwordRules';
import { changeMyPassword } from '../services/profileApi';
import { PASSWORD_MESSAGES } from '../constants';

/**
 * Change password screen, shared by passengers and drivers.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const savePassword = async () => {
    const formErrors = {};
    if (!currentPassword) formErrors.currentPassword = PASSWORD_MESSAGES.currentRequired;
    if (!measurePassword(newPassword).isStrongEnough) {
      formErrors.newPassword = PASSWORD_MESSAGES.newTooWeak;
    }
    if (confirmPassword !== newPassword) {
      formErrors.confirmPassword = PASSWORD_MESSAGES.confirmMismatch;
    }
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsSaving(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      showSuccessToast(PASSWORD_MESSAGES.changed);
      router.back();
    } catch (changeError) {
      setFieldErrors(changeError.fieldErrors || {});
      if (Object.keys(changeError.fieldErrors || {}).length === 0) {
        showErrorToast(changeError.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Change password"
          onBackPress={router.canGoBack() ? router.back : undefined}
        />
      }
    >
      <Text style={[typography.bodyMedium, styles.mutedText]}>{PASSWORD_MESSAGES.explanation}</Text>

      <View style={styles.formBlock}>
        <AppTextInput
          label="Current password"
          placeholder="The password you sign in with"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          errorText={fieldErrors.currentPassword}
          isPasswordField
          autoComplete="current-password"
        />
        <AppTextInput
          label="New password"
          placeholder="Your new password"
          value={newPassword}
          onChangeText={setNewPassword}
          errorText={fieldErrors.newPassword}
          isPasswordField
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={newPassword} />
        <AppTextInput
          label="Confirm new password"
          placeholder="Type the same password again"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          errorText={fieldErrors.confirmPassword}
          isPasswordField
          autoComplete="new-password"
        />
        <AppButton
          label="Save new password"
          size="large"
          isFullWidth
          isLoading={isSaving}
          onPress={savePassword}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  formBlock: {
    gap: spacing.lg,
  },
});
