// Live Fleet (Member 02, FR-02 / NFR-01): where every running bus is, how it is running, and the
// one thing an administrator can act on from here — a trip the driver app left open.
import { useEffect, useState } from 'react';
import { Bus, MapPin, Pause, Play, RefreshCw, Users } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import LiveMap from '../../components/ui/LiveMap';
import { endStrandedTrip, fetchLiveFleet } from './fleetApi';
import {
  FLEET_MESSAGES,
  MAP_LEGEND,
  FLEET_REFRESH_INTERVAL_MS,
  FLEET_STATUS_FILTERS,
  describeLiveStatus,
  describePingAge,
  describeSilence,
} from './fleetConstants';

const NO_FIGURE_YET = '—';

/**
 * Admin live fleet monitoring.
 * @returns {import('react').JSX.Element} The page.
 */
export default function LiveFleetPage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [fleet, setFleet] = useState([]);
  const [routePaths, setRoutePaths] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [liveStatusFilter, setLiveStatusFilter] = useState('');
  const [focusedTripId, setFocusedTripId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [lastRefreshedLabel, setLastRefreshedLabel] = useState('');
  const [isAutoRefreshOn, setIsAutoRefreshOn] = useState(true);
  const [tripPendingClose, setTripPendingClose] = useState(null);
  const [isClosingTrip, setIsClosingTrip] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isEffectActive = true;
    const loadFleet = () =>
      fetchLiveFleet()
        .then((liveFleet) => {
          if (!isEffectActive) return;
          setFleet(liveFleet.fleet);
          setRoutePaths(liveFleet.routePaths);
          setFleetSummary(liveFleet.summary);
          setLastRefreshedLabel(new Date().toLocaleTimeString());
          setLoadErrorMessage('');
        })
        .catch((loadError) => {
          if (isEffectActive) setLoadErrorMessage(loadError.message);
        })
        .finally(() => {
          if (isEffectActive) setIsLoading(false);
        });

    loadFleet();
    // Positions only mean anything while they are fresh, so the page keeps polling until the
    // administrator pauses it to read the table.
    const refreshTimer = isAutoRefreshOn ? setInterval(loadFleet, FLEET_REFRESH_INTERVAL_MS) : null;
    return () => {
      isEffectActive = false;
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [isAutoRefreshOn, reloadCounter]);

  const reloadFleet = () => setReloadCounter((previousCount) => previousCount + 1);

  const closeStrandedTrip = async () => {
    setIsClosingTrip(true);
    try {
      await endStrandedTrip(tripPendingClose.tripId);
      showSuccessToast(
        `Trip closed. ${tripPendingClose.bus?.busCode} is free to start its next run.`
      );
      setTripPendingClose(null);
      reloadFleet();
    } catch (closeError) {
      showErrorToast(closeError.message);
    } finally {
      setIsClosingTrip(false);
    }
  };

  const visibleFleet = liveStatusFilter
    ? fleet.filter((fleetRow) => fleetRow.liveStatus === liveStatusFilter)
    : fleet;
  const visibleRouteIds = new Set(
    visibleFleet.map((fleetRow) => fleetRow.route?.id).filter(Boolean)
  );
  const visibleRoutePaths = routePaths.filter((routePath) =>
    visibleRouteIds.has(routePath.routeId)
  );
  const strandedRows = fleet.filter((fleetRow) => fleetRow.isStranded);

  // Only a bus that has posted a position can be drawn; the rest are named under the map instead.
  const plottedBuses = visibleFleet
    .filter((fleetRow) => fleetRow.position)
    .map((fleetRow) => ({
      tripId: fleetRow.tripId,
      label: fleetRow.bus?.busCode || 'Bus',
      caption: `route ${fleetRow.route?.routeNumber} · ${describeLiveStatus(fleetRow).label}`,
      liveStatus: fleetRow.liveStatus,
      position: fleetRow.position,
    }));
  const unplottedCount = visibleFleet.length - plottedBuses.length;

  // Tickets are only mentioned when there are some, so the dialog says nothing about "0 tickets".
  const soldTicketCount = tripPendingClose?.passengerCount || 0;
  const closeTripMessage = tripPendingClose
    ? `Bus ${tripPendingClose.bus?.busCode} ${describeSilence(tripPendingClose.positionAgeSeconds)}. Closing the trip ends the record and lets the driver start their next run.` +
      (soldTicketCount > 0
        ? ` It does not refund the ${soldTicketCount} ${soldTicketCount === 1 ? 'ticket' : 'tickets'} sold for this trip.`
        : '')
    : '';

  const fleetColumns = [
    {
      key: 'bus',
      header: 'Bus',
      renderCell: (fleetRow) => (
        <>
          <div>{fleetRow.bus?.busCode}</div>
          <div className="text-caption text-muted">
            {fleetRow.bus?.plateNumber} · {fleetRow.bus?.busName}
          </div>
        </>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      renderCell: (fleetRow) => (
        <>
          <div>Route {fleetRow.route?.routeNumber}</div>
          <div className="text-caption text-muted">
            {fleetRow.route?.origin} &rarr; {fleetRow.route?.destination}
          </div>
        </>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      renderCell: (fleetRow) => (
        <>
          <div>{fleetRow.driver?.fullName || 'Not recorded'}</div>
          <div className="text-caption text-muted">{fleetRow.driver?.mobile}</div>
        </>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      renderCell: (fleetRow) =>
        fleetRow.nextStopName ? (
          <>
            <div>Next: {fleetRow.nextStopName}</div>
            <div className="text-caption text-muted">
              {fleetRow.stopsRemaining} {fleetRow.stopsRemaining === 1 ? 'stop' : 'stops'} to go ·{' '}
              {fleetRow.progressPercent}% of the route
            </div>
          </>
        ) : (
          'Not known without a position'
        ),
    },
    {
      key: 'speedKmh',
      header: 'Speed',
      renderCell: (fleetRow) =>
        fleetRow.speedKmh === null ? 'Not reported' : `${Math.round(fleetRow.speedKmh)} km/h`,
    },
    {
      key: 'positionAgeSeconds',
      header: 'Last ping',
      renderCell: (fleetRow) =>
        fleetRow.isStranded ? (
          <span className="cell-emphasis">{describePingAge(fleetRow.positionAgeSeconds)}</span>
        ) : (
          describePingAge(fleetRow.positionAgeSeconds)
        ),
    },
    {
      key: 'passengerCount',
      header: 'On a ticket',
      renderCell: (fleetRow) => fleetRow.passengerCount,
    },
    {
      key: 'liveStatus',
      header: 'Status',
      renderCell: (fleetRow) => {
        const fleetBadge = describeLiveStatus(fleetRow);
        return <StatusBadge status={fleetBadge.status} label={fleetBadge.label} />;
      },
    },
  ];

  const rowActions = [
    {
      label: 'Show on map',
      icon: MapPin,
      onClick: (fleetRow) => setFocusedTripId(fleetRow.tripId),
      buildAriaLabel: (fleetRow) => `Show bus ${fleetRow.bus?.busCode} on the map`,
    },
  ];

  return (
    <>
      <PageHeader
        title={FLEET_MESSAGES.title}
        subtitle={FLEET_MESSAGES.subtitle}
        actions={
          <>
            <Button
              label={isAutoRefreshOn ? 'Pause live updates' : 'Resume live updates'}
              icon={isAutoRefreshOn ? Pause : Play}
              variant="outline"
              onClick={() => setIsAutoRefreshOn((wasOn) => !wasOn)}
            />
            <Button label="Refresh now" icon={RefreshCw} onClick={reloadFleet} />
          </>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Running now"
          statValue={fleetSummary?.runningCount ?? NO_FIGURE_YET}
          icon={Bus}
          helperText={
            fleetSummary
              ? `${fleetSummary.idleBusCount} roadworthy ${fleetSummary.idleBusCount === 1 ? 'bus' : 'buses'} not out`
              : undefined
          }
        />
        <StatCard
          label="Passengers on a ticket"
          statValue={fleetSummary?.passengersOnBoard ?? NO_FIGURE_YET}
          icon={Users}
          helperText="Across every running trip"
        />
        <StatCard
          label="Running late"
          statValue={fleetSummary?.delayedCount ?? NO_FIGURE_YET}
          helperText="Buses with a delay in effect"
        />
        <StatCard
          label="No signal"
          statValue={fleetSummary?.disruptedCount ?? NO_FIGURE_YET}
          helperText={
            fleetSummary ? `${fleetSummary.strandedCount} silent long enough to close` : undefined
          }
        />
      </div>

      {strandedRows.length > 0 && (
        <section className="fleet-alert" aria-label={FLEET_MESSAGES.strandedHeading}>
          <p className="text-heading3">{FLEET_MESSAGES.strandedHeading}</p>
          <p className="text-caption">{FLEET_MESSAGES.strandedExplanation}</p>
          <ul className="fleet-alert__list">
            {strandedRows.map((fleetRow) => (
              <li key={fleetRow.tripId} className="fleet-alert__entry">
                <span>
                  {fleetRow.bus?.busCode} ({fleetRow.bus?.plateNumber}) on route{' '}
                  {fleetRow.route?.routeNumber} ·{' '}
                  {describeSilence(fleetRow.positionAgeSeconds)} ·{' '}
                  {fleetRow.driver?.fullName || 'driver not recorded'}
                </span>
                <Button
                  label={FLEET_MESSAGES.closeTripLabel}
                  variant="error"
                  size="small"
                  ariaLabel={`End the trip of bus ${fleetRow.bus?.busCode}`}
                  onClick={() => setTripPendingClose(fleetRow)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="filter-row">
        <div className="button-row">
          {FLEET_STATUS_FILTERS.map((fleetFilter) => {
            const chipCount =
              fleetFilter.liveStatus === ''
                ? fleet.length
                : fleet.filter((fleetRow) => fleetRow.liveStatus === fleetFilter.liveStatus).length;
            return (
              <Button
                key={fleetFilter.label}
                label={`${fleetFilter.label} (${chipCount})`}
                variant={fleetFilter.liveStatus === liveStatusFilter ? 'primary' : 'outline'}
                onClick={() => setLiveStatusFilter(fleetFilter.liveStatus)}
              />
            );
          })}
        </div>
        <p className="text-caption text-muted">
          {lastRefreshedLabel
            ? `Updated ${lastRefreshedLabel}${isAutoRefreshOn ? '' : ' · live updates paused'}`
            : 'Loading positions…'}
        </p>
      </div>

      <section className="card page-section" aria-label="Fleet map">
        <LiveMap
          buses={plottedBuses}
          routePaths={visibleRoutePaths}
          focusedTripId={focusedTripId}
          onFocusBus={setFocusedTripId}
        />
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
        <p className="text-caption text-muted">
          {FLEET_MESSAGES.mapCaption}
          {unplottedCount > 0 &&
            ` ${unplottedCount} running ${unplottedCount === 1 ? 'bus has' : 'buses have'} not posted a position and ${unplottedCount === 1 ? 'is' : 'are'} not on the map.`}
        </p>
      </section>

      <DataTable
        caption="Running buses with their driver, progress along the route and latest GPS ping"
        columns={fleetColumns}
        rows={visibleFleet}
        getRowKey={(fleetRow) => fleetRow.tripId}
        isLoading={isLoading}
        errorMessage={loadErrorMessage}
        onRetry={reloadFleet}
        emptyTitle={FLEET_MESSAGES.emptyTitle}
        emptyMessage={FLEET_MESSAGES.emptyMessage}
        rowActions={rowActions}
      />

      <ConfirmDialog
        isOpen={Boolean(tripPendingClose)}
        title={FLEET_MESSAGES.closeTripConfirm}
        message={closeTripMessage}
        confirmLabel={FLEET_MESSAGES.closeTripLabel}
        isDestructive
        isConfirming={isClosingTrip}
        onConfirm={closeStrandedTrip}
        onCancel={() => setTripPendingClose(null)}
      />
    </>
  );
}
