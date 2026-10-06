// Step 2 of registration: the passenger sign-up form (Member 01, FR-01).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { registerPassenger } from '../services/authApi';
import {
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  REGISTER_MESSAGES,
  REGISTRATION_STEPS,
  REGISTRATION_STEP_COUNT,
  SRI_LANKA_MOBILE_PATTERN,
} from '../constants';

/**
 * Validates the sign-up form before calling the API, so errors appear without a round trip.
 * @param {object} signUpForm - Current field values.
 * @param {boolean} hasAcceptedTerms - Whether the terms checkbox is ticked.
 * @returns {Object<string, string>} Field name to error message.
 */
function validateSignUpForm(signUpForm, hasAcceptedTerms) {
  const formErrors = {};
  if (!signUpForm.fullName.trim()) formErrors.fullName = REGISTER_MESSAGES.fullNameRequired;
  if (!signUpForm.email.trim()) formErrors.email = REGISTER_MESSAGES.emailRequired;
  else if (!EMAIL_PATTERN.test(signUpForm.email.trim())) formErrors.email = REGISTER_MESSAGES.emailInvalid;
  if (!signUpForm.mobile.trim()) formErrors.mobile = REGISTER_MESSAGES.mobileRequired;
  else if (!SRI_LANKA_MOBILE_PATTERN.test(signUpForm.mobile.trim()))
    formErrors.mobile = REGISTER_MESSAGES.mobileInvalid;
  if (signUpForm.password.length < MIN_PASSWORD_LENGTH)
    formErrors.password = REGISTER_MESSAGES.passwordTooShort;
  if (!hasAcceptedTerms) formErrors.hasAcceptedTerms = REGISTER_MESSAGES.termsRequired;
  return formErrors;
}

/**
 * Sign-up form. On success the passenger moves to the Verification screen with their pending registration.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const [signUpForm, setSignUpForm] = useState({ fullName: '', email: '', mobile: '', password: '' });
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const editField = (fieldName, typedText) =>
    setSignUpForm((previousForm) => ({ ...previousForm, [fieldName]: typedText }));

  const submitRegistration = async () => {
    const formErrors = validateSignUpForm(signUpForm, hasAcceptedTerms);
    setFieldErrors(formErrors);
    setSubmitErrorMessage('');
    if (Object.keys(formErrors).length > 0) return;

    setIsRegistering(true);
    try {
      const pendingRegistration = await registerPassenger({
        fullName: signUpForm.fullName.trim(),
        email: signUpForm.email.trim(),
        mobile: signUpForm.mobile.trim(),
        password: signUpForm.password,
        hasAcceptedTerms,
      });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          userId: pendingRegistration.userId,
          maskedMobile: pendingRegistration.maskedMobile,
          resendAfterSeconds: String(pendingRegistration.resendAfterSeconds),
          devOtpCode: pendingRegistration.devOtpCode || '',
        },
      });
    } catch (registrationError) {
      setFieldErrors(registrationError.fieldErrors || {});
      setSubmitErrorMessage(registrationError.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Sign Up"
          onBackPress={router.canGoBack() ? router.back : undefined}
          stepLabel={`${REGISTRATION_STEPS.createAccount} of ${REGISTRATION_STEP_COUNT}`}
        />
      }
    >
      <View style={styles.introBlock}>
        <Text style={typography.display}>Create Passenger Account</Text>
        <Text style={[typography.bodyLarge, styles.mutedText]}>
          Register with your correct details so we can confirm your tickets and send bus alerts.
        </Text>
      </View>

      <View style={styles.formBlock}>
        <AppTextInput
          label="Full name"
          placeholder="Kavindu Jayawardane"
          value={signUpForm.fullName}
          onChangeText={(typedText) => editField('fullName', typedText)}
          errorText={fieldErrors.fullName}
          autoComplete="name"
        />
        <AppTextInput
          label="Email address"
          placeholder="you@example.com"
          value={signUpForm.email}
          onChangeText={(typedText) => editField('email', typedText)}
          errorText={fieldErrors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <AppTextInput
          label="Mobile number"
          placeholder="0771234567"
          value={signUpForm.mobile}
          onChangeText={(typedText) => editField('mobile', typedText)}
          errorText={fieldErrors.mobile}
          helperText="We send your confirmation code to this number."
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <AppTextInput
          label="Password"
          placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          value={signUpForm.password}
          onChangeText={(typedText) => editField('password', typedText)}
          errorText={fieldErrors.password}
          isPasswordField
          autoComplete="new-password"
        />

        <Pressable
          onPress={() => setHasAcceptedTerms((wasAccepted) => !wasAccepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hasAcceptedTerms }}
          accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
          style={styles.termsRow}
        >
          <View style={[styles.checkbox, hasAcceptedTerms && styles.checkboxTicked]}>
            {hasAcceptedTerms && (
              <Ionicons name="checkmark" size={sizes.iconSmall} color={colors.text.onColor} />
            )}
          </View>
          <Text style={[typography.bodyMedium, styles.termsText]}>
            I agree to the Terms of Service and Privacy Policy.
          </Text>
        </Pressable>
        {Boolean(fieldErrors.hasAcceptedTerms) && (
          <View style={styles.inlineError} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
            <Text style={[typography.caption, styles.errorText]}>{fieldErrors.hasAcceptedTerms}</Text>
          </View>
        )}

        {Boolean(submitErrorMessage) && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
            <Text style={[typography.bodyMedium, styles.errorBannerText]}>{submitErrorMessage}</Text>
          </View>
        )}

        <AppButton
          label="Agree & Register"
          size="large"
          isFullWidth
          isLoading={isRegistering}
          onPress={submitRegistration}
        />
        <AppButton
          label="Already have an account? Sign in"
          variant="text"
          isFullWidth
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  introBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  formBlock: {
    gap: spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  checkbox: {
    width: sizes.iconLarge,
    height: sizes.iconLarge,
    borderRadius: radii.sm,
    borderWidth: sizes.borderThick,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxTicked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  termsText: {
    flex: 1,
    color: colors.text.primary,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  errorText: {
    color: colors.error.dark,
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
});
