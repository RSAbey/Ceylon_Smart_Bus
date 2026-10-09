// Registering or editing a bus. The bus code (BUS-014) is not on the form: the server allocates it,
// so two administrators cannot invent the same one.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/ui/ToastMessage';
import { colors, typography } from '../../../theme';
import AdminPickerField from '../components/AdminPickerField';
import {
  ADMIN_MESSAGES,
  BUS_MODELS,
  BUS_STATUSES,
  DATE_INPUT_HINT,
  DATE_INPUT_PATTERN,
  PLATE_NUMBER_PATTERN,
} from '../constants';
import {
  createBus,
  fetchBuses,
  fetchRoutesForPicker,
  updateBus,
} from '../services/adminTransportApi';

const MIN_CAPACITY = 1;
const MAX_CAPACITY = 100;
/** An ISO timestamp's date part, "2026-10-20", is this many characters. */
const DATE_PART_LENGTH = 10;
/** The picker key that means "not on a route yet". */
const NO_ROUTE = 'none';

/**
 * Admin bus form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminBusFormScreen() {
  const router = useRouter();
  const { busId } = useLocalSearchParams();
  const { showSuccessToast } = useToast();

  const [plateNumber, setPlateNumber] = useState('');
  const [busName, setBusName] = useState('');
  const [model, setModel] = useState(BUS_MODELS[0]);
  const [capacity, setCapacity] = useState('');
  const [gpsDeviceId, setGpsDeviceId] = useState('');
  const [status, setStatus] = useState(BUS_STATUSES.ACTIVE);
  const [routeKey, setRouteKey] = useState(NO_ROUTE);
  const [lastServicedOn, setLastServicedOn] = useState('');
  const [routeOptions, setRouteOptions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(busId);

  useEffect(() => {
    let isEffectActive = true;

    /**
     * Loads the route picker and, when editing, the bus being changed.
     * @returns {Promise<void>} Resolves once the form is ready.
     */
    async function loadFormContents() {
      try {
        const pickerRoutes = await fetchRoutesForPicker();
        if (!isEffectActive) return;
        setRouteOptions(pickerRoutes);

        if (!isEditing) return;
        // There is a single-bus endpoint, but the list is already indexed by id and one request
        // fills both the picker and the form.
        const fleet = await fetchBuses();
        if (!isEffectActive) return;
        const matchingBus = fleet.buses.find((fleetBus) => fleetBus.id === busId);
        if (!matchingBus) {
          setLoadErrorMessage('That bus no longer exists.');
          return;
        }
        setPlateNumber(matchingBus.plateNumber);
        setBusName(matchingBus.busName);
        setModel(matchingBus.model);
        setCapacity(String(matchingBus.capacity));
        setGpsDeviceId(matchingBus.gpsDeviceId);
        setStatus(matchingBus.status);
        setRouteKey(matchingBus.routeId?.id || NO_ROUTE);
        setLastServicedOn(
          matchingBus.lastServicedAt ? matchingBus.lastServicedAt.slice(0, DATE_PART_LENGTH) : ''
        );
      } catch (loadError) {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      } finally {
        if (isEffectActive) setIsLoading(false);
      }
    }

    loadFormContents();
    return () => {
      isEffectActive = false;
    };
  }, [busId, isEditing]);

  const routePickerOptions = useMemo(
    () => [
      { key: NO_ROUTE, label: 'No route yet' },
      ...routeOptions.map((pickerRoute) => ({
        key: pickerRoute.id,
        label: `Route ${pickerRoute.routeNumber}`,
      })),
    ],
    [routeOptions]
  );

  const saveBus = useCallback(async () => {
    const formErrors = {};
    if (!PLATE_NUMBER_PATTERN.test(plateNumber.trim())) {
      formErrors.plateNumber = 'Enter a plate number such as NB-1234.';
    }
    if (!busName.trim()) formErrors.busName = 'Enter the name painted on the bus.';
    const seatCount = Number(capacity);
    if (!Number.isInteger(seatCount) || seatCount < MIN_CAPACITY || seatCount > MAX_CAPACITY) {
      formErrors.capacity = `Enter how many passengers it seats, between ${MIN_CAPACITY} and ${MAX_CAPACITY}.`;
    }
    if (!gpsDeviceId.trim()) formErrors.gpsDeviceId = 'Enter the GPS device id.';
    if (lastServicedOn && !DATE_INPUT_PATTERN.test(lastServicedOn)) {
      formErrors.lastServicedAt = ADMIN_MESSAGES.invalidDate;
    }
    setFieldErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const busForm = {
      plateNumber: plateNumber.trim(),
      busName: busName.trim(),
      model,
      capacity: seatCount,
      gpsDeviceId: gpsDeviceId.trim(),
      status,
      routeId: routeKey === NO_ROUTE ? null : routeKey,
      lastServicedAt: lastServicedOn || null,
    };

    setIsSaving(true);
    try {
      if (isEditing) await updateBus(busId, busForm);
      else await createBus(busForm);
      showSuccessToast(isEditing ? 'Bus updated.' : 'Bus registered.');
      router.back();
    } catch (saveError) {
      setFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) {
        setLoadErrorMessage(saveError.message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    plateNumber,
    busName,
    model,
    capacity,
    gpsDeviceId,
    status,
    routeKey,
    lastServicedOn,
    isEditing,
    busId,
    router,
    showSuccessToast,
  ]);

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isEditing ? 'Edit bus' : 'Register a bus'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the form..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage && !isSaving) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={router.back} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppTextInput
        label="Plate number"
        placeholder="NB-1015"
        value={plateNumber}
        onChangeText={setPlateNumber}
        errorText={fieldErrors.plateNumber}
        autoCapitalize="characters"
      />
      <AppTextInput
        label="Bus name"
        placeholder="Chandra"
        value={busName}
        onChangeText={setBusName}
        errorText={fieldErrors.busName}
      />
      <AdminPickerField
        label="Model"
        options={BUS_MODELS.map((busModel) => ({ key: busModel, label: busModel }))}
        selectedKey={model}
        onSelect={setModel}
        errorText={fieldErrors.model}
      />
      <AppTextInput
        label="Seats"
        placeholder="52"
        value={capacity}
        onChangeText={setCapacity}
        errorText={fieldErrors.capacity}
        keyboardType="number-pad"
      />
      <AppTextInput
        label="GPS device id"
        placeholder="GPS-CSB-0001"
        value={gpsDeviceId}
        onChangeText={setGpsDeviceId}
        errorText={fieldErrors.gpsDeviceId}
        autoCapitalize="characters"
      />
      <AdminPickerField
        label="Status"
        options={Object.values(BUS_STATUSES).map((statusValue) => ({
          key: statusValue,
          label: statusValue,
        }))}
        selectedKey={status}
        onSelect={setStatus}
        helperText="A retired bus is kept for reporting but never tracked again."
        errorText={fieldErrors.status}
      />
      <AdminPickerField
        label="Route"
        options={routePickerOptions}
        selectedKey={routeKey}
        onSelect={setRouteKey}
        errorText={fieldErrors.routeId}
      />
      <AppTextInput
        label="Last serviced (optional)"
        placeholder={DATE_INPUT_HINT}
        value={lastServicedOn}
        onChangeText={setLastServicedOn}
        errorText={fieldErrors.lastServicedAt}
        helperText={`Type the date as ${DATE_INPUT_HINT}.`}
        keyboardType="numbers-and-punctuation"
      />

      <AppButton
        label={isEditing ? 'Save changes' : 'Register the bus'}
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={saveBus}
      />
      {!isEditing && (
        <Text style={[typography.caption, styles.mutedText]}>
          The bus code, such as BUS-014, is allocated by the system once the bus is registered.
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
});
