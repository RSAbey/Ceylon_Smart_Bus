// Forgot password (Member 01, FR-01 / NFR-07): ask for the email, type the six digits that arrive
// by email, then choose a new password. The code lasts five minutes and the screen counts it down,
// so nobody is left wondering whether it is still good.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppTextInput from '../../../components/ui/AppTextInput';
import AppButton from '../../../components/ui/AppButton';
import PasswordStrengthMeter from '../../../components/ui/PasswordStrengthMeter';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { measurePassword } from '../../../utils/passwordRules';
import { requestPasswordReset, resetPassword } from '../services/authApi';
import { EMAIL_PATTERN, OTP_DIGIT_COUNT, REGISTER_MESSAGES, RESET_MESSAGES } from '../constants';

const ONE_SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const COUNTDOWN_FINISHED = 0;
/** The two faces of this screen: ask for the email, then take the code and the new password. */
const RESET_STEPS = Object.freeze({ EMAIL: 'email', CODE: 'code' });

/**
 * Formats remaining seconds as m:ss, the same way the registration screen counts down.
 * @param {number} totalSeconds - Seconds left.
 * @returns {string} Formatted countdown.
 */
function formatCountdown(totalSeconds) {
  const minutePart = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const secondPart = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, '0');
  return `${minutePart}:${secondPart}`;
}

/**
 * Reset password screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { showSuccessToast } = useToast();

  const [currentStep, setCurrentStep] = useState(RESET_STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitErrorMessage, setSubmitErrorMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [secondsUntilExpiry, setSecondsUntilExpiry] = useState(COUNTDOWN_FINISHED);
  const [demoOtpCode, setDemoOtpCode] = useState('');

  useEffect(() => {
    if (secondsUntilExpiry <= COUNTDOWN_FINISHED) return undefined;
    const countdownTimerId = setInterval(
      () => setSecondsUntilExpiry((secondsLeft) => Math.max(COUNTDOWN_FINISHED, secondsLeft - 1)),
      ONE_SECOND_MS
    );
    return () => clearInterval(countdownTimerId);
  }, [secondsUntilExpiry]);

  const sendResetCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldErrors({ email: REGISTER_MESSAGES.emailInvalid });
      return;
    }
    setFieldErrors({});
    setSubmitErrorMessage('');
    setIsWorking(true);
    try {
      const resetRequest = await requestPasswordReset(trimmedEmail);
      const secondsToExpiry = Math.max(
        COUNTDOWN_FINISHED,
        Math.round((new Date(resetRequest.expiresAt).getTime() - Date.now()) / ONE_SECOND_MS)
      );
      setSecondsUntilExpiry(secondsToExpiry);
      // Outside production there is no mailbox to read, so the server hands the code back instead.
      setDemoOtpCode(resetRequest.devOtpCode || '');
      setCurrentStep(RESET_STEPS.CODE);
    } catch (resetError) {
      setSubmitErrorMessage(resetError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const saveNewPassword = async () => {
    const formErrors = {};
    if (otpCode.trim().length !== OTP_DIGIT_COUNT) {
      formErrors.otpCode = REGISTER_MESSAGES.otpIncomplete;
    }
    if (!measurePassword(newPassword).isStrongEnough) {
      formErrors.newPassword = REGISTER_MESSAGES.passwordTooWeak;
    }
    if (confirmPassword !== newPassword) {
      formErrors.confirmPassword = REGISTER_MESSAGES.confirmPasswordMismatch;
    }
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitErrorMessage('');
    setIsWorking(true);
    try {
      await resetPassword({ email: email.trim(), otpCode: otpCode.trim(), newPassword });
      showSuccessToast(RESET_MESSAGES.done);
      router.replace('/(auth)/login');
    } catch (resetError) {
      setFieldErrors(resetError.fieldErrors || {});
      setSubmitErrorMessage(resetError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const hasCodeExpired = secondsUntilExpiry <= COUNTDOWN_FINISHED;

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          title="Reset password"
          onBackPress={router.canGoBack() ? router.back : undefined}
        />
      }
    >
      <View style={styles.introBlock}>
        <Text style={typography.display}>
          {currentStep === RESET_STEPS.EMAIL ? RESET_MESSAGES.askTitle : RESET_MESSAGES.codeTitle}
        </Text>
        <Text style={[typography.bodyLarge, styles.mutedText]}>
          {currentStep === RESET_STEPS.EMAIL
            ? RESET_MESSAGES.askSubtitle
            : `${RESET_MESSAGES.codeSubtitle} ${email.trim()}`}
        </Text>
      </View>

      {submitErrorMessage ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodyMedium, styles.errorText]}>{submitErrorMessage}</Text>
        </View>
      ) : null}

      {currentStep === RESET_STEPS.EMAIL ? (
        <View style={styles.formBlock}>
          <AppTextInput
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            errorText={fieldErrors.email}
            helperText={RESET_MESSAGES.emailHelper}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <AppButton
            label="Send reset code"
            size="large"
            isFullWidth
            isLoading={isWorking}
            onPress={sendResetCode}
          />
        </View>
      ) : (
        <View style={styles.formBlock}>
          <View style={[styles.countdownPill, hasCodeExpired && styles.countdownPillExpired]}>
            <Ionicons
              name={hasCodeExpired ? 'time-outline' : 'timer-outline'}
              size={sizes.iconSmall}
              color={hasCodeExpired ? colors.error.dark : colors.primary[600]}
            />
            <Text
              style={[
                typography.bodyMedium,
                hasCodeExpired ? styles.errorText : styles.countdownText,
              ]}
            >
              {hasCodeExpired
                ? RESET_MESSAGES.expired
                : `${RESET_MESSAGES.expiresIn} ${formatCountdown(secondsUntilExpiry)}`}
            </Text>
          </View>

          {demoOtpCode ? (
            <Text style={[typography.caption, styles.mutedText]}>
              {RESET_MESSAGES.demoCode} {demoOtpCode}
            </Text>
          ) : null}

          <AppTextInput
            label={`${OTP_DIGIT_COUNT}-digit code`}
            placeholder="123456"
            value={otpCode}
            onChangeText={(typedText) => setOtpCode(typedText.replace(/\D/g, ''))}
            errorText={fieldErrors.otpCode}
            keyboardType="number-pad"
            maxLength={OTP_DIGIT_COUNT}
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
            isLoading={isWorking}
            isDisabled={hasCodeExpired}
            onPress={saveNewPassword}
          />
          <AppButton
            label={hasCodeExpired ? 'Send a new code' : 'Send the code again'}
            variant="outline"
            size="large"
            isFullWidth
            onPress={sendResetCode}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  introBlock: {
    gap: spacing.sm,
  },
  mutedText: {
    color: colors.text.secondary,
  },
  formBlock: {
    gap: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  errorText: {
    flex: 1,
    color: colors.error.dark,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
  },
  countdownPillExpired: {
    backgroundColor: colors.error.light,
  },
  countdownText: {
    color: colors.primary[600],
  },
});
