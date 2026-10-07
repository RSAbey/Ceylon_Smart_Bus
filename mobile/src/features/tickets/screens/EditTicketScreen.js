// Change Ticket (Member 03, FR-05): move an unused ticket to different stops or a different seat.
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppCard from '../../../components/ui/AppCard';
import AppButton from '../../../components/ui/AppButton';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { MIN_TOUCH_TARGET, colors, radii, sizes, spacing, typography } from '../../../theme';
import { fetchTicketDetails, updateTicket } from '../services/ticketApi';
import { fetchRouteDetails } from '../../routes/services/routeApi';
import { CURRENCY_PREFIX } from '../constants';

/**
 * Loads the ticket and the stops of its route together, since both are needed to edit it.
 * @param {string} ticketId - Ticket being changed.
 * @returns {Promise<{ticketView: object, stops: object[]}>} Ticket and its route stops.
 */
async function loadTicketAndStops(ticketId) {
  const ticketView = await fetchTicketDetails(ticketId);
  const routeDetails = await fetchRouteDetails(ticketView.ticket.routeId);
  return { ticketView, stops: routeDetails.stops };
}

/**
 * Ticket edit form. Only the stops and the seat can change; the fare is repriced by the server.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function EditTicketScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  const [ticketView, setTicketView] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [boardingStopId, setBoardingStopId] = useState('');
  const [alightingStopId, setAlightingStopId] = useState('');
  const [openPickerField, setOpenPickerField] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  const reloadTicket = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    loadTicketAndStops(ticketId)
      .then(({ ticketView: loadedTicket, stops }) => {
        if (!isEffectActive) return;
        setTicketView(loadedTicket);
        setRouteStops(stops);
        setBoardingStopId(String(loadedTicket.ticket.boardingStopId));
        setAlightingStopId(String(loadedTicket.ticket.alightingStopId));
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
  }, [ticketId, reloadCounter]);

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await updateTicket(ticketId, { boardingStopId, alightingStopId });
      showSuccessToast('Ticket updated.');
      router.back();
    } catch (saveError) {
      showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const screenHeader = (
    <AppHeader
      variant="back"
      title="Change Ticket"
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading your ticket..." />
      </ScreenContainer>
    );
  }
  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reloadTicket} />
      </ScreenContainer>
    );
  }

  const boardingStop = routeStops.find((routeStop) => routeStop.id === boardingStopId);
  const alightingStop = routeStops.find((routeStop) => routeStop.id === alightingStopId);
  const isJourneyBackwards =
    boardingStop && alightingStop && boardingStop.stopSequence >= alightingStop.stopSequence;
  const estimatedFare =
    boardingStop && alightingStop
      ? Math.max(0, alightingStop.fareFromOrigin - boardingStop.fareFromOrigin)
      : null;
  const hasChanges =
    boardingStopId !== String(ticketView.ticket.boardingStopId) ||
    alightingStopId !== String(ticketView.ticket.alightingStopId);

  /**
   * Stores the stop the passenger tapped in whichever field opened the picker.
   * @param {object} pickedStop - The stop tapped in the list.
   * @returns {void}
   */
  function selectStop(pickedStop) {
    if (openPickerField === 'boarding') setBoardingStopId(pickedStop.id);
    if (openPickerField === 'alighting') setAlightingStopId(pickedStop.id);
    setOpenPickerField('');
  }

  return (
    <ScreenContainer isScrollable header={screenHeader}>
      <AppCard>
        <Text style={[typography.sectionHeading, styles.mutedText]}>
          Ticket {ticketView.ticket.ticketKey}
        </Text>
        <Text style={typography.bodyMedium}>
          Route {ticketView.route?.routeNumber} · Seat {ticketView.seatNumber || 'released'}
        </Text>
      </AppCard>

      <AppCard>
        <Pressable
          onPress={() => setOpenPickerField('boarding')}
          accessibilityRole="button"
          accessibilityLabel={`Getting on at ${boardingStop?.stopName}. Tap to change.`}
          style={styles.stopField}
        >
          <Ionicons
            name="radio-button-on-outline"
            size={sizes.iconLarge}
            color={colors.primary[600]}
          />
          <View style={styles.stopFieldText}>
            <Text style={[typography.caption, styles.mutedText]}>Getting on</Text>
            <Text style={typography.bodyLarge}>{boardingStop?.stopName}</Text>
          </View>
          <Ionicons name="chevron-down" size={sizes.iconMedium} color={colors.text.secondary} />
        </Pressable>
        <View style={styles.fieldDivider} />
        <Pressable
          onPress={() => setOpenPickerField('alighting')}
          accessibilityRole="button"
          accessibilityLabel={`Getting off at ${alightingStop?.stopName}. Tap to change.`}
          style={styles.stopField}
        >
          <Ionicons name="location-outline" size={sizes.iconLarge} color={colors.primary[600]} />
          <View style={styles.stopFieldText}>
            <Text style={[typography.caption, styles.mutedText]}>Getting off</Text>
            <Text style={typography.bodyLarge}>{alightingStop?.stopName}</Text>
          </View>
          <Ionicons name="chevron-down" size={sizes.iconMedium} color={colors.text.secondary} />
        </Pressable>
      </AppCard>

      {isJourneyBackwards && (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle" size={sizes.iconMedium} color={colors.error.dark} />
          <Text style={[typography.bodySmall, styles.warningText]}>
            This bus reaches your boarding stop after your destination. Swap the two stops.
          </Text>
        </View>
      )}

      {estimatedFare !== null && !isJourneyBackwards && (
        <AppCard>
          <Text style={[typography.sectionHeading, styles.mutedText]}>New fare</Text>
          <Text style={[typography.heading1, styles.fareText]}>
            {CURRENCY_PREFIX} {estimatedFare}
          </Text>
          {estimatedFare !== ticketView.ticket.fareAmount && (
            <Text style={[typography.caption, styles.mutedText]}>
              Was {CURRENCY_PREFIX} {ticketView.ticket.fareAmount}. Settle any difference with the conductor.
            </Text>
          )}
        </AppCard>
      )}

      <AppButton
        label="Save changes"
        size="large"
        isFullWidth
        isLoading={isSaving}
        isDisabled={!hasChanges || isJourneyBackwards}
        onPress={saveChanges}
      />
      <AppButton
        label="Change my seat instead"
        variant="outline"
        isFullWidth
        iconName="grid-outline"
        onPress={() => router.push(`/(passenger)/seat-selection/${ticketView.ticket.tripId}?ticketId=${ticketId}`)}
      />

      <Modal
        visible={Boolean(openPickerField)}
        animationType="slide"
        transparent
        onRequestClose={() => setOpenPickerField('')}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.heading3}>
                {openPickerField === 'boarding' ? 'Where do you get on?' : 'Where do you get off?'}
              </Text>
              <AppButton
                label="Close"
                variant="text"
                size="small"
                onPress={() => setOpenPickerField('')}
              />
            </View>
            <ScrollView>
              {routeStops.map((routeStop) => (
                <Pressable
                  key={routeStop.id}
                  onPress={() => selectStop(routeStop)}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${routeStop.stopName}`}
                  style={styles.pickerRow}
                >
                  <Text style={typography.bodyLarge}>{routeStop.stopName}</Text>
                  <Text style={[typography.caption, styles.mutedText]}>
                    Stop {routeStop.stopSequence}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  stopField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm,
  },
  stopFieldText: {
    flex: 1,
    gap: spacing.xxs,
  },
  fieldDivider: {
    height: sizes.borderThin,
    backgroundColor: colors.border,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.error.light,
  },
  warningText: {
    flex: 1,
    color: colors.error.dark,
  },
  fareText: {
    color: colors.primary[600],
    marginVertical: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    maxHeight: '75%',
    padding: sizes.screenGutter,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerRow: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderBottomWidth: sizes.borderThin,
    borderBottomColor: colors.border,
  },
});
