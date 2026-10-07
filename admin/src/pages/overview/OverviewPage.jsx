// Overview page (Member 04, FR-10): the KPI cards an admin sees first, plus what needs attention.
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bus, MessageSquare, Route, Ticket, TrendingUp, UserCog, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import { fetchOverview } from './dashboardApi';

/** Rupee wording, kept here so every figure on the page reads the same. */
const CURRENCY_PREFIX = 'Rs.';

/**
 * Admin landing page. Every number is counted from the database, never estimated.
 * @returns {import('react').JSX.Element} The page.
 */
export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [reloadCounter, setReloadCounter] = useState(0);
  const loadOverview = useCallback(() => setReloadCounter((previousCount) => previousCount + 1), []);

  useEffect(() => {
    let isEffectActive = true;
    fetchOverview()
      .then((loadedOverview) => {
        if (isEffectActive) {
          setOverview(loadedOverview);
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

  if (loadErrorMessage) {
    return (
      <>
        <PageHeader title="Overview" subtitle="Key statistics for today at a glance" />
        <ErrorState message={loadErrorMessage} onRetry={loadOverview} />
      </>
    );
  }

  const statCards = [
    {
      key: 'trips',
      label: 'Buses on the road',
      statValue: isLoading ? '--' : overview.ongoingTripCount,
      icon: Bus,
      helperText: 'Trips running right now',
    },
    {
      key: 'tickets',
      label: 'Tickets sold today',
      statValue: isLoading ? '--' : overview.ticketsToday,
      icon: Ticket,
      helperText: 'Since midnight',
    },
    {
      key: 'takings',
      label: 'Collected today',
      statValue: isLoading ? '--' : `${CURRENCY_PREFIX} ${overview.takingsToday}`,
      icon: TrendingUp,
      helperText: 'Paid fares only, refunds excluded',
    },
    {
      key: 'delays',
      label: 'Active delays',
      statValue: isLoading ? '--' : overview.activeDelayCount,
      icon: AlertTriangle,
      helperText: 'Reported by drivers and not yet cleared',
    },
    {
      key: 'passengers',
      label: 'Passengers',
      statValue: isLoading ? '--' : overview.passengerCount,
      icon: Users,
      helperText: 'Active accounts',
    },
    {
      key: 'drivers',
      label: 'Drivers',
      statValue: isLoading ? '--' : overview.driverCount,
      icon: UserCog,
      helperText: 'Active accounts',
    },
    {
      key: 'routes',
      label: 'Routes and buses',
      statValue: isLoading ? '--' : `${overview.routeCount} / ${overview.busCount}`,
      icon: Route,
      helperText: 'Routes served by registered buses',
    },
    {
      key: 'inquiries',
      label: 'Open inquiries',
      statValue: isLoading ? '--' : overview.openInquiryCount,
      icon: MessageSquare,
      helperText: 'Waiting for a reply',
    },
  ];

  const needsAttention =
    !isLoading && (overview.activeDelayCount > 0 || overview.openInquiryCount > 0);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Key statistics for today at a glance"
        actions={<Button label="Refresh" variant="outline" onClick={loadOverview} />}
      />

      {needsAttention && (
        <section className="card" aria-label="Needs attention">
          <h2 className="text-heading-3">Needs attention</h2>
          <ul className="stack-sm">
            {overview.activeDelayCount > 0 && (
              <li>
                <Link to="/delays">
                  {overview.activeDelayCount} active{' '}
                  {overview.activeDelayCount === 1 ? 'delay' : 'delays'} reported by drivers
                </Link>
              </li>
            )}
            {overview.openInquiryCount > 0 && (
              <li>
                <Link to="/inquiries">
                  {overview.openInquiryCount} open{' '}
                  {overview.openInquiryCount === 1 ? 'inquiry' : 'inquiries'} waiting for a reply
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="stat-grid" aria-label="Key statistics" aria-busy={isLoading}>
        {statCards.map((statCard) => (
          <StatCard
            key={statCard.key}
            label={statCard.label}
            statValue={statCard.statValue}
            icon={statCard.icon}
            helperText={statCard.helperText}
          />
        ))}
      </section>
    </>
  );
}
