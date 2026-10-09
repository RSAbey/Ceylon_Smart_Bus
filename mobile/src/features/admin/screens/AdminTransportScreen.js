// Transport Data on mobile: the bus fleet and the driver roster, the two halves of the dashboard's
// Transport Data page. The dashboard puts them side by side; a phone has room for one at a time, so
// a switch at the top chooses which half is on screen.
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../../components/ui/ScreenContainer';
import AppHeader from '../../../components/navigation/AppHeader';
import AppButton from '../../../components/ui/AppButton';
import AppTextInput from '../../../components/ui/AppTextInput';
import LoadingState from '../../../components/feedback/LoadingState';
import ErrorState from '../../../components/feedback/ErrorState';
import EmptyState from '../../../components/feedback/EmptyState';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/ToastMessage';
import useAdminCollection from '../hooks/useAdminCollection';
import FilterChipRow from '../components/FilterChipRow';
import AdminPickerField from '../components/AdminPickerField';
import AdminRecordCard from '../components/AdminRecordCard';
import {
  ADMIN_MESSAGES,
  BUS_STATUSES,
  BUS_STATUS_TONES,
  DRIVER_DUTY_STATUSES,
  DUTY_STATUS_LABELS,
  DUTY_STATUS_TONES,
  LICENSE_CLASS_LABELS,
} from '../constants';
import {
  deleteBus,
  deleteDriver,
  fetchBuses,
  fetchDrivers,
} from '../services/adminTransportApi';

const ALL_STATUSES = 'all';
/** Which half of Transport Data is on screen. */
const TRANSPORT_HALVES = Object.freeze({ BUSES: 'buses', DRIVERS: 'drivers' });

