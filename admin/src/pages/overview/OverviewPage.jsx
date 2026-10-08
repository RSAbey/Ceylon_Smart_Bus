// Dashboard (Member 04, FR-10): what an operations desk needs on one screen — how the fleet is
// running now, how punctual the week has been, which delays are open, and where the buses are.
// Every number is counted from the database; nothing here is an estimate.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DailyBarChart from '../../components/ui/DailyBarChart';
import LiveMap from '../../components/ui/LiveMap';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import { fetchDelayReports, fetchOverview, fetchPerformance } from './dashboardApi';
// The map shows the same live fleet as the Live Fleet page, so it reads from the same endpoint.
import { fetchLiveFleet } from '../fleet/fleetApi';
import { MAP_LEGEND, describeLiveStatus } from '../fleet/fleetConstants';

const CURRENCY_PREFIX = 'Rs.';
const LOADING_FIGURE = '--';
/** How many open delays the summary panel lists before it sends you to the Delays page. */
const DELAY_SUMMARY_LIMIT = 4;
/** Plain wording for a delay reason, matching the server's labels. */
const DELAY_REASON_LABELS = Object.freeze({
  heavy_traffic: 'Heavy traffic',
  road_closure: 'Road closure',
  mechanical: 'Mechanical problem',
  weather: 'Bad weather',
  other: 'Other',
});

/**
 * Admin landing page.
 * @returns {import('react').JSX.Element} The page.
 */
