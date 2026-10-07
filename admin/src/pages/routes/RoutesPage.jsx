// Routes page (Member 02, NFR-10): routes, their stops, schedule and fares, all editable without
// a code change. A route only reaches passengers once it is Active.
import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import RouteFormModal from './RouteFormModal';
import {
  createRoute,
  deleteRoute,
  fetchRouteDetails,
  fetchRouteTable,
  updateRoute,
} from './routeApi';
import {
  BUSY_DELAY_THRESHOLD,
  ROUTE_MESSAGES,
  ROUTE_STATUSES,
  ROUTE_STATUS_BADGES,
  ROUTE_STATUS_FILTERS,
} from './routeConstants';

/**
 * Admin route management.
 * @returns {import('react').JSX.Element} The page.
 */
export default function RoutesPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [routeRows, setRouteRows] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [delaySummary, setDelaySummary] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [routePendingDeletion, setRoutePendingDeletion] = useState(null);

  const [reloadCounter, setReloadCounter] = useState(0);
  const reloadRoutes = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchRouteTable({ status: statusFilter, searchText })
      .then((routeTable) => {
        if (!isEffectActive) return;
        setRouteRows(routeTable.routes);
        setStatusCounts(routeTable.statusCounts);
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
  }, [statusFilter, searchText, reloadCounter]);

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

  const openAddForm = () => {
    setRouteDetails(null);
    setDelaySummary(null);
    setServerFieldErrors({});
    setIsFormOpen(true);
  };

  /**
   * Loads the route and its stops before opening the dialog, so the stop editor starts filled.
   * @param {object} routeRow - Row the admin clicked Edit on.
   * @returns {Promise<void>} Resolves once the dialog is ready.
   */
  async function openEditForm(routeRow) {
    try {
      const loadedDetails = await fetchRouteDetails(routeRow.route.id);
      setRouteDetails(loadedDetails);
      setDelaySummary({
        delayReportCount: routeRow.delayReportCount,
        averageDelayMinutes: routeRow.averageDelayMinutes,
        delayWindowDays: routeRow.delayWindowDays,
      });
      setServerFieldErrors({});
      setIsFormOpen(true);
    } catch (loadError) {
      showErrorToast(loadError.message);
    }
  }

  const saveRoute = async (routeForm) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      if (routeDetails) {
        await updateRoute(routeDetails.route.id, routeForm);
        showSuccessToast('Route updated.');
      } else {
        await createRoute(routeForm);
        showSuccessToast('Route saved.');
      }
      setIsFormOpen(false);
      reloadRoutes();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const suspendRoute = async () => {
    setIsSaving(true);
    try {
      await updateRoute(routeDetails.route.id, { status: ROUTE_STATUSES.SUSPENDED });
      showSuccessToast('Route suspended. Passengers can no longer search it.');
      setIsFormOpen(false);
      reloadRoutes();
    } catch (suspendError) {
      showErrorToast(suspendError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteRoute = async () => {
    setIsSaving(true);
    try {
      await deleteRoute(routePendingDeletion.route.id);
      showSuccessToast('Route deleted.');
      setRoutePendingDeletion(null);
      reloadRoutes();
    } catch (deleteError) {
      showErrorToast(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const routeColumns = [
    {
      key: 'routeNumber',
      header: 'Route',
      renderCell: (routeRow) => <StatusBadge status="onTime" label={routeRow.route.routeNumber} />,
    },
    {
      key: 'path',
      header: 'Path',
      renderCell: (routeRow) => (
        <>
          <div>
            {routeRow.route.origin} &rarr; {routeRow.route.destination}
          </div>
          <div className="text-caption text-muted">{routeRow.route.routeName}</div>
        </>
      ),
    },
    { key: 'stopCount', header: 'Stops' },
    {
      key: 'schedule',
      header: 'Schedule',
      renderCell: (routeRow) =>
        routeRow.route.serviceStartTime && routeRow.route.serviceEndTime
          ? `${routeRow.route.serviceStartTime} – ${routeRow.route.serviceEndTime}`
          : 'Not set',
    },
    {
      key: 'delays',
      header: `Delays (${routeRows[0]?.delayWindowDays || 7}d)`,
      renderCell: (routeRow) => {
        const isBusy = routeRow.delayReportCount >= BUSY_DELAY_THRESHOLD;
        const reportLabel = `${routeRow.delayReportCount} ${
          routeRow.delayReportCount === 1 ? 'report' : 'reports'
        }`;
        // A busy route is named as busy, not just coloured (NFR-09).
        return isBusy ? (
          <span className="cell-emphasis">
            {reportLabel} · avg {routeRow.averageDelayMinutes} min
          </span>
        ) : (
          reportLabel
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (routeRow) => {
        const routeBadge = ROUTE_STATUS_BADGES[routeRow.route.status];
        return <StatusBadge status={routeBadge.status} label={routeBadge.label} />;
      },
    },
  ];

  const rowActions = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: openEditForm,
      buildAriaLabel: (routeRow) => `Edit route ${routeRow.route.routeNumber}`,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'text',
      onClick: (routeRow) => setRoutePendingDeletion(routeRow),
      buildAriaLabel: (routeRow) => `Delete route ${routeRow.route.routeNumber}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Routes"
        subtitle="Configure routes, stops and schedules"
        actions={<Button label="Add route" icon={Plus} onClick={openAddForm} />}
      />

      <div className="filter-row">
        <div className="button-row">
          {ROUTE_STATUS_FILTERS.map((routeFilter) => {
            const chipCount =
              routeFilter.status === '' ? statusCounts.total : statusCounts[routeFilter.status];
            return (
              <Button
                key={routeFilter.label}
                label={
                  chipCount === undefined
                    ? routeFilter.label
                    : `${routeFilter.label} (${chipCount})`
                }
                variant={routeFilter.status === statusFilter ? 'primary' : 'outline'}
                onClick={() => changeFilter(() => setStatusFilter(routeFilter.status))}
              />
            );
          })}
        </div>
        <input
          type="search"
          className="form-field__input filter-row__search"
          placeholder="Search routes..."
          aria-label="Search routes"
          value={searchText}
          onChange={(changeEvent) => changeFilter(() => setSearchText(changeEvent.target.value))}
        />
      </div>

      <DataTable
        caption="Routes with their stops, schedule, recent delays and status"
        columns={routeColumns}
        rows={routeRows}
        getRowKey={(routeRow) => routeRow.route.id}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={reloadRoutes}
        emptyTitle="No routes match"
        emptyMessage="Add a route, or clear the filter to see them all."
        rowActions={rowActions}
      />

      <RouteFormModal
        key={`route-${isFormOpen}-${routeDetails?.route?.id || 'new'}`}
        isOpen={isFormOpen}
        routeDetails={routeDetails}
        delaySummary={delaySummary}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveRoute}
        onSuspend={suspendRoute}
        onClose={() => setIsFormOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(routePendingDeletion)}
        title="Delete this route?"
        message={`This removes route ${routePendingDeletion?.route?.routeNumber} and its ${routePendingDeletion?.stopCount || 0} stops, and unassigns any bus serving it. ${ROUTE_MESSAGES.suspend} instead if you may need it again.`}
        confirmLabel="Delete route"
        isDestructive
        isConfirming={isSaving}
        onConfirm={confirmDeleteRoute}
        onCancel={() => setRoutePendingDeletion(null)}
      />
    </>
  );
}
