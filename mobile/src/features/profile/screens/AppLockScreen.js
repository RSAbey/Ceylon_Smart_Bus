// App lock (Member 01, NFR-07): the one screen where the optional PIN is created, viewed, changed
// and removed. "Viewed" means the state of the lock — whether it is on and when the PIN was last
// set — because the PIN is hashed on the server and cannot be read back by anybody, this screen
// included. That is the point of hashing it, and the screen says so in as many words.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { resetFailedPinAttempts, setIsAppPinSet } from '../../../utils/appLockStorage';
import { colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchAppPinStatus } from '../services/appPinApi';
import { APP_LOCK_MESSAGES } from '../constants';
import CreateAppPinForm from '../components/CreateAppPinForm';
import ChangeAppPinDialog from '../components/ChangeAppPinDialog';
import RemoveAppPinDialog from '../components/RemoveAppPinDialog';

/** Which sheet is open, if any. */
const APP_LOCK_DIALOGS = Object.freeze({ NONE: 'none', CHANGE: 'change', REMOVE: 'remove' });

/**
 * Reads the date the PIN was set as "9 October 2026".
 * @param {string} [setAt] - ISO date from the API.
 * @returns {string} The sentence under the status, or an empty string when there is no date.
 */
function describeWhenPinWasSet(setAt) {
  if (!setAt) return '';
  const setDate = new Date(setAt);
  const readableDate = setDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `PIN last set on ${readableDate}`;
}

/**
 * The on/off card at the top of the screen. The icon and the words both say which it is, so the
 * state never rests on colour alone (NFR-09).
 * @param {object} props - Component props.
 * @param {object} props.pinStatus - The lock state from the API.
 * @returns {import('react').JSX.Element} The card.
 */
function AppLockStatusCard({ pinStatus }) {
  const isOn = pinStatus.isPinSet;
  return (
    <AppCard>
      <View style={styles.statusRow}>
        <View style={[styles.statusIconCircle, isOn ? styles.statusOn : styles.statusOff]}>
          <Ionicons
            name={isOn ? 'lock-closed' : 'lock-open-outline'}
            size={sizes.iconLarge}
            color={isOn ? colors.success.dark : colors.text.secondary}
          />
        </View>
        <View style={styles.statusTextBlock}>
          <Text style={typography.heading3}>
            {isOn ? APP_LOCK_MESSAGES.onTitle : APP_LOCK_MESSAGES.offTitle}
          </Text>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {isOn ? describeWhenPinWasSet(pinStatus.setAt) : APP_LOCK_MESSAGES.offHint}
          </Text>
        </View>
      </View>
    </AppCard>
  );
}

/**
 * App lock screen, shared by passengers and drivers.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AppLockScreen() {
  const router = useRouter();
  const { showSuccessToast } = useToast();
  const [pinStatus, setPinStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);
  const [visibleDialog, setVisibleDialog] = useState(APP_LOCK_DIALOGS.NONE);

  const reloadStatus = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchAppPinStatus()
      .then((loadedStatus) => {
        if (!isEffectActive) return;
        setPinStatus(loadedStatus);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    // Ignore a reply that arrives after the screen has moved on.
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  /**
   * Stores the new state everywhere it is needed: on screen, and on the device so the lock screen
   * knows what to do the next time the app opens without waiting for the API.
   * @param {object} newStatus - Lock state returned by the API.
   * @param {string} successMessage - What to tell the user.
   * @returns {Promise<void>} Resolves once the device has been told too.
   */
  const rememberNewStatus = async (newStatus, successMessage) => {
    setPinStatus(newStatus);
    setVisibleDialog(APP_LOCK_DIALOGS.NONE);
    await setIsAppPinSet(newStatus.isPinSet);
    // A fresh or removed PIN starts the wrong-try count again.
    await resetFailedPinAttempts();
    showSuccessToast(successMessage);
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="App lock"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your app lock..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadStatus} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <Text style={[typography.bodyMedium, styles.mutedText]}>{APP_LOCK_MESSAGES.explanation}</Text>

      <AppLockStatusCard pinStatus={pinStatus} />

      {pinStatus.isPinSet ? (
        <View style={styles.actionBlock}>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            {APP_LOCK_MESSAGES.cannotShowPin}
          </Text>
          <AppButton
            label={APP_LOCK_MESSAGES.changeHeading}
            iconName="keypad-outline"
            size="large"
            isFullWidth
            onPress={() => setVisibleDialog(APP_LOCK_DIALOGS.CHANGE)}
          />
          <AppButton
            label={APP_LOCK_MESSAGES.removeAction}
            variant="outline"
            iconName="lock-open-outline"
            size="large"
            isFullWidth
            onPress={() => setVisibleDialog(APP_LOCK_DIALOGS.REMOVE)}
          />
        </View>
      ) : (
        <CreateAppPinForm
          onCreated={(newStatus) => rememberNewStatus(newStatus, APP_LOCK_MESSAGES.created)}
        />
      )}

      <ChangeAppPinDialog
        isVisible={visibleDialog === APP_LOCK_DIALOGS.CHANGE}
        onClose={() => setVisibleDialog(APP_LOCK_DIALOGS.NONE)}
        onChanged={(newStatus) => rememberNewStatus(newStatus, APP_LOCK_MESSAGES.changed)}
      />
      <RemoveAppPinDialog
        isVisible={visibleDialog === APP_LOCK_DIALOGS.REMOVE}
        onClose={() => setVisibleDialog(APP_LOCK_DIALOGS.NONE)}
        onRemoved={(newStatus) => rememberNewStatus(newStatus, APP_LOCK_MESSAGES.removed)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIconCircle: {
    width: sizes.iconHuge,
    height: sizes.iconHuge,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOn: {
    backgroundColor: colors.success.light,
  },
  statusOff: {
    backgroundColor: colors.background,
  },
  statusTextBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  actionBlock: {
    gap: spacing.md,
  },
});
