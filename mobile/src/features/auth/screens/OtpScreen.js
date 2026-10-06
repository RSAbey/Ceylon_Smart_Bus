// Step 3 of registration: confirm the 6-digit code sent to the passenger's mobile (Member 01, FR-01).
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../context/AuthContext';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import OtpCodeInput from '../components/OtpCodeInput';
import { resendRegistrationOtp, verifyRegistrationOtp } from '../services/authApi';
import {
  OTP_DIGIT_COUNT,
  OTP_RESEND_COOLDOWN_SECONDS,
  REGISTER_MESSAGES,
  REGISTRATION_STEPS,
  REGISTRATION_STEP_COUNT,
} from '../constants';

const ONE_SECOND_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const COUNTDOWN_FINISHED = 0;

/**
 * Formats remaining seconds as m:ss, matching the "Resend in 0:54" label.
 * @param {number} totalSeconds - Seconds left.
 * @returns {string} Formatted countdown.
 */
function formatCountdown(totalSeconds) {
  const minutePart = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const secondPart = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, '0');
  return `${minutePart}:${secondPart}`;
}

/**
 * Verification screen. A correct code signs the passenger in and moves to the success step.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function OtpScreen() {
  const router = useRouter();
  const { applySession } = useAuth();
  const registrationParams = useLocalSearchParams();
  const [otpCode, setOtpCode] = useState('');
  const [verifyErrorMessage, setVerifyErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState(registrationParams.devOtpCode || '');
  const [secondsUntilResend, setSecondsUntilResend] = useState(
    Number(registrationParams.resendAfterSeconds) || OTP_RESEND_COOLDOWN_SECONDS
  );

  useEffect(() => {
    if (secondsUntilResend <= COUNTDOWN_FINISHED) return undefined;
    const countdownTimerId = setInterval(
      () => setSecondsUntilResend((secondsLeft) => Math.max(COUNTDOWN_FINISHED, secondsLeft - 1)),
      ONE_SECOND_MS
    );
    return () => clearInterval(countdownTimerId);
  }, [secondsUntilResend]);

  const submitOtpCode = async () => {
    if (otpCode.length < OTP_DIGIT_COUNT) {
      setVerifyErrorMessage(REGISTER_MESSAGES.otpIncomplete);
      return;
    }
    setVerifyErrorMessage('');
    setIsVerifying(true);
    try {
      const verifiedSession = await verifyRegistrationOtp(registrationParams.userId, otpCode);
      await applySession(verifiedSession.token, verifiedSession.user);
      router.replace('/(auth)/registration-success');
    } catch (verifyError) {
      setVerifyErrorMessage(verifyError.message);
      setOtpCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const requestNewCode = async () => {
    setIsResending(true);
    setVerifyErrorMessage('');
    try {
      const reissuedOtp = await resendRegistrationOtp(registrationParams.userId);
      setDemoOtpCode(reissuedOtp.devOtpCode || '');
      setSecondsUntilResend(reissuedOtp.resendAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS);
      setOtpCode('');
    } catch (resendError) {
      setVerifyErrorMessage(resendError.message);
    } finally {
      setIsResending(false);
    }
  };

  const canResend = secondsUntilResend <= COUNTDOWN_FINISHED;

  return (
    <ScreenContainer
      isScrollable
      header={
        <AppHeader
          variant="back"
          title="Verification"
          onBackPress={router.canGoBack() ? router.back : undefined}
          stepLabel={`${REGISTRATION_STEPS.verify} of ${REGISTRATION_STEP_COUNT}`}
        />
      }
    >
      <View style={styles.introBlock}>
        <Text style={typography.heading1}>Verify Mobile Number</Text>
        <Text style={[typography.bodyLarge, styles.mutedText]}>
          We sent a {OTP_DIGIT_COUNT}-digit confirmation code to{' '}
          <Text style={styles.strongText}>{registrationParams.maskedMobile}</Text>. Please enter it below.
        </Text>
      </View>

      <OtpCodeInput
        otpCode={otpCode}
        onOtpCodeChange={setOtpCode}
        hasError={Boolean(verifyErrorMessage)}
        isDisabled={isVerifying}
      />

      {Boolean(verifyErrorMessage) && (
        <View style={styles.warningBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.warning.dark} />
          <Text style={[typography.bodyMedium, styles.warningText]}>{verifyErrorMessage}</Text>
        </View>
      )}

      {Boolean(demoOtpCode) && (
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle" size={sizes.iconMedium} color={colors.information.dark} />
          <Text style={[typography.bodySmall, styles.demoText]}>
            Demo mode: no SMS gateway is connected, so your code is {demoOtpCode}.
          </Text>
        </View>
      )}

      <View style={styles.resendRow}>
        <Text style={[typography.bodyMedium, styles.mutedText]}>Didn&apos;t receive the SMS?</Text>
        {canResend ? (
          <AppButton label="Resend code" variant="text" isLoading={isResending} onPress={requestNewCode} />
        ) : (
          <Text style={[typography.bodyMedium, styles.countdownText]}>
            Resend in {formatCountdown(secondsUntilResend)}
          </Text>
        )}
      </View>

      <AppButton
        label="Verify & Confirm"
        size="large"
        isFullWidth
        isLoading={isVerifying}
        onPress={submitOtpCode}
      />
      <AppButton
        label="Change mobile number"
        variant="text"
        isFullWidth
        onPress={() => router.replace('/(auth)/register')}
      />
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
  strongText: {
    color: colors.text.primary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warning.light,
  },
  warningText: {
    flex: 1,
    color: colors.warning.dark,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.information.light,
  },
  demoText: {
    flex: 1,
    color: colors.information.dark,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  countdownText: {
    color: colors.primary[600],
  },
});
