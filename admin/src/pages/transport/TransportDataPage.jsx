// Transport Data: the fleet and the people who drive it, on one page with two tabs.
// Buses and drivers are managed together because almost every change touches both — assigning a
// bus, taking one off the road, putting a driver on leave.
import { useCallback, useEffect, useState } from 'react';
import { Bus, IdCard, Pencil, Trash2, UserPlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import BusFormModal from './BusFormModal';
import DriverFormModal from './DriverFormModal';
import AssignBusModal from './AssignBusModal';
import {
  assignBusToDriver,
  createBus,
  createDriver,
  deleteBus,
  deleteDriver,
  fetchAssignableBuses,
  fetchBuses,
  fetchDrivers,
  fetchRoutesForPicker,
  updateBus,
  updateDriver,
} from './transportApi';
import {
  BUS_STATUSES,
  BUS_STATUS_BADGES,
  BUS_STATUS_FILTERS,
  DRIVER_DUTY_STATUSES,
  DUTY_STATUS_BADGES,
  DUTY_STATUS_FILTERS,
  TRANSPORT_TABS,
  describeLicenseClass,
} from './transportConstants';

/** A position posted within this many seconds counts as a live feed on the edit dialog. */
const LIVE_FEED_WINDOW_SECONDS = 60;

/**
 * Whether a bus is posting positions right now, read from the trip it is on.
 * @param {object} busRow - A bus from the API.
 * @returns {boolean} True when the feed is fresh.
 */
function isBroadcastingNow(busRow) {
  if (!busRow?.lastLocationAt) return false;
  const ageSeconds = (Date.now() - new Date(busRow.lastLocationAt).getTime()) / 1000;
  return ageSeconds <= LIVE_FEED_WINDOW_SECONDS;
}

/**
 * Admin fleet and roster management.
 * @returns {import('react').JSX.Element} The page.
 */
export default function TransportDataPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [activeTab, setActiveTab] = useState(TRANSPORT_TABS[0].key);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routeOptions, setRouteOptions] = useState([]);
  const [assignableBuses, setAssignableBuses] = useState([]);
  const [busStatusFilter, setBusStatusFilter] = useState('');
  const [dutyStatusFilter, setDutyStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [busBeingEdited, setBusBeingEdited] = useState(null);
  const [isBusFormOpen, setIsBusFormOpen] = useState(false);
  const [driverBeingEdited, setDriverBeingEdited] = useState(null);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [driverBeingAssigned, setDriverBeingAssigned] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [rowPendingDeletion, setRowPendingDeletion] = useState(null);

  const [reloadCounter, setReloadCounter] = useState(0);
  const reloadTransportData = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([
      fetchBuses({ searchText, status: busStatusFilter }),
      fetchDrivers({ searchText, dutyStatus: dutyStatusFilter }),
      fetchRoutesForPicker(),
      fetchAssignableBuses(),
    ])
      .then(([busPage, driverPage, loadedRoutes, loadedAssignable]) => {
        if (!isEffectActive) return;
        setBuses(busPage.buses);
        setDrivers(driverPage.drivers);
        setRouteOptions(loadedRoutes);
        setAssignableBuses(loadedAssignable);
        setLoadErrorMessage('');
      })
      .catch((loadError) => {
        if (isEffectActive) setLoadErrorMessage(loadError.message);
      })
      .finally(() => {
        if (isEffectActive) setIsLoading(false);
      });
    // Ignore a reply that arrives after the page has moved on.
    return () => {
      isEffectActive = false;
    };
  }, [searchText, busStatusFilter, dutyStatusFilter, reloadCounter]);

  /**
   * Switches filter. The spinner is set here rather than in an effect, because React 19 treats a
   * synchronous setState inside an effect as a cascading render.
   * @param {Function} applyFilter - Sets the chosen filter state.
   * @returns {void}
   */
  function changeFilter(applyFilter) {
    setIsLoading(true);
    applyFilter();
  }

  const saveBus = async (busForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (busBeingEdited) {
        await updateBus(busBeingEdited.id, busForm);
        showSuccessToast('Bus updated.');
      } else {
        await createBus(busForm);
        showSuccessToast('Bus registered.');
      }
      setIsBusFormOpen(false);
      reloadTransportData();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const retireBus = async () => {
    setIsSaving(true);
    try {
      await updateBus(busBeingEdited.id, { status: BUS_STATUSES.RETIRED });
      showSuccessToast('Bus retired and taken off its route.');
      setIsBusFormOpen(false);
      reloadTransportData();
    } catch (retireError) {
      showErrorToast(retireError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveDriver = async (driverForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (driverBeingEdited) {
        await updateDriver(driverBeingEdited.driver.id, driverForm);
        showSuccessToast('Driver updated.');
      } else {
        await createDriver(driverForm);
        showSuccessToast('Driver registered. Give them the password so they can sign in.');
      }
      setIsDriverFormOpen(false);
      reloadTransportData();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const suspendDriver = async () => {
    setIsSaving(true);
    try {
      await updateDriver(driverBeingEdited.driver.id, {
        dutyStatus: DRIVER_DUTY_STATUSES.SUSPENDED,
      });
      showSuccessToast('Driver suspended and signed out of the app.');
      setIsDriverFormOpen(false);
      reloadTransportData();
    } catch (suspendError) {
      showErrorToast(suspendError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAssignBus = async (busId) => {
    setIsSaving(true);
    try {
      await assignBusToDriver(driverBeingAssigned.driver.id, busId);
      showSuccessToast(busId ? 'Bus assigned.' : 'Bus assignment cleared.');
      setDriverBeingAssigned(null);
      reloadTransportData();
    } catch (assignError) {
      showErrorToast(assignError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletion = async () => {
    setIsSaving(true);
    try {
      if (rowPendingDeletion.kind === 'bus') {
        await deleteBus(rowPendingDeletion.row.id);
        showSuccessToast('Bus deleted.');
      } else {
        await deleteDriver(rowPendingDeletion.row.driver.id);
        showSuccessToast('Driver deleted.');
      }
      setRowPendingDeletion(null);
      reloadTransportData();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const busColumns = [
    {
      key: 'busCode',
      header: 'Bus',
      renderCell: (busRow) => (
        <>
          <div>{busRow.busCode}</div>
          <div className="text-caption text-muted">{busRow.plateNumber}</div>
        </>
      ),
    },
    { key: 'busName', header: 'Name' },
    { key: 'model', header: 'Model', renderCell: (busRow) => busRow.model || 'Not recorded' },
    { key: 'capacity', header: 'Seats' },
    {
      key: 'route',
      header: 'Assigned route',
      renderCell: (busRow) =>
        busRow.routeId ? `Route ${busRow.routeId.routeNumber}` : 'Unassigned',
    },
    {
      key: 'driver',
      header: 'Driver',
      renderCell: (busRow) => busRow.driverId?.userId?.fullName || 'Unassigned',
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (busRow) => {
        const busBadge = BUS_STATUS_BADGES[busRow.status];
        return <StatusBadge status={busBadge.status} label={busBadge.label} />;
      },
    },
  ];

  const driverColumns = [
    {
      key: 'driver',
      header: 'Driver',
      renderCell: (driverRow) => (
        <>
          <div>{driverRow.driver.userId?.fullName}</div>
          <div className="text-caption text-muted">{driverRow.driver.userId?.mobile}</div>
        </>
      ),
    },
    {
      key: 'licenseNumber',
      header: 'Licence',
      renderCell: (driverRow) => (
        <>
          <div>{driverRow.driver.licenseNumber}</div>
          <div className="text-caption text-muted">
            {describeLicenseClass(driverRow.driver.licenseClass)}
          </div>
        </>
      ),
    },
    {
      key: 'assignment',
      header: 'Assigned bus / route',
      renderCell: (driverRow) =>
        driverRow.bus
          ? `${driverRow.bus.busCode}${driverRow.route ? ` / Route ${driverRow.route.routeNumber}` : ''}`
          : 'Unassigned',
    },
    { key: 'delayReportCount', header: 'Delay reports' },
    {
      key: 'dutyStatus',
      header: 'Status',
      renderCell: (driverRow) => {
        const dutyBadge = DUTY_STATUS_BADGES[driverRow.driver.dutyStatus];
        return <StatusBadge status={dutyBadge.status} label={dutyBadge.label} />;
      },
    },
  ];

  const busRowActions = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (busRow) => {
        setBusBeingEdited(busRow);
        setServerFieldErrors({});
        setIsBusFormOpen(true);
      },
      buildAriaLabel: (busRow) => `Edit ${busRow.busCode}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      onClick: (busRow) => setRowPendingDeletion({ kind: 'bus', row: busRow }),
      buildAriaLabel: (busRow) => `Delete ${busRow.busCode}`,
    },
  ];

  const driverRowActions = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (driverRow) => {
        setDriverBeingEdited(driverRow);
        setServerFieldErrors({});
        setIsDriverFormOpen(true);
      },
      buildAriaLabel: (driverRow) => `Edit ${driverRow.driver.userId?.fullName}`,
    },
    {
      label: 'Assign bus',
      icon: Bus,
      onClick: (driverRow) => setDriverBeingAssigned(driverRow),
      buildAriaLabel: (driverRow) => `Assign a bus to ${driverRow.driver.userId?.fullName}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      onClick: (driverRow) => setRowPendingDeletion({ kind: 'driver', row: driverRow }),
      buildAriaLabel: (driverRow) => `Delete ${driverRow.driver.userId?.fullName}`,
    },
  ];

  const isBusesTab = activeTab === 'buses';
  const statusFilters = isBusesTab ? BUS_STATUS_FILTERS : DUTY_STATUS_FILTERS;
  const activeStatusFilter = isBusesTab ? busStatusFilter : dutyStatusFilter;

  return (
    <>
      <PageHeader
        title="Transport Data"
        subtitle="Manage buses, drivers and reference data across the fleet"
        actions={
          isBusesTab ? (
            <Button
              label="Register bus"
              icon={Bus}
              onClick={() => {
                setBusBeingEdited(null);
                setServerFieldErrors({});
                setIsBusFormOpen(true);
              }}
            />
          ) : (
            <Button
              label="Register driver"
              icon={UserPlus}
              onClick={() => {
                setDriverBeingEdited(null);
                setServerFieldErrors({});
                setIsDriverFormOpen(true);
              }}
            />
          )
        }
      />

      <div className="tab-row" role="tablist" aria-label="Transport data sections">
        {TRANSPORT_TABS.map((transportTab) => (
          <Button
            key={transportTab.key}
            label={transportTab.label}
            icon={transportTab.key === 'buses' ? Bus : IdCard}
            variant={transportTab.key === activeTab ? 'primary' : 'outline'}
            onClick={() => setActiveTab(transportTab.key)}
          />
        ))}
      </div>

      <div className="filter-row">
        <div className="button-row">
          {statusFilters.map((statusFilter) => {
            const filterValue = isBusesTab ? statusFilter.status : statusFilter.dutyStatus;
            return (
              <Button
                key={statusFilter.label}
                label={statusFilter.label}
                variant={filterValue === activeStatusFilter ? 'primary' : 'outline'}
                onClick={() =>
                  changeFilter(() =>
                    isBusesTab ? setBusStatusFilter(filterValue) : setDutyStatusFilter(filterValue)
                  )
                }
              />
            );
          })}
        </div>
        <input
          type="search"
          className="form-field__input filter-row__search"
          placeholder={isBusesTab ? 'Search buses...' : 'Search drivers...'}
          aria-label={isBusesTab ? 'Search buses' : 'Search drivers'}
          value={searchText}
          onChange={(changeEvent) => changeFilter(() => setSearchText(changeEvent.target.value))}
        />
      </div>

      {isBusesTab ? (
        <DataTable
          caption="Registered buses with their model, route and status"
          columns={busColumns}
          rows={buses}
          isLoading={isLoading}
          errorMessage={loadErrorMessage}
          onRetry={reloadTransportData}
          emptyTitle="No buses match"
          emptyMessage="Register a bus, or clear the filter to see the whole fleet."
          rowActions={busRowActions}
        />
      ) : (
        <DataTable
          caption="Registered drivers with their licence, assigned bus and duty status"
          columns={driverColumns}
          rows={drivers}
          getRowKey={(driverRow) => driverRow.driver.id}
          isLoading={isLoading}
          errorMessage={loadErrorMessage}
          onRetry={reloadTransportData}
          emptyTitle="No drivers match"
          emptyMessage="Register a driver, or clear the filter to see the whole roster."
          rowActions={driverRowActions}
        />
      )}

      <BusFormModal
        key={`bus-${isBusFormOpen}-${busBeingEdited?.id || 'new'}`}
        isOpen={isBusFormOpen}
        busBeingEdited={busBeingEdited}
        routeOptions={routeOptions}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        isBroadcasting={isBroadcastingNow(busBeingEdited)}
        onSubmit={saveBus}
        onRetire={retireBus}
        onClose={() => setIsBusFormOpen(false)}
      />

      <DriverFormModal
        key={`driver-${isDriverFormOpen}-${driverBeingEdited?.driver?.id || 'new'}`}
        isOpen={isDriverFormOpen}
        driverBeingEdited={driverBeingEdited}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveDriver}
        onSuspend={suspendDriver}
        onClose={() => setIsDriverFormOpen(false)}
      />

      <AssignBusModal
        key={`assign-${driverBeingAssigned?.driver?.id || 'none'}`}
        isOpen={Boolean(driverBeingAssigned)}
        driverRow={driverBeingAssigned}
        assignableBuses={assignableBuses}
        isSaving={isSaving}
        onSubmit={confirmAssignBus}
        onClose={() => setDriverBeingAssigned(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(rowPendingDeletion)}
        title={rowPendingDeletion?.kind === 'bus' ? 'Delete this bus?' : 'Delete this driver?'}
        message={
          rowPendingDeletion?.kind === 'bus'
            ? 'This permanently removes the bus from the fleet. A bus on a trip cannot be deleted.'
            : 'This permanently removes the driver and the account they sign in with. This cannot be undone.'
        }
        confirmLabel="Delete"
        isDestructive
        isConfirming={isSaving}
        onConfirm={confirmDeletion}
        onCancel={() => setRowPendingDeletion(null)}
      />
    </>
  );
}
