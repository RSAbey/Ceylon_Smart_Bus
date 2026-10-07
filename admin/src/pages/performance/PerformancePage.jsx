// Performance page (Member 04, FR-10): how the service has run over the last week.
// The charts are plain CSS bars rather than a charting library, so no extra dependency is added
// for four simple series and the markup stays readable in a viva.
import { useCallback, useEffect, useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import { fetchPerformance } from '../overview/dashboardApi';

const CURRENCY_PREFIX = 'Rs.';
const PERCENT_SCALE = 100;

/**
 * One bar chart drawn from a daily series.
 * @param {object} props - Component props.
 * @param {string} props.title - What the chart shows.
 * @param {object[]} props.dailySeries - Entries of { day, total }.
 * @param {string} [props.valuePrefix] - Prefix for the value, for example "Rs.".
 * @returns {import('react').JSX.Element} The chart.
 */
function DailyBarChart({ title, dailySeries, valuePrefix = '' }) {
  const highestTotal = Math.max(...dailySeries.map((dailyEntry) => dailyEntry.total), 1);

  return (
    <section className="card" aria-label={title}>
      <h2 className="text-heading-3">{title}</h2>
      <ol className="bar-chart">
        {dailySeries.map((dailyEntry) => {
          const barHeightPercent = Math.round((dailyEntry.total / highestTotal) * PERCENT_SCALE);
          const dayLabel = new Date(dailyEntry.day).toLocaleDateString(undefined, {
            weekday: 'short',
          });
          return (
            <li key={dailyEntry.day} className="bar-chart__column">
              {/* The figure is written above each bar, so the chart is readable without colour. */}
              <span className="bar-chart__value text-caption">
                {valuePrefix}
                {dailyEntry.total}
              </span>
              <div
                className="bar-chart__bar"
                style={{ height: `${barHeightPercent}%` }}
                role="img"
                aria-label={`${dayLabel}: ${valuePrefix}${dailyEntry.total}`}
              />
              <span className="bar-chart__label text-caption text-muted">{dayLabel}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

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
