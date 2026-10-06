// Edit Profile screen (Member 01): update name, email and mobile, or delete the account (FR-01 update/delete).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/ToastMessage';
import { useAuth } from '../../../context/AuthContext';
import { LOGIN_ROUTE } from '../../../utils/constants';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { deleteMyAccount, updateMyProfile } from '../services/profileApi';
import { DELETE_ACCOUNT_DIALOG } from '../constants';
import { EMAIL_PATTERN, REGISTER_MESSAGES, SRI_LANKA_MOBILE_PATTERN } from '../../auth/constants';

/**
 * Validates the edit form before calling the API.
 * @param {object} profileForm - Current field values.
 * @returns {Object<string, string>} Field name -> error message.
 */
function validateProfileForm(profileForm) {
  const formErrors = {};
  if (!profileForm.fullName.trim()) formErrors.fullName = REGISTER_MESSAGES.fullNameRequired;
  if (!profileForm.email.trim()) formErrors.email = REGISTER_MESSAGES.emailRequired;
  else if (!EMAIL_PATTERN.test(profileForm.email.trim())) formErrors.email = REGISTER_MESSAGES.emailInvalid;
  if (!profileForm.mobile.trim()) formErrors.mobile = REGISTER_MESSAGES.mobileRequired;
  else if (!SRI_LANKA_MOBILE_PATTERN.test(profileForm.mobile.trim()))
    formErrors.mobile = REGISTER_MESSAGES.mobileInvalid;
  return formErrors;
}

/**
 * Edit Profile form, pre-filled from the signed-in user.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function EditProfileScreen() {
  const router = useRouter();
  const { user, replaceCurrentUser, signOut } = useAuth();
  const { showSuccessToast } = useToast();
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editField = (fieldName, typedText) =>
    setProfileForm((previousForm) => ({ ...previousForm, [fieldName]: typedText }));

  const saveProfile = async () => {
    const formErrors = validateProfileForm(profileForm);
    setFieldErrors(formErrors);
    setSaveErrorMessage('');
    if (Object.keys(formErrors).length > 0) return;

    setIsSaving(true);
    try {
      const updatedProfile = await updateMyProfile({
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        mobile: profileForm.mobile.trim(),
      });
      replaceCurrentUser(updatedProfile);
      showSuccessToast('Your profile has been updated.');
      router.back();
    } catch (saveError) {
      setFieldErrors(saveError.fieldErrors || {});
      setSaveErrorMessage(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteMyAccount();
      await signOut();
      router.replace(LOGIN_ROUTE);
    } catch (deleteError) {
      setSaveErrorMessage(deleteError.message);
      setIsDeleteDialogVisible(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Personal Information"
          onBackPress={router.canGoBack() ? router.back : undefined}
        />
      }
    >
      <View style={styles.formBlock}>
        <AppTextInput
          label="Full name"
          value={profileForm.fullName}
          onChangeText={(typedText) => editField('fullName', typedText)}
          errorText={fieldErrors.fullName}
          autoComplete="name"
        />
        <AppTextInput
          label="Email address"
          value={profileForm.email}
          onChangeText={(typedText) => editField('email', typedText)}
          errorText={fieldErrors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <AppTextInput
          label="Mobile number"
          value={profileForm.mobile}
          onChangeText={(typedText) => editField('mobile', typedText)}
          errorText={fieldErrors.mobile}
          keyboardType="phone-pad"
          autoComplete="tel"
        />

        {Boolean(saveErrorMessage) && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
            <Text style={[typography.bodyMedium, styles.errorBannerText]}>{saveErrorMessage}</Text>
          </View>
        )}

        <AppButton label="Save changes" size="large" isFullWidth isLoading={isSaving} onPress={saveProfile} />
      </View>

      <View style={styles.dangerBlock}>
        <Text style={[typography.sectionHeading, styles.mutedText]}>Danger zone</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          Deleting your account removes your tickets and saved routes permanently.
        </Text>
        <AppButton
          label="Delete my account"
          variant="error"
          iconName="trash-outline"
          isFullWidth
          onPress={() => setIsDeleteDialogVisible(true)}
        />
      </View>

      <ConfirmDialog
        isVisible={isDeleteDialogVisible}
        title={DELETE_ACCOUNT_DIALOG.title}
        message={DELETE_ACCOUNT_DIALOG.message}
        confirmLabel={DELETE_ACCOUNT_DIALOG.confirmLabel}
        isDestructive
        isConfirming={isDeleting}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setIsDeleteDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formBlock: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  errorBannerText: {
    flex: 1,
    color: colors.error.dark,
  },
  dangerBlock: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
  },
});
