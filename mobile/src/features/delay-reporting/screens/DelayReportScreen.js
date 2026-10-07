// Report Delay (Member 04, FR-08): the driver taps why the bus is late and every affected passenger
// is told. Built for one-handed use at a stop: the common reasons carry their usual duration, so a
// delay is two taps rather than a form.
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
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchMyTripOverview } from '../../tracking/services/trackingApi';
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
  DELAY_SCREEN_MESSAGES,
  MAX_DELAY_MINUTES,
  MIN_DELAY_MINUTES,
  OTHER_REASON_OPTION,
} from '../constants';

/**
 * The confirmation shown straight after a delay is sent.
 * @param {object} props - Component props.
 * @param {object} props.route - The route the delay is on.
 * @param {number} props.delayMinutes - Minutes reported.
 * @param {string} props.reasonLabel - Wording of the chosen reason.
 * @param {number} props.notifiedCount - How many passengers were told.
 * @returns {import('react').JSX.Element} The confirmation.
 */
function DelayReportedConfirmation({ route, delayMinutes, reasonLabel, notifiedCount }) {
  return (
    <View style={styles.confirmationBlock}>
      <View style={styles.confirmationIconCircle}>
        <Ionicons name="checkmark" size={sizes.iconXLarge} color={colors.success.dark} />
      </View>
      <Text style={typography.heading1}>{DELAY_SCREEN_MESSAGES.doneTitle}</Text>

      <AppCard style={styles.confirmationCard}>
        <Text style={typography.heading3}>Route {route?.routeNumber}</Text>
        <Text style={[typography.bodyMedium, styles.mutedText]}>
          {delayMinutes} minute delay
        </Text>
        <View style={styles.confirmationBadgeRow}>
          <StatusBadge status="delayed" label={reasonLabel} />
        </View>
      </AppCard>

      <Text style={[typography.bodyMedium, styles.centredMutedText]}>
        {notifiedCount} {notifiedCount === 1 ? 'passenger has' : 'passengers have'} been notified.
      </Text>
    </View>
  );
}

