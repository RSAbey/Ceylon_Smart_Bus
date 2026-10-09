// The app lock screen (Member 01, NFR-07): what covers the app when the PIN is on and the app has
// just been reopened on a remembered session. The PIN is checked by the API, because that is where
// it is stored hashed — the device never holds the digits.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppButton from '../../../components/ui/AppButton';
import { useAuth } from '../../../context/AuthContext';
import {
  getFailedPinAttempts,
  resetFailedPinAttempts,
  setFailedPinAttempts,
} from '../../../utils/appLockStorage';
import { APP_PIN_LENGTH, MAX_PIN_ATTEMPTS } from '../../../utils/constants';
import { getNameInitials } from '../../../utils/formatters';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { verifyAppPin } from '../../profile/services/appPinApi';
import { APP_LOCK_SCREEN } from '../../profile/constants';
import PinKeypad from '../components/PinKeypad';

const ONE_TRY = 1;
/** Slice offset that drops the last digit typed. */
const ALL_BUT_LAST_DIGIT = -1;
const DOT_DIAMETER = 18;
/** Every safe-area edge: the lock screen covers the whole app, tab bar included. */
const ALL_SAFE_EDGES = Object.freeze(['top', 'left', 'right', 'bottom']);

/**
 * Says how many tries are left, in words that read correctly for one.
 * @param {number} triesLeft - Attempts remaining.
 * @returns {string} For example "2 tries left." or "1 try left."
 */
function describeTriesLeft(triesLeft) {
  return triesLeft === ONE_TRY ? '1 try left.' : `${triesLeft} tries left.`;
}

/**
 * One dot per digit: filled as the PIN is typed, outlined in red when the last PIN was wrong.
 * @param {object} props - Component props.
 * @param {number} props.typedCount - How many digits have been typed.
 * @param {boolean} props.hasError - Whether the last attempt was refused.
 * @returns {import('react').JSX.Element} The row of dots.
 */
function PinDots({ typedCount, hasError }) {
  const dotPositions = Array.from({ length: APP_PIN_LENGTH }, (_unused, dotIndex) => dotIndex);
  return (
    <View
      style={styles.dotRow}
      accessibilityLabel={`${typedCount} of ${APP_PIN_LENGTH} digits entered`}
    >
      {dotPositions.map((dotIndex) => (
        <View
          key={dotIndex}
          style={[
            styles.dot,
            dotIndex < typedCount && styles.dotFilled,
            hasError && styles.dotError,
          ]}
        />
      ))}
    </View>
  );
}

/**
 * The lock screen. It is rendered by AppLockGate, not by a route, so it takes a callback rather
 * than navigating anywhere itself.
 * @param {object} props - Component props.
 * @param {Function} props.onUnlocked - Called once the right PIN has been accepted.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function PinLockScreen({ onUnlocked }) {
  const { user, signOut } = useAuth();
  const [typedPin, setTypedPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isEffectActive = true;
    // The count is kept on the device, so closing the app does not hand back fresh tries.
    getFailedPinAttempts().then((storedCount) => {
      if (isEffectActive) setFailedAttempts(storedCount);
    });
    return () => {
      isEffectActive = false;
    };
  }, []);

  /**
   * Sends the finished PIN to the API and acts on the answer.
   * @param {string} pinToCheck - The digits that were typed.
   * @returns {Promise<void>} Resolves once the answer has been handled.
   */
  const checkPin = async (pinToCheck) => {
    setIsChecking(true);
    try {
      await verifyAppPin(pinToCheck);
      await resetFailedPinAttempts();
      onUnlocked();
    } catch (verifyError) {
      setTypedPin('');
      // Only a PIN the server actually refused counts against the user. A request that never
      // arrived, or any other fault, is not the user getting their own PIN wrong.
      if (!verifyError.fieldErrors?.pin) {
        setErrorMessage(verifyError.message);
        return;
      }
      const attemptsSoFar = failedAttempts + ONE_TRY;
      setFailedAttempts(attemptsSoFar);
      await setFailedPinAttempts(attemptsSoFar);
      if (attemptsSoFar >= MAX_PIN_ATTEMPTS) {
        // Out of tries: end the session, which drops the app back to the sign-in screen.
        await signOut();
        return;
      }
      setErrorMessage(
        `${APP_LOCK_SCREEN.wrongPin} ${describeTriesLeft(MAX_PIN_ATTEMPTS - attemptsSoFar)}`
      );
    } finally {
      setIsChecking(false);
    }
  };

  const addDigit = (digit) => {
    if (isChecking || typedPin.length >= APP_PIN_LENGTH) return;
    const pinSoFar = `${typedPin}${digit}`;
    setTypedPin(pinSoFar);
    setErrorMessage('');
    if (pinSoFar.length === APP_PIN_LENGTH) checkPin(pinSoFar);
  };

  const removeLastDigit = () => {
    if (isChecking) return;
    setTypedPin((previousPin) => previousPin.slice(0, ALL_BUT_LAST_DIGIT));
    setErrorMessage('');
  };

  return (
    <ScreenContainer safeEdges={ALL_SAFE_EDGES}>
      <View style={styles.identityBlock}>
        <View style={styles.avatarCircle}>
          <Text style={[typography.heading2, styles.avatarText]}>
            {getNameInitials(user?.fullName)}
          </Text>
        </View>
        <Text style={typography.heading2}>{APP_LOCK_SCREEN.title}</Text>
        <Text style={[typography.bodyMedium, styles.centredMutedText]}>
          {APP_LOCK_SCREEN.subtitle}
        </Text>
      </View>

      <PinDots typedCount={typedPin.length} hasError={Boolean(errorMessage)} />

      {errorMessage ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodyMedium, styles.errorText]}>{errorMessage}</Text>
        </View>
      ) : (
        <View style={styles.errorRow} />
      )}

      <PinKeypad
        onDigitPress={addDigit}
        onBackspacePress={removeLastDigit}
        isDisabled={isChecking}
      />

      <AppButton
        label={APP_LOCK_SCREEN.signOutAction}
        variant="text"
        isFullWidth
        onPress={signOut}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identityBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  avatarCircle: {
    width: sizes.iconHuge,
    height: sizes.iconHuge,
    borderRadius: radii.pill,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary[600],
  },
  centredMutedText: {
    textAlign: 'center',
    color: colors.text.secondary,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  dot: {
    width: DOT_DIAMETER,
    height: DOT_DIAMETER,
    borderRadius: radii.pill,
    borderWidth: sizes.borderThick,
    borderColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  dotError: {
    borderColor: colors.error.main,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: sizes.iconLarge,
  },
  errorText: {
    color: colors.error.dark,
  },
});
