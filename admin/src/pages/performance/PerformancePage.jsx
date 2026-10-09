// Performance page (Member 04, FR-10): how the service has run over the last week.
// The charts come from the shared DailyBarChart, which Tickets & Finance draws its trend with too.
import { useCallback, useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import DailyBarChart from '../../components/ui/DailyBarChart';
import { fetchPerformance } from '../overview/dashboardApi';

const CURRENCY_PREFIX = 'Rs.';

/**
 * Admin performance reporting.
 * @returns {import('react').JSX.Element} The page.
 */
export default function PerformancePage() {
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [reloadCounter, setReloadCounter] = useState(0);
  const loadPerformance = useCallback(
    () => setReloadCounter((previousCount) => previousCount + 1),
    []
  );

  useEffect(() => {
    let isEffectActive = true;
    fetchPerformance()
      .then((loadedPerformance) => {
        if (isEffectActive) {
          setPerformance(loadedPerformance);
          setLoadErrorMessage('');
        }
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
  }, [reloadCounter]);

  const pageHeader = (
    <PageHeader
      title="Performance"
      subtitle="Tickets, takings and punctuality over the last week"
      actions={<Button label="Refresh" variant="outline" onClick={loadPerformance} />}
    />
  );

  if (loadErrorMessage) {
    return (
      <>
        {pageHeader}
        <ErrorState message={loadErrorMessage} onRetry={loadPerformance} />
      </>
    );
  }
  if (isLoading) {
    return (
      <>
        {pageHeader}
        <p className="text-body-medium text-muted" aria-busy="true">
          Loading performance figures...
        </p>
      </>
    );
  }

  const routeColumns = [
    {
      key: 'routeNumber',
      header: 'Route',
      renderCell: (routeRow) => (
        <>
          <div>Route {routeRow.routeNumber}</div>
          <div className="text-caption text-muted">
            {routeRow.origin} to {routeRow.destination}
          </div>
        </>
      ),
    },
    { key: 'ticketCount', header: 'Tickets' },
    {
      key: 'totalFare',
      header: 'Fares',
      renderCell: (routeRow) => `${CURRENCY_PREFIX} ${routeRow.totalFare}`,
    },
  ];

  return (
    <>
      {pageHeader}

      <section className="stat-grid" aria-label="Headline figures">
        <StatCard
          label="On-time trips"
          statValue={`${performance.punctuality.onTimePercentage}%`}
          icon={Clock}
          helperText={`${performance.punctuality.onTimeTripCount} of ${performance.punctuality.tripCount} trips in the last ${performance.windowDays} days`}
        />
        <StatCard
          label="Delayed trips"
          statValue={performance.punctuality.delayedTripCount}
          icon={TrendingUp}
          helperText="Trips with at least one delay report"
        />
      </section>

      <DailyBarChart title="Tickets sold per day" dailySeries={performance.ticketsPerDay} />
      <DailyBarChart
        title="Fares collected per day"
        dailySeries={performance.takingsPerDay}
        valuePrefix={`${CURRENCY_PREFIX} `}
      />
      <DailyBarChart title="Delays reported per day" dailySeries={performance.delaysPerDay} />

      <DataTable
        caption="The routes selling the most tickets"
        columns={routeColumns}
        rows={performance.busiestRoutes}
        getRowKey={(routeRow) => routeRow.routeId}
        emptyTitle="No tickets sold yet"
        emptyMessage="Once passengers start booking, the busiest routes appear here."
      />
    </>
  );
}