export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [openDelays, setOpenDelays] = useState([]);
  const [liveFleet, setLiveFleet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [lastRefreshedLabel, setLastRefreshedLabel] = useState('');

  const [reloadCounter, setReloadCounter] = useState(0);
  const loadDashboard = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    Promise.all([
      fetchOverview(),
      fetchPerformance(),
      fetchDelayReports({ status: 'active' }),
      fetchLiveFleet(),
    ])
      .then(([loadedOverview, loadedPerformance, loadedDelays, loadedFleet]) => {
        if (!isEffectActive) return;
        setOverview(loadedOverview);
        setPerformance(loadedPerformance);
        setOpenDelays(loadedDelays);
        setLiveFleet(loadedFleet);
        setLastRefreshedLabel(new Date().toLocaleTimeString());
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
  }, [reloadCounter]);

  const pageHeader = (
    <PageHeader
      title="Dashboard"
      subtitle="Transport operations overview"
      actions={<Button label="Refresh" variant="outline" onClick={loadDashboard} />}
    />
  );

  if (loadErrorMessage) {
    return (
      <>
        {pageHeader}
        <ErrorState message={loadErrorMessage} onRetry={loadDashboard} />
      </>
    );
  }

  const statCards = [
    {
      key: 'buses',
      label: 'Buses on the road',
      statValue: isLoading ? LOADING_FIGURE : overview.ongoingTripCount,
      helperText: 'Trips running right now',
      accent: 'primary',
    },
    {
      key: 'delays',
      label: 'Delayed',
      statValue: isLoading ? LOADING_FIGURE : overview.activeDelayCount,
      helperText: 'Reported by drivers and not yet cleared',
      accent: 'warning',
    },
    {
      key: 'onTime',
      label: 'On time',
      statValue: isLoading ? LOADING_FIGURE : `${performance.punctuality.onTimePercentage}%`,
      helperText: isLoading
        ? undefined
        : `${performance.punctuality.onTimeTripCount} of ${performance.punctuality.tripCount} trips in the last ${performance.windowDays} days`,
      accent: 'success',
    },
    {
      key: 'routes',
      label: 'Routes and buses',
      statValue: isLoading ? LOADING_FIGURE : `${overview.routeCount} / ${overview.busCount}`,
      helperText: 'Routes served by registered buses',
      accent: 'primary',
    },
    {
      key: 'tickets',
      label: 'Tickets sold today',
      statValue: isLoading ? LOADING_FIGURE : overview.ticketsToday,
      helperText: 'Since midnight',
      accent: 'primary',
    },
    {
      key: 'takings',
      label: 'Collected today',
      statValue: isLoading ? LOADING_FIGURE : `${CURRENCY_PREFIX} ${overview.takingsToday}`,
      helperText: 'Paid fares only, refunds excluded',
      accent: 'success',
    },
  ];

  const plottedBuses = (liveFleet?.fleet || [])
    .filter((fleetRow) => fleetRow.position)
    .map((fleetRow) => ({
      tripId: fleetRow.tripId,
      label: fleetRow.bus?.busCode || 'Bus',
      caption: `route ${fleetRow.route?.routeNumber} · ${describeLiveStatus(fleetRow).label}`,
      liveStatus: fleetRow.liveStatus,
      position: fleetRow.position,
    }));
  const summarisedDelays = openDelays.slice(0, DELAY_SUMMARY_LIMIT);

  return (
    <>
      {pageHeader}

      <section className="stat-grid" aria-label="Key statistics" aria-busy={isLoading}>
        {statCards.map((statCard) => (
          <StatCard
            key={statCard.key}
            label={statCard.label}
            statValue={statCard.statValue}
            helperText={statCard.helperText}
            accent={statCard.accent}
          />
        ))}
      </section>

      {!isLoading && (
        <>
          <div className="dashboard-columns">
            <DailyBarChart
              title="Service performance"
              subtitle={`On-time percentage, last ${performance.windowDays} days`}
              dailySeries={performance.onTimePerDay}
              valueSuffix="%"
              targetValue={performance.onTimeTargetPercent}
            />

            <section className="card page-section" aria-label="Delay summary">
              <h2 className="text-heading3">Delay summary</h2>
              <p className="text-caption text-muted">
                Reported by drivers and still open. Every one of these is also added to the arrival
                time passengers see.
              </p>
              {summarisedDelays.length === 0 ? (
                <p className="text-body-medium text-muted">No delay is open right now.</p>
              ) : (
                <ul className="delay-summary">
                  {summarisedDelays.map((delayRow) => (
                    <li key={delayRow.delayReport.id} className="delay-summary__entry">
                      <span>
                        <strong>Route {delayRow.route?.routeNumber || 'unknown'}</strong>
                        <span className="text-caption text-muted">
                          {' '}
                          · {delayRow.bus?.plateNumber || 'bus not known'} ·{' '}
                          {delayRow.driverName || 'driver not recorded'}
                        </span>
                      </span>
                      <span className="button-row">
                        <span>{delayRow.delayReport.delayMinutes} min</span>
                        <StatusBadge
                          status="delayed"
                          label={
                            DELAY_REASON_LABELS[delayRow.delayReport.reason] ||
                            delayRow.delayReport.reason
                          }
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/delays">Open the delays page</Link>
            </section>
          </div>

          <section className="card page-section" aria-label="Live fleet map">
            <h2 className="text-heading3">Live fleet</h2>
            <p className="text-caption text-muted">
              {plottedBuses.length} {plottedBuses.length === 1 ? 'bus is' : 'buses are'} reporting a
              position · updated {lastRefreshedLabel}
            </p>
            <LiveMap buses={plottedBuses} routePaths={liveFleet?.routePaths || []} isCompact />
            <ul className="live-map__legend">
              {MAP_LEGEND.map((legendEntry) => (
                <li key={legendEntry.liveStatus} className="live-map__legend-entry">
                  <span
                    className={`live-map__swatch live-map__bus live-map__bus--${legendEntry.liveStatus}`}
                    aria-hidden="true"
                  />
                  {legendEntry.label}
                </li>
              ))}
            </ul>
            <Link to="/fleet">Open the live fleet page</Link>
          </section>

          {overview.openInquiryCount > 0 && (
            <p className="form-notice">
              <Link to="/inquiries">
                {overview.openInquiryCount} open{' '}
                {overview.openInquiryCount === 1 ? 'inquiry is' : 'inquiries are'} waiting for a
                reply
              </Link>
            </p>
          )}
        </>
      )}
    </>
  );
}
