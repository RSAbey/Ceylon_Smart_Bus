// Admin route management on mobile: every route with its stop count and how it has been running,
// and the full set of changes an administrator can make to one.
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
import AdminRecordCard from '../components/AdminRecordCard';
import {
  ADMIN_MESSAGES,
  ROUTE_STATUSES,
  ROUTE_STATUS_LABELS,
  ROUTE_STATUS_TONES,
} from '../constants';
import { deleteRoute, fetchRouteTable } from '../services/adminRouteApi';

const ALL_STATUSES = 'all';
const CURRENCY_PREFIX = 'Rs.';

/**
 * Admin route list.
 * @returns {import('react').JSX.Element} The screen.
 */
export default function AdminRoutesScreen() {
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToast();
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [searchText, setSearchText] = useState('');
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRoutes = useCallback(
    () =>
      fetchRouteTable({
        status: statusFilter === ALL_STATUSES ? undefined : statusFilter,
        searchText: searchText.trim() || undefined,
      }),
    [statusFilter, searchText]
  );
  const { collection, isLoading, loadErrorMessage, reload } = useAdminCollection(loadRoutes);

  const filterChips = useMemo(() => {
    const statusCounts = collection?.statusCounts || {};
    return [
      { key: ALL_STATUSES, label: ADMIN_MESSAGES.allFilterLabel, count: statusCounts.total },
      { key: ROUTE_STATUSES.ACTIVE, label: 'Active', count: statusCounts.active },
      { key: ROUTE_STATUSES.DRAFT, label: 'Draft', count: statusCounts.draft },
      { key: ROUTE_STATUSES.SUSPENDED, label: 'Suspended', count: statusCounts.suspended },
    ];
  }, [collection]);

  const confirmDeletion = async () => {
    const routeToDelete = pendingDeletion;
    setIsDeleting(true);
    try {
      await deleteRoute(routeToDelete.route.id);
      setPendingDeletion(null);
      showSuccessToast('Route deleted, with its stops.');
      reload();
    } catch (deleteError) {
      setPendingDeletion(null);
      showErrorToast(deleteError.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const screenHeader = <AppHeader title="Routes" />;

  if (isLoading) {
    return (
      <ScreenContainer header={screenHeader}>
        <LoadingState message="Loading routes..." />
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

  const routeRows = collection?.routes || [];

  return (
    <ScreenContainer header={screenHeader} isScrollable>
      <AppButton
        label="New route"
        iconName="add-circle-outline"
        size="large"
        isFullWidth
        onPress={() => router.push('/(admin)/route-form')}
      />

      <AppTextInput
        label="Search"
        placeholder="Number, name, origin or destination"
        value={searchText}
        onChangeText={setSearchText}
        iconName="search-outline"
        autoCapitalize="none"
      />

      <FilterChipRow chips={filterChips} selectedKey={statusFilter} onSelect={setStatusFilter} />

      {routeRows.length === 0 ? (
        <EmptyState
          iconName="git-branch-outline"
          title="No routes here"
          message="No route matches this filter. Add one, or clear the search."
        />
      ) : (
        routeRows.map((routeRow) => {
          const { route } = routeRow;
          return (
            <AdminRecordCard
              key={route.id}
              title={`${route.routeNumber} · ${route.routeName}`}
              subtitle={`${route.origin} to ${route.destination}`}
              chips={[
                {
                  key: 'status',
                  label: ROUTE_STATUS_LABELS[route.status] || route.status,
                  tone: ROUTE_STATUS_TONES[route.status],
                },
                {
                  key: 'running',
                  label: `${routeRow.runningTripCount} running now`,
                  tone: routeRow.runningTripCount > 0 ? 'information' : 'neutral',
                },
              ]}
              detailLines={[
                {
                  key: 'fare',
                  label: `${routeRow.stopCount} stops · base fare ${CURRENCY_PREFIX} ${route.baseFare}`,
                },
                {
                  key: 'service',
                  label: `Service ${route.serviceStartTime} to ${route.serviceEndTime}`,
                },
                {
                  key: 'delays',
                  label: `${routeRow.delayReportCount} delays reported in ${routeRow.delayWindowDays} days · ${routeRow.averageDelayMinutes} min average`,
                },
              ]}
              actions={[
                {
                  key: 'edit',
                  label: 'Edit',
                  iconName: 'create-outline',
                  onPress: () => router.push(`/(admin)/route-form?routeId=${route.id}`),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  iconName: 'trash-outline',
                  variant: 'error',
                  onPress: () => setPendingDeletion(routeRow),
                },
              ]}
            />
          );
        })
      )}

      <ConfirmDialog
        isVisible={Boolean(pendingDeletion)}
        title="Delete this route?"
        message={
          pendingDeletion
            ? `Route ${pendingDeletion.route.routeNumber} and its ${pendingDeletion.stopCount} stops will be removed, and any bus assigned to it will be unassigned. This cannot be undone.`
            : ''
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
