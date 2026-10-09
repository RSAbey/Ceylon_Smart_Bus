// Creating or editing a route, stops and all. One screen does both: with a routeId it loads that
// route and saves changes, without one it creates. Stop positions are not typed in — the order the
// stops are listed in is the order the bus calls at them, which is what the server stores as
// stopSequence.
import { useCallback, useEffect, useState } from 'react';
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
import RouteStopEditor from '../components/RouteStopEditor';
import {
  ADMIN_MESSAGES,
  ROUTE_STATUSES,
  ROUTE_STATUS_LABELS,
  SERVICE_TIME_PATTERN,
} from '../constants';
import {
  createRoute,
  fetchRouteDetails,
  updateRoute,
} from '../services/adminRouteApi';

const MIN_STOPS_PER_ROUTE = 2;
const ONE_PLACE = 1;

/** An empty stop row, as the editor holds it: everything typed, so everything a string. */
const EMPTY_STOP = Object.freeze({
  stopName: '',
  latitude: '',
  longitude: '',
  fareFromOrigin: '',
});

/**
 * Checks one stop and returns its errors, keyed the way the editor expects.
 * @param {object} routeStop - A typed stop row.
 * @param {number} stopIndex - Where it sits in the list.
 * @returns {Object<string, string>} Error text per "index.field" key.
 */
function findStopErrors(routeStop, stopIndex) {
  const stopErrors = {};
  if (!routeStop.stopName.trim()) {
    stopErrors[`${stopIndex}.stopName`] = 'Every stop needs a name.';
  }
  if (!Number.isFinite(Number(routeStop.latitude)) || routeStop.latitude === '') {
    stopErrors[`${stopIndex}.latitude`] = 'Enter the latitude, for example 6.9065.';
  }
  if (!Number.isFinite(Number(routeStop.longitude)) || routeStop.longitude === '') {
    stopErrors[`${stopIndex}.longitude`] = 'Enter the longitude, for example 79.9215.';
  }
  if (!Number.isFinite(Number(routeStop.fareFromOrigin)) || routeStop.fareFromOrigin === '') {
    stopErrors[`${stopIndex}.fareFromOrigin`] = 'Enter the fare from the first stop.';
  }
  return stopErrors;
}