/**
 * Transport Data.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminTransportScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();
  const [visibleHalf, setVisibleHalf] = useState(TRANSPORT_HALVES.BUSES);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [searchText, setSearchText] = useState('');
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isShowingBuses = visibleHalf === TRANSPORT_HALVES.BUSES;

  const loadTransport = useCallback(() => {
    const appliedStatus = statusFilter === ALL_STATUSES ? undefined : statusFilter;
    const appliedSearch = searchText.trim() || undefined;
    return isShowingBuses
      ? fetchBuses({ status: appliedStatus, searchText: appliedSearch })
      : fetchDrivers({ dutyStatus: appliedStatus, searchText: appliedSearch });
  }, [isShowingBuses, statusFilter, searchText]);

  const { collection, isLoading, loadErrorMessage, reload } = useAdminCollection(loadTransport);

  /**
   * Switches half and clears the filter, because a bus status is not a driver duty status.
   * @param {string} halfKey - One of TRANSPORT_HALVES.
   * @returns {void}
   */
  const switchHalf = (halfKey) => {
    setVisibleHalf(halfKey);
    setStatusFilter(ALL_STATUSES);
    setSearchText('');
  };

  const filterChips = useMemo(() => {
    const statusValues = isShowingBuses
      ? Object.values(BUS_STATUSES)
      : Object.values(DRIVER_DUTY_STATUSES);
    return [
      { key: ALL_STATUSES, label: ADMIN_MESSAGES.allFilterLabel, count: collection?.totalCount },
      ...statusValues.map((statusValue) => ({
        key: statusValue,
        label: isShowingBuses ? statusValue : DUTY_STATUS_LABELS[statusValue],
      })),
    ];
  }, [isShowingBuses, collection]);

  const confirmDeletion = async () => {
    const recordToDelete = pendingDeletion;
    setIsDeleting(true);
    try {
      if (recordToDelete.kind === TRANSPORT_HALVES.BUSES) await deleteBus(recordToDelete.id);
      else await deleteDriver(recordToDelete.id);
      setPendingDeletion(null);
      showSuccessToast(recordToDelete.kind === TRANSPORT_HALVES.BUSES ? 'Bus deleted.' : 'Driver deleted.');
      reload();
    } catch (deleteError) {
      setPendingDeletion(null);
      showErrorToast(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const screenHeader = <AppHeader title="Transport Data" />;

  const halfPicker = (
    <AdminPickerField
      label="What are you managing?"
      options={[
        { key: TRANSPORT_HALVES.BUSES, label: 'Buses' },
        { key: TRANSPORT_HALVES.DRIVERS, label: 'Drivers' },
      ]}
      selectedKey={visibleHalf}
      onSelect={switchHalf}
    />
  );

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading transport data..." />
      </ScreenContainer>
    );
  }

  if (loadErrorMessage) {
    return (
      <ScreenContainer header={screenHeader}>
        <ErrorState message={loadErrorMessage} onRetry={reload} />
      </ScreenContainer>
    );
  }

  const busRows = collection?.buses || [];
  const driverRows = collection?.drivers || [];
  const hasRows = isShowingBuses ? busRows.length > 0 : driverRows.length > 0;

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      {halfPicker}

      <AppButton
        label={isShowingBuses ? 'Register a bus' : 'Register a driver'}
        iconName="add-circle-outline"
        size="large"
        isFullWidth
        onPress={() =>
          router.push(isShowingBuses ? '/(admin)/bus-form' : '/(admin)/driver-form')
        }
      />

      <AppTextInput
        label="Search"
        placeholder={isShowingBuses ? 'Code, plate, name or model' : 'Licence number or NIC'}
        value={searchText}
        onChangeText={setSearchText}
        iconName="search-outline"
        autoCapitalize="none"
      />

      <FilterChipRow chips={filterChips} selectedKey={statusFilter} onSelect={setStatusFilter} />

      {!hasRows && (
        <EmptyState
          iconName={isShowingBuses ? 'bus-outline' : 'person-outline'}
          title={isShowingBuses ? 'No buses here' : 'No drivers here'}
          message="Nothing matches this filter. Register one, or clear the search."
        />
      )}

      {isShowingBuses &&
        busRows.map((fleetBus) => (
          <AdminRecordCard
            key={fleetBus.id}
            title={`${fleetBus.busCode} · ${fleetBus.plateNumber}`}
            subtitle={`${fleetBus.busName} · ${fleetBus.model}`}
            chips={[
              { key: 'status', label: fleetBus.status, tone: BUS_STATUS_TONES[fleetBus.status] },
              { key: 'seats', label: `${fleetBus.capacity} seats`, tone: 'neutral' },
            ]}
            detailLines={[
              {
                key: 'route',
                label: fleetBus.routeId
                  ? `Route ${fleetBus.routeId.routeNumber} · ${fleetBus.routeId.origin} to ${fleetBus.routeId.destination}`
                  : 'No route assigned',
              },
              { key: 'gps', label: `GPS device ${fleetBus.gpsDeviceId}` },
            ]}
            actions={[
              {
                key: 'edit',
                label: 'Edit',
                iconName: 'create-outline',
                onPress: () => router.push(`/(admin)/bus-form?busId=${fleetBus.id}`),
              },
              {
                key: 'delete',
                label: 'Delete',
                iconName: 'trash-outline',
                variant: 'error',
                onPress: () =>
                  setPendingDeletion({
                    kind: TRANSPORT_HALVES.BUSES,
                    id: fleetBus.id,
                    name: `${fleetBus.busCode} (${fleetBus.plateNumber})`,
                  }),
              },
            ]}
          />
        ))}

      {!isShowingBuses &&
        driverRows.map((driverRow) => {
          const { driver } = driverRow;
          return (
            <AdminRecordCard
              key={driver.id}
              title={driver.userId?.fullName || 'Driver'}
              subtitle={`${driver.userId?.email || ''} · ${driver.userId?.mobile || ''}`}
              chips={[
                {
                  key: 'duty',
                  label: DUTY_STATUS_LABELS[driver.dutyStatus] || driver.dutyStatus,
                  tone: DUTY_STATUS_TONES[driver.dutyStatus],
                },
                {
                  key: 'licence',
                  label: LICENSE_CLASS_LABELS[driver.licenseClass] || driver.licenseClass,
                  tone: 'neutral',
                },
              ]}
              detailLines={[
                { key: 'licenceNumber', label: `Licence ${driver.licenseNumber} · NIC ${driver.nic}` },
                {
                  key: 'bus',
                  label: driverRow.bus
                    ? `Drives ${driverRow.bus.busCode} (${driverRow.bus.plateNumber})`
                    : 'No bus assigned',
                },
                {
                  key: 'delays',
                  label: `${driverRow.delayReportCount} delay reports filed`,
                },
              ]}
              actions={[
                {
                  key: 'edit',
                  label: 'Edit',
                  iconName: 'create-outline',
                  onPress: () => router.push(`/(admin)/driver-form?driverId=${driver.id}`),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  iconName: 'trash-outline',
                  variant: 'error',
                  onPress: () =>
                    setPendingDeletion({
                      kind: TRANSPORT_HALVES.DRIVERS,
                      id: driver.id,
                      name: driver.userId?.fullName || 'this driver',
                    }),
                },
              ]}
            />
          );
        })}

      <ConfirmDialog
        isVisible={Boolean(pendingDeletion)}
        title={
          pendingDeletion?.kind === TRANSPORT_HALVES.DRIVERS ? 'Delete this driver?' : 'Delete this bus?'
        }
        message={
          pendingDeletion?.kind === TRANSPORT_HALVES.DRIVERS
            ? `${pendingDeletion?.name} and the account behind it will be removed, along with their delay reports. Their bus goes back to the pool. Trips they have already run are kept. This cannot be undone.`
            : `${pendingDeletion?.name} will be removed from the fleet. This cannot be undone.`
        }
        confirmLabel={ADMIN_MESSAGES.deleteConfirmLabel}
        isDestructive
        isConfirming={isDeleting}
        onConfirm={confirmDeletion}
        onCancel={() => setPendingDeletion(null)}
      />
    </ScreenContainer>
  );
}
