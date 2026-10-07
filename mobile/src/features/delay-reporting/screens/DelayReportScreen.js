// Report Delay (Member 04, FR-08): the driver says why the bus is late and by how much, and every
// affected passenger is told. Built for one-handed use at a bus stop: taps, not typing.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import StatusBadge from '../../../components/ui/StatusBadge';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { useDrawer } from '../../../components/navigation/DrawerContext';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import {
  cancelDelayReport,
  fetchActiveDelay,
  reportDelay,
  resolveDelayReport,
  updateDelayReport,
} from '../services/delayApi';
import {
  DELAY_MESSAGES,
  DELAY_PRESET_MINUTES,
  DELAY_REASONS,
  DELAY_REASON_OPTIONS,
} from '../constants';

/**
 * The driver's delay reporting screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DelayReportScreen() {
  const router = useRouter();
  const drawer = useDrawer();
  const { showSuccessToast, showErrorToast } = useToast();

  const [activeDelay, setActiveDelay] = useState(null);
  const [chosenReason, setChosenReason] = useState('');
  const [chosenMinutes, setChosenMinutes] = useState(null);
  const [reasonNote, setReasonNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolveDialogVisible, setIsResolveDialogVisible] = useState(false);
  const [isCancelDialogVisible, setIsCancelDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadDelay = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  // The driver may have started or ended a trip on another tab, so refresh on focus.
  useFocusEffect(reloadDelay);

  useEffect(() => {
    let isEffectActive = true;
    fetchActiveDelay()
      .then((loadedDelay) => {
        if (!isEffectActive) return;
        setActiveDelay(loadedDelay);
        if (loadedDelay) {
          setChosenReason(loadedDelay.reason);
          setChosenMinutes(loadedDelay.delayMinutes);
          setReasonNote(loadedDelay.reasonNote || '');
        }
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    return () => {
      isEffectActive = false;
    };
  }, [reloadCounter]);

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (!chosenReason) foundErrors.reason = DELAY_MESSAGES.chooseReason;
    if (!chosenMinutes) foundErrors.delayMinutes = DELAY_MESSAGES.chooseMinutes;
    if (chosenReason === DELAY_REASONS.OTHER && reasonNote.trim().length === 0) {
      foundErrors.reasonNote = DELAY_MESSAGES.noteRequired;
    }
    setFieldErrors(foundErrors);
    return Object.keys(foundErrors).length === 0;
  }

  const submitReport = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    try {
      const delayDetails = {
        reason: chosenReason,
        delayMinutes: chosenMinutes,
        reasonNote: chosenReason === DELAY_REASONS.OTHER ? reasonNote.trim() : undefined,
      };
      const { notifiedCount } = activeDelay
        ? await updateDelayReport(activeDelay.id, delayDetails)
        : await reportDelay(delayDetails);
      showSuccessToast(`Reported. ${notifiedCount} passengers were told.`);
      reloadDelay();
    } catch (submitError) {
      showErrorToast(submitError.message);
      setFieldErrors(submitError.fieldErrors || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmResolve = async () => {
    setIsSubmitting(true);
    try {
      await resolveDelayReport(activeDelay.id);
      showSuccessToast('Marked as back on time.');
      setIsResolveDialogVisible(false);
      setChosenReason('');
      setChosenMinutes(null);
      setReasonNote('');
      reloadDelay();
    } catch (resolveError) {
      showErrorToast(resolveError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancel = async () => {
    setIsSubmitting(true);
    try {
      await cancelDelayReport(activeDelay.id);
      showSuccessToast('Report withdrawn.');
      setIsCancelDialogVisible(false);
      setChosenReason('');
      setChosenMinutes(null);
      setReasonNote('');
      reloadDelay();
    } catch (cancelError) {
      showErrorToast(cancelError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Report Delay"
      onMenuPress={drawer ? drawer.openDrawer : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Checking your trip..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadDelay} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {activeDelay && (
        <AppCard style={styles.activeCard}>
          <View style={styles.activeHeaderRow}>
            <Ionicons name="alert-circle" size={sizes.iconLarge} color={colors.warning.dark} />
            <Text style={[typography.heading3, styles.activeTitle]}>
              Passengers have been told you are {activeDelay.delayMinutes} min late
            </Text>
            <StatusBadge status="delayed" label="Active" />
          </View>
          <Text style={[typography.bodySmall, styles.mutedText]}>
            Change the reason or the minutes below and send again, or say you are back on time.
          </Text>
          <View style={styles.activeActionRow}>
            <AppButton
              label="Back on time"
              variant="success"
              isFullWidth
              iconName="checkmark-circle-outline"
              style={styles.activeActionButton}
              onPress={() => setIsResolveDialogVisible(true)}
            />
            <AppButton
              label="Withdraw"
              variant="outline"
              isFullWidth
              iconName="close-circle-outline"
              style={styles.activeActionButton}
              onPress={() => setIsCancelDialogVisible(true)}
            />
          </View>
        </AppCard>
      )}

      <AppCard>
        <Text style={typography.heading3}>{DELAY_MESSAGES.chooseReason}</Text>
        <View style={styles.reasonGrid}>
          {DELAY_REASON_OPTIONS.map((reasonOption) => {
            const isChosen = reasonOption.reason === chosenReason;
            return (
              <Pressable
                key={reasonOption.reason}
                onPress={() => setChosenReason(reasonOption.reason)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isChosen }}
                accessibilityLabel={reasonOption.label}
                style={[styles.reasonButton, isChosen && styles.reasonButtonChosen]}
              >
                <Ionicons
                  name={reasonOption.iconName}
                  size={sizes.iconLarge}
                  color={isChosen ? colors.primary[600] : colors.text.secondary}
                />
                <Text style={[typography.bodySmall, isChosen && styles.chosenText]}>
                  {reasonOption.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.reason && (
          <View style={styles.fieldErrorRow}>
            <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
            <Text style={[typography.caption, styles.fieldErrorText]}>{fieldErrors.reason}</Text>
          </View>
        )}
      </AppCard>

      {chosenReason === DELAY_REASONS.OTHER && (
        <AppCard>
          <AppTextInput
            label="What is happening?"
            value={reasonNote}
            onChangeText={setReasonNote}
            errorText={fieldErrors.reasonNote}
            helperText="Passengers see this, so keep it short and factual."
            iconName="chatbubble-ellipses-outline"
            multiline
          />
        </AppCard>
      )}

      <AppCard>
        <Text style={typography.heading3}>{DELAY_MESSAGES.chooseMinutes}</Text>
        <View style={styles.minuteGrid}>
          {DELAY_PRESET_MINUTES.map((presetMinutes) => {
            const isChosen = presetMinutes === chosenMinutes;
            return (
              <Pressable
                key={presetMinutes}
                onPress={() => setChosenMinutes(presetMinutes)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isChosen }}
                accessibilityLabel={`${presetMinutes} minutes late`}
                style={[styles.minuteButton, isChosen && styles.minuteButtonChosen]}
              >
                <Text style={[typography.heading3, isChosen && styles.chosenText]}>
                  {presetMinutes}
                </Text>
                <Text style={[typography.caption, styles.mutedText]}>min</Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.delayMinutes && (
          <View style={styles.fieldErrorRow}>
            <Ionicons name="alert-circle" size={sizes.iconSmall} color={colors.error.dark} />
            <Text style={[typography.caption, styles.fieldErrorText]}>
              {fieldErrors.delayMinutes}
            </Text>
          </View>
        )}
      </AppCard>

      <AppButton
        label={activeDelay ? 'Update the delay' : 'Tell passengers'}
        size="large"
        isFullWidth
        iconName="megaphone-outline"
        isLoading={isSubmitting}
        onPress={submitReport}
      />
      <AppButton
        label="See my past reports"
        variant="text"
        iconName="time-outline"
        onPress={() => router.push('/(driver)/delay-history')}
      />

      <ConfirmDialog
        isVisible={isResolveDialogVisible}
        title={DELAY_MESSAGES.resolveTitle}
        message={DELAY_MESSAGES.resolveMessage}
        confirmLabel="Back on time"
        isConfirming={isSubmitting}
        onConfirm={confirmResolve}
        onCancel={() => setIsResolveDialogVisible(false)}
      />
      <ConfirmDialog
        isVisible={isCancelDialogVisible}
        title={DELAY_MESSAGES.cancelTitle}
        message={DELAY_MESSAGES.cancelMessage}
        confirmLabel="Withdraw"
        isDestructive
        isConfirming={isSubmitting}
        onConfirm={confirmCancel}
        onCancel={() => setIsCancelDialogVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  chosenText: {
    color: colors.primary[600],
  },
  activeCard: {
    backgroundColor: colors.warning.light,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeTitle: {
    flex: 1,
  },
  activeActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  activeActionButton: {
    flex: 1,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reasonButton: {
    flexGrow: 1,
    minWidth: '30%',
    minHeight: MIN_TOUCH_TARGET + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reasonButtonChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  minuteButton: {
    flexGrow: 1,
    minWidth: '28%',
    minHeight: MIN_TOUCH_TARGET + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  minuteButtonChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  fieldErrorText: {
    color: colors.error.dark,
  },
});