/**
 * Admin route form.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminRouteFormScreen() {
  const router = useRouter();
  const { routeId } = useLocalSearchParams();
  const { showSuccessToast } = useToast();

  const [routeNumber, setRouteNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [serviceStartTime, setServiceStartTime] = useState('');
  const [serviceEndTime, setServiceEndTime] = useState('');
  const [status, setStatus] = useState(ROUTE_STATUSES.DRAFT);
  const [stops, setStops] = useState([{ ...EMPTY_STOP }, { ...EMPTY_STOP }]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [stopErrors, setStopErrors] = useState({});
  const [isLoading, setIsLoading] = useState(Boolean(routeId));
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = Boolean(routeId);

  useEffect(() => {
    if (!isEditing) return undefined;
    let isEffectActive = true;

    fetchRouteDetails(routeId)
      .then((loadedRoute) => {
        if (!isEffectActive) return;
        const { route, stops: loadedStops } = loadedRoute;
        setRouteNumber(route.routeNumber);
        setRouteName(route.routeName);
        setOrigin(route.origin);
        setDestination(route.destination);
        setBaseFare(String(route.baseFare));
        setPerKmRate(route.perKmRate ? String(route.perKmRate) : '');
        setServiceStartTime(route.serviceStartTime || '');
        setServiceEndTime(route.serviceEndTime || '');
        setStatus(route.status);
        setStops(
          loadedStops.map((loadedStop) => ({
            stopName: loadedStop.stopName,
            latitude: String(loadedStop.latitude),
            longitude: String(loadedStop.longitude),
            fareFromOrigin: String(loadedStop.fareFromOrigin),
          }))
        );
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
  }, [routeId, isEditing]);

  const changeStop = (stopIndex, fieldName, typedText) => {
    setStops((previousStops) =>
      previousStops.map((previousStop, previousIndex) =>
        previousIndex === stopIndex ? { ...previousStop, [fieldName]: typedText } : previousStop
      )
    );
  };

  const moveStop = (stopIndex, places) => {
    setStops((previousStops) => {
      const reorderedStops = [...previousStops];
      const [movedStop] = reorderedStops.splice(stopIndex, ONE_PLACE);
      reorderedStops.splice(stopIndex + places, ONE_PLACE, movedStop);
      return reorderedStops;
    });
  };

  const removeStop = (stopIndex) => {
    setStops((previousStops) =>
      previousStops.filter((_unusedStop, previousIndex) => previousIndex !== stopIndex)
    );
  };

  const addStop = () => setStops((previousStops) => [...previousStops, { ...EMPTY_STOP }]);

  const saveRoute = useCallback(async () => {
    const formErrors = {};
    if (!routeNumber.trim()) formErrors.routeNumber = 'Enter the route number, for example 154.';
    if (!routeName.trim()) formErrors.routeName = 'Enter the route name.';
    if (!origin.trim()) formErrors.origin = 'Enter the starting point.';
    if (!destination.trim()) formErrors.destination = 'Enter the destination.';
    if (baseFare === '' || !Number.isFinite(Number(baseFare))) {
      formErrors.baseFare = 'Enter the base fare in rupees.';
    }
    if (perKmRate && !Number.isFinite(Number(perKmRate))) {
      formErrors.perKmRate = 'Enter the per-kilometre rate in rupees.';
    }
    if (serviceStartTime && !SERVICE_TIME_PATTERN.test(serviceStartTime)) {
      formErrors.serviceStartTime = ADMIN_MESSAGES.invalidTime;
    }
    if (serviceEndTime && !SERVICE_TIME_PATTERN.test(serviceEndTime)) {
      formErrors.serviceEndTime = ADMIN_MESSAGES.invalidTime;
    }
    if (stops.length < MIN_STOPS_PER_ROUTE) {
      formErrors.stops = `A route needs at least ${MIN_STOPS_PER_ROUTE} stops.`;
    }

    const allStopErrors = stops.reduce(
      (collectedErrors, routeStop, stopIndex) => ({
        ...collectedErrors,
        ...findStopErrors(routeStop, stopIndex),
      }),
      {}
    );

    setFieldErrors(formErrors);
    setStopErrors(allStopErrors);
    if (Object.keys(formErrors).length > 0 || Object.keys(allStopErrors).length > 0) return;

    const routeForm = {
      routeNumber: routeNumber.trim(),
      routeName: routeName.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      baseFare: Number(baseFare),
      perKmRate: perKmRate ? Number(perKmRate) : undefined,
      serviceStartTime: serviceStartTime || undefined,
      serviceEndTime: serviceEndTime || undefined,
      status,
      stops: stops.map((routeStop) => ({
        stopName: routeStop.stopName.trim(),
        latitude: Number(routeStop.latitude),
        longitude: Number(routeStop.longitude),
        fareFromOrigin: Number(routeStop.fareFromOrigin),
      })),
    };

    setIsSaving(true);
    try {
      if (isEditing) await updateRoute(routeId, routeForm);
      else await createRoute(routeForm);
      showSuccessToast(isEditing ? 'Route updated.' : 'Route created.');
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
    routeNumber,
    routeName,
    origin,
    destination,
    baseFare,
    perKmRate,
    serviceStartTime,
    serviceEndTime,
    status,
    stops,
    isEditing,
    routeId,
    router,
    showSuccessToast,
  ]);

  const statusOptions = Object.values(ROUTE_STATUSES).map((statusValue) => ({
    key: statusValue,
    label: ROUTE_STATUS_LABELS[statusValue],
  }));

  const screenHeader = (
    <AppHeader
      variant="back"
      title={isEditing ? 'Edit route' : 'New route'}
      onBackPress={router.canGoBack() ? router.back : undefined}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading the route..." />
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
        label="Route number"
        placeholder="154"
        value={routeNumber}
        onChangeText={setRouteNumber}
        errorText={fieldErrors.routeNumber}
      />
      <AppTextInput
        label="Route name"
        placeholder="Kaduwela - Kollupitiya"
        value={routeName}
        onChangeText={setRouteName}
        errorText={fieldErrors.routeName}
      />
      <AppTextInput
        label="Starts at"
        placeholder="Kaduwela"
        value={origin}
        onChangeText={setOrigin}
        errorText={fieldErrors.origin}
      />
      <AppTextInput
        label="Ends at"
        placeholder="Kollupitiya"
        value={destination}
        onChangeText={setDestination}
        errorText={fieldErrors.destination}
      />
      <AppTextInput
        label="Base fare (Rs.)"
        placeholder="120"
        value={baseFare}
        onChangeText={setBaseFare}
        errorText={fieldErrors.baseFare}
        keyboardType="number-pad"
      />
      <AppTextInput
        label="Per kilometre rate (Rs., optional)"
        placeholder="35"
        value={perKmRate}
        onChangeText={setPerKmRate}
        errorText={fieldErrors.perKmRate}
        keyboardType="number-pad"
      />
      <AppTextInput
        label="First departure (optional)"
        placeholder="05:00"
        value={serviceStartTime}
        onChangeText={setServiceStartTime}
        errorText={fieldErrors.serviceStartTime}
        helperText="HH:MM on a 24-hour clock."
        keyboardType="numbers-and-punctuation"
      />
      <AppTextInput
        label="Last departure (optional)"
        placeholder="22:30"
        value={serviceEndTime}
        onChangeText={setServiceEndTime}
        errorText={fieldErrors.serviceEndTime}
        keyboardType="numbers-and-punctuation"
      />
      <AdminPickerField
        label="Status"
        options={statusOptions}
        selectedKey={status}
        onSelect={setStatus}
        helperText="Only an active route is visible to passengers."
        errorText={fieldErrors.status}
      />

      <RouteStopEditor
        stops={stops}
        stopErrors={stopErrors}
        onChangeStop={changeStop}
        onMoveStop={moveStop}
        onRemoveStop={removeStop}
        onAddStop={addStop}
      />
      {Boolean(fieldErrors.stops) && (
        <Text style={[typography.caption, styles.errorText]}>{fieldErrors.stops}</Text>
      )}

      <AppButton
        label={isEditing ? 'Save changes' : 'Create the route'}
        size="large"
        isFullWidth
        isLoading={isSaving}
        onPress={saveRoute}
      />
      {isEditing && (
        <Text style={[typography.caption, styles.mutedText]}>
          Saving replaces the whole stop list, so every stop above is what the route will have.
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mutedText: {
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.error.dark,
  },
});