/**
 * The driver's delay reporting screen.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function DelayReportScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();

  const [tripOverview, setTripOverview] = useState(null);
  const [activeDelay, setActiveDelay] = useState(null);
  const [chosenReason, setChosenReason] = useState('');
  const [chosenMinutes, setChosenMinutes] = useState(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sentReport, setSentReport] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolveDialogVisible, setIsResolveDialogVisible] = useState(false);
  const [isCancelDialogVisible, setIsCancelDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadDelay = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useFocusEffect(reloadDelay);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([fetchActiveDelay(), fetchMyTripOverview()])
      .then(([loadedDelay, loadedOverview]) => {
        if (!isEffectActive) return;
        setActiveDelay(loadedDelay);
        setTripOverview(loadedOverview);
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
   * Picks a reason and, when that reason has a usual duration, fills the minutes in too.
   * @param {object} reasonOption - The card that was tapped.
   * @returns {void}
   */
  function chooseReason(reasonOption) {
    setChosenReason(reasonOption.reason);
    setFieldErrors({});
    if (reasonOption.suggestedMinutes) {
      setChosenMinutes(reasonOption.suggestedMinutes);
      setCustomMinutes('');
    } else {
      setChosenMinutes(null);
    }
  }

  // The typed box wins when it holds a number, so a driver can always override the suggestion.
  const typedMinutes = Number(customMinutes);
  const effectiveMinutes = customMinutes.length > 0 ? typedMinutes : chosenMinutes;
  const needsMinutes = Boolean(chosenReason) && !effectiveMinutes;

  /**
   * Checks the form the same way the server does, so a mistake is caught before a round trip.
   * @returns {boolean} True when the form can be sent.
   */
  function isFormValid() {
    const foundErrors = {};
    if (!chosenReason) foundErrors.reason = DELAY_MESSAGES.chooseReason;
    if (!effectiveMinutes) {
      foundErrors.delayMinutes = DELAY_MESSAGES.chooseMinutes;
    } else if (effectiveMinutes < MIN_DELAY_MINUTES || effectiveMinutes > MAX_DELAY_MINUTES) {
      foundErrors.delayMinutes = `Enter between ${MIN_DELAY_MINUTES} and ${MAX_DELAY_MINUTES} minutes.`;
    }
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
        delayMinutes: effectiveMinutes,
        reasonNote: chosenReason === DELAY_REASONS.OTHER ? reasonNote.trim() : undefined,
      };
      const { notifiedCount } = activeDelay
        ? await updateDelayReport(activeDelay.id, delayDetails)
        : await reportDelay(delayDetails);
      setSentReport({ ...delayDetails, notifiedCount });
    } catch (submitError) {
      showErrorToast(submitError.message);
      setFieldErrors(submitError.fieldErrors || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Clears the form after the driver finishes with the confirmation screen.
   * @returns {void}
   */
  function resetForm() {
    setSentReport(null);
    setChosenReason('');
    setChosenMinutes(null);
    setCustomMinutes('');
    setReasonNote('');
    setFieldErrors({});
    reloadDelay();
  }

  const confirmResolve = async () => {
    setIsSubmitting(true);
    try {
      await resolveDelayReport(activeDelay.id);
      showSuccessToast('Marked as back on time.');
      setIsResolveDialogVisible(false);
      resetForm();
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
      resetForm();
    } catch (cancelError) {
      showErrorToast(cancelError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title={DELAY_SCREEN_MESSAGES.formTitle}
      onBackPress={router.canGoBack() ? router.back : undefined}
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

  if (sentReport) {
    const reasonLabel =
      [...DELAY_REASON_OPTIONS, OTHER_REASON_OPTION].find(
        (candidateReason) => candidateReason.reason === sentReport.reason
      )?.label || 'Delay';
    return (
      <ScreenContainer
        isScrollable
        header={screenHeader}
        footer={
          <View style={styles.footerBar}>
            <AppButton
              label={DELAY_SCREEN_MESSAGES.backToDashboard}
              size="large"
              isFullWidth
              onPress={() => {
                resetForm();
                router.replace('/(driver)/(tabs)/home');
              }}
            />
          </View>
        }
      >
        <DelayReportedConfirmation
          route={tripOverview?.route}
          delayMinutes={sentReport.delayMinutes}
          reasonLabel={reasonLabel}
          notifiedCount={sentReport.notifiedCount}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      {tripOverview?.route && (
        <View style={styles.routePill}>
          <Text style={[typography.label, styles.routePillText]}>
            Route {tripOverview.route.routeNumber} &#183; {tripOverview.route.origin} &#8594;{' '}
            {tripOverview.route.destination}
          </Text>
        </View>
      )}

      {activeDelay && (
        <AppCard style={styles.activeCard}>
          <View style={styles.activeHeaderRow}>
            <Ionicons name="alert-circle" size={sizes.iconLarge} color={colors.warning.dark} />
            <Text style={[typography.bodyLarge, styles.activeTitle]}>
              Passengers already know you are {activeDelay.delayMinutes} min late
            </Text>
          </View>
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

      <View>
        <Text style={typography.heading3}>{DELAY_SCREEN_MESSAGES.formTitle}</Text>
        <Text style={[typography.bodySmall, styles.mutedText]}>
          {DELAY_SCREEN_MESSAGES.formSubtitle}
        </Text>
      </View>

      <View style={styles.reasonGrid}>
        {DELAY_REASON_OPTIONS.map((reasonOption) => {
          const isChosen = reasonOption.reason === chosenReason;
          return (
            <Pressable
              key={reasonOption.reason}
              onPress={() => chooseReason(reasonOption)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isChosen }}
              accessibilityLabel={
                reasonOption.suggestedMinutes
                  ? `${reasonOption.label}, adds ${reasonOption.suggestedMinutes} minutes`
                  : `${reasonOption.label}, you choose the minutes`
              }
              style={[
                styles.reasonCard,
                styles[`reasonCard_${reasonOption.tone}`],
                isChosen && styles.reasonCardChosen,
              ]}
            >
              <View style={styles.reasonTopRow}>
                <Ionicons
                  name={reasonOption.iconName}
                  size={sizes.iconLarge}
                  color={isChosen ? colors.primary[600] : colors.text.secondary}
                />
                {isChosen && (
                  <Ionicons
                    name="checkmark-circle"
                    size={sizes.iconMedium}
                    color={colors.primary[600]}
                  />
                )}
              </View>
              <Text style={typography.bodyLarge}>{reasonOption.label}</Text>
              <Text style={[typography.bodySmall, styles.reasonMinutesText]}>
                {reasonOption.suggestedMinutes ? `+${reasonOption.suggestedMinutes} min` : '—'}
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

      {/* Shown when the chosen reason has no usual duration, or to override a suggested one. */}
      {(needsMinutes || chosenReason) && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>
            {DELAY_MESSAGES.chooseMinutes}
          </Text>
          <View style={styles.minuteGrid}>
            {DELAY_PRESET_MINUTES.map((presetMinutes) => {
              const isChosenMinutes = presetMinutes === effectiveMinutes;
              return (
                <Pressable
                  key={presetMinutes}
                  onPress={() => {
                    setChosenMinutes(presetMinutes);
                    setCustomMinutes('');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isChosenMinutes }}
                  accessibilityLabel={`${presetMinutes} minutes late`}
                  style={[styles.minuteButton, isChosenMinutes && styles.minuteButtonChosen]}
                >
                  <Text style={[typography.heading3, isChosenMinutes && styles.chosenText]}>
                    {presetMinutes}
                  </Text>
                  <Text style={[typography.caption, styles.mutedText]}>min</Text>
                </Pressable>
              );
            })}
          </View>
          <AppTextInput
            label={DELAY_SCREEN_MESSAGES.otherPlaceholder}
            value={customMinutes}
            onChangeText={(typedText) => setCustomMinutes(typedText.replace(/\D/g, ''))}
            errorText={fieldErrors.delayMinutes}
            helperText={`Between ${MIN_DELAY_MINUTES} and ${MAX_DELAY_MINUTES} minutes.`}
            iconName="time-outline"
            keyboardType="number-pad"
          />
        </AppCard>
      )}

      <Pressable
        onPress={() => chooseReason(OTHER_REASON_OPTION)}
        accessibilityRole="radio"
        accessibilityState={{ checked: chosenReason === DELAY_REASONS.OTHER }}
        accessibilityLabel="Other reason, you describe it"
        style={[
          styles.otherRow,
          chosenReason === DELAY_REASONS.OTHER && styles.otherRowChosen,
        ]}
      >
        <Ionicons
          name={OTHER_REASON_OPTION.iconName}
          size={sizes.iconLarge}
          color={colors.text.secondary}
        />
        <Text style={[typography.bodyMedium, styles.otherText]}>{OTHER_REASON_OPTION.label}</Text>
        <Ionicons
          name={chosenReason === DELAY_REASONS.OTHER ? 'radio-button-on' : 'radio-button-off'}
          size={sizes.iconMedium}
          color={
            chosenReason === DELAY_REASONS.OTHER ? colors.primary[600] : colors.text.disabled
          }
        />
      </Pressable>

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

      <AppButton
        label={activeDelay ? 'Update the delay' : DELAY_SCREEN_MESSAGES.submit}
        size="large"
        isFullWidth
        iconName="megaphone-outline"
        isLoading={isSubmitting}
        onPress={submitReport}
      />
      <Text style={[typography.caption, styles.centredMutedText]}>
        {DELAY_SCREEN_MESSAGES.footnote}
      </Text>
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
  centredMutedText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  chosenText: {
    color: colors.primary[600],
  },
  routePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[100],
  },
  routePillText: {
    color: colors.primary[600],
  },
  activeCard: {
    backgroundColor: colors.warning.light,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
    gap: spacing.md,
  },
  reasonCard: {
    flexGrow: 1,
    minWidth: '45%',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reasonCard_warning: {
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.main,
  },
  reasonCard_error: {
    backgroundColor: colors.error.light,
    borderColor: colors.error.main,
  },
  reasonCard_neutral: {
    backgroundColor: colors.surface,
  },
  reasonCardChosen: {
    borderColor: colors.primary[500],
    borderWidth: sizes.borderThick,
  },
  reasonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonMinutesText: {
    color: colors.text.secondary,
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  minuteButton: {
    flexGrow: 1,
    minWidth: '28%',
    minHeight: MIN_TOUCH_TARGET,
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
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: sizes.borderThin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  otherRowChosen: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[100],
  },
  otherText: {
    flex: 1,
    color: colors.text.secondary,
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldErrorText: {
    color: colors.error.dark,
  },
  confirmationBlock: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  confirmationIconCircle: {
    width: sizes.iconHuge,
    height: sizes.iconHuge,
    borderRadius: radii.pill,
    backgroundColor: colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.background,
  },
  confirmationBadgeRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  footerBar: {
    padding: sizes.screenGutter,
    borderTopWidth: sizes.borderThin,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
