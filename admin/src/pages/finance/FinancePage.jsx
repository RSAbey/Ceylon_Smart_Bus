// Tickets & Finance (Member 03, FR-10): what the service took in a period, how passengers paid,
// what each route is priced at, and the ledger an administrator refunds a fare from.
import { useEffect, useState } from 'react';
import { Banknote, Receipt, RotateCcw, Tag, Wallet } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import DailyBarChart from '../../components/ui/DailyBarChart';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import FareFormModal from './FareFormModal';
import { adjustRouteFares, fetchFinanceSummary, refundPayment } from './financeApi';
import {
  CURRENCY_PREFIX,
  FINANCE_MESSAGES,
  FINANCE_PERIOD_FILTERS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  TRANSACTION_STATUS_FILTERS,
  describePaymentStatus,
  formatCurrency,
} from './financeConstants';

const DEFAULT_PERIOD_DAYS = '7';
const NO_FIGURE_YET = '—';

/**
 * Admin ticket sales, takings and fares.
 * @returns {import('react').JSX.Element} The page.
 */
export default function FinancePage() {
  const { showSuccessToast, showErrorToast } = useToast();

  const [financeSummary, setFinanceSummary] = useState(null);
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const [fareRowBeingEdited, setFareRowBeingEdited] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [paymentPendingRefund, setPaymentPendingRefund] = useState(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isEffectActive = true;
    fetchFinanceSummary({ days: periodDays, status: transactionStatus })
      .then((loadedSummary) => {
        if (!isEffectActive) return;
        setFinanceSummary(loadedSummary);
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
  }, [periodDays, transactionStatus, reloadCounter]);

  const reloadFinance = () => setReloadCounter((previousCount) => previousCount + 1);

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

  const saveFares = async (fareChanges) => {
    setIsSaving(true);
    setServerFieldErrors({});
    try {
      const repricedRoute = await adjustRouteFares(fareRowBeingEdited.routeId, fareChanges);
      showSuccessToast(
        repricedRoute.adjustedStopCount > 0
          ? `Fares updated. ${repricedRoute.adjustedStopCount} stop ${repricedRoute.adjustedStopCount === 1 ? 'fare' : 'fares'} revised on route ${fareRowBeingEdited.routeNumber}.`
          : `Fares updated on route ${fareRowBeingEdited.routeNumber}.`
      );
      setFareRowBeingEdited(null);
      reloadFinance();
    } catch (saveError) {
      setServerFieldErrors(saveError.fieldErrors || {});
      if (Object.keys(saveError.fieldErrors || {}).length === 0) showErrorToast(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmRefund = async () => {
    setIsSaving(true);
    try {
      await refundPayment(paymentPendingRefund.id);
      showSuccessToast(
        `${formatCurrency(paymentPendingRefund.amount)} refunded for ticket ${paymentPendingRefund.ticketKey}.`
      );
      setPaymentPendingRefund(null);
      reloadFinance();
    } catch (refundError) {
      showErrorToast(refundError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fareColumns = [
    {
      key: 'routeNumber',
      header: 'Route',
      renderCell: (fareRow) => (
        <>
          <div>Route {fareRow.routeNumber}</div>
          <div className="text-caption text-muted">
            {fareRow.origin} &rarr; {fareRow.destination}
          </div>
        </>
      ),
    },
    { key: 'baseFare', header: 'Base fare', renderCell: (fareRow) => formatCurrency(fareRow.baseFare) },
    {
      key: 'perKmRate',
      header: 'Per km',
      renderCell: (fareRow) => (fareRow.perKmRate === null ? 'Not set' : formatCurrency(fareRow.perKmRate)),
    },
    {
      key: 'fullRouteFare',
      header: 'End to end',
      renderCell: (fareRow) =>
        fareRow.fullRouteFare === null
          ? 'No stops priced'
          : `${formatCurrency(fareRow.fullRouteFare)} · ${fareRow.stopCount} stops`,
    },
    { key: 'paymentCount', header: 'Fares paid' },
    {
      key: 'collectedAmount',
      header: 'Collected',
      renderCell: (fareRow) => formatCurrency(fareRow.collectedAmount),
    },
  ];

  const transactionColumns = [
    {
      key: 'paidAt',
      header: 'Paid',
      renderCell: (transactionRow) => (
        <>
          <div>{new Date(transactionRow.paidAt).toLocaleDateString()}</div>
          <div className="text-caption text-muted">
            {new Date(transactionRow.paidAt).toLocaleTimeString()}
          </div>
        </>
      ),
    },
    {
      key: 'ticketKey',
      header: 'Ticket',
      renderCell: (transactionRow) => (
        <>
          <div>{transactionRow.ticketKey || 'Ticket deleted'}</div>
          <div className="text-caption text-muted">{transactionRow.passengerName}</div>
        </>
      ),
    },
    {
      key: 'routeNumber',
      header: 'Route',
      renderCell: (transactionRow) =>
        transactionRow.routeNumber ? `Route ${transactionRow.routeNumber}` : 'Not known',
    },
    {
      key: 'method',
      header: 'Method',
      renderCell: (transactionRow) =>
        PAYMENT_METHOD_LABELS[transactionRow.method] || transactionRow.method,
    },
    {
      key: 'amount',
      header: 'Amount',
      renderCell: (transactionRow) => formatCurrency(transactionRow.amount),
    },
    {
      key: 'status',
      header: 'Status',
      renderCell: (transactionRow) => {
        const paymentBadge = describePaymentStatus(transactionRow.status);
        return <StatusBadge status={paymentBadge.status} label={paymentBadge.label} />;
      },
    },
  ];

  const fareRowActions = [
    {
      label: FINANCE_MESSAGES.adjustLabel,
      icon: Tag,
      onClick: (fareRow) => {
        setServerFieldErrors({});
        setFareRowBeingEdited(fareRow);
      },
      buildAriaLabel: (fareRow) => `Adjust the fares on route ${fareRow.routeNumber}`,
    },
  ];

  const transactionRowActions = [
    {
      label: FINANCE_MESSAGES.refundLabel,
      icon: RotateCcw,
      variant: 'text',
      // Only a paid fare can be given back, so the button is not offered on the others.
      isAvailable: (transactionRow) => transactionRow.status === PAYMENT_STATUSES.PAID,
      onClick: (transactionRow) => setPaymentPendingRefund(transactionRow),
      buildAriaLabel: (transactionRow) => `Refund the fare for ticket ${transactionRow.ticketKey}`,
    },
  ];

  const refundsToWallet = paymentPendingRefund?.method === 'wallet';
  const cancelsTicket = paymentPendingRefund?.ticketStatus === 'active';
  const refundMessage = paymentPendingRefund
    ? `${formatCurrency(paymentPendingRefund.amount)} was paid for ticket ${paymentPendingRefund.ticketKey} by ${paymentPendingRefund.passengerName || 'a passenger'}. ` +
      (refundsToWallet
        ? 'The money goes back to their mobile wallet straight away. '
        : 'The payment is marked refunded here; the money is handed back the way it was taken. ') +
      (cancelsTicket
        ? 'The ticket is still active, so it is cancelled and its seat goes back on the map.'
        : 'The ticket is no longer active, so no seat changes hands.')
    : '';

  const pageHeader = (
    <PageHeader title={FINANCE_MESSAGES.title} subtitle={FINANCE_MESSAGES.subtitle} />
  );

  // Every figure on this page comes from the one request, so a failure replaces the page rather
  // than repeating the same message under each table.
  if (loadErrorMessage) {
    return (
      <>
        {pageHeader}
        <ErrorState message={loadErrorMessage} onRetry={reloadFinance} />
      </>
    );
  }

  return (
    <>
      {pageHeader}

      <div className="button-row">
        {FINANCE_PERIOD_FILTERS.map((periodFilter) => (
          <Button
            key={periodFilter.label}
            label={periodFilter.label}
            variant={periodFilter.days === periodDays ? 'primary' : 'outline'}
            onClick={() => changeFilter(() => setPeriodDays(periodFilter.days))}
          />
        ))}
      </div>

      <div className="stat-grid">
        <StatCard
          label="Collected"
          statValue={financeSummary ? formatCurrency(financeSummary.collectedAmount) : NO_FIGURE_YET}
          icon={Banknote}
          helperText={
            financeSummary
              ? `${financeSummary.collectedCount} ${financeSummary.collectedCount === 1 ? 'fare' : 'fares'} paid`
              : undefined
          }
        />
        <StatCard
          label="Refunded"
          statValue={financeSummary ? formatCurrency(financeSummary.refundedAmount) : NO_FIGURE_YET}
          icon={RotateCcw}
          helperText={
            financeSummary
              ? `${financeSummary.refundedCount} ${financeSummary.refundedCount === 1 ? 'fare' : 'fares'} given back`
              : undefined
          }
        />
        <StatCard
          label="Average fare"
          statValue={financeSummary ? formatCurrency(financeSummary.averageFare) : NO_FIGURE_YET}
          icon={Receipt}
          helperText="Across the fares paid in this period"
        />
        <StatCard
          label="Failed payments"
          statValue={financeSummary?.failedCount ?? NO_FIGURE_YET}
          icon={Wallet}
          helperText="Attempts that never completed"
        />
      </div>

      {financeSummary && (
        <>
          <section className="card page-section" aria-label="How passengers paid">
            <h2 className="text-heading3">How passengers paid</h2>
            {financeSummary.byMethod.length === 0 ? (
              <p className="text-body-medium text-muted">No fares were paid in this period.</p>
            ) : (
              <ul className="stack-sm">
                {financeSummary.byMethod.map((methodTotal) => (
                  <li key={methodTotal.method}>
                    {PAYMENT_METHOD_LABELS[methodTotal.method] || methodTotal.method} ·{' '}
                    {methodTotal.paymentCount}{' '}
                    {methodTotal.paymentCount === 1 ? 'payment' : 'payments'} ·{' '}
                    {formatCurrency(methodTotal.totalAmount)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DailyBarChart
            title={FINANCE_MESSAGES.trendTitle}
            dailySeries={financeSummary.dailyTakings}
            valuePrefix={`${CURRENCY_PREFIX} `}
          />
        </>
      )}

      <section className="page-section">
        <h2 className="text-heading3">{FINANCE_MESSAGES.faresHeading}</h2>
        <p className="text-caption text-muted">{FINANCE_MESSAGES.faresCaption}</p>
        <DataTable
          caption="Fares charged on each route and what it collected in the chosen period"
          columns={fareColumns}
          rows={financeSummary?.byRoute || []}
          getRowKey={(fareRow) => fareRow.routeId}
          isLoading={isLoading}
          emptyTitle="No routes yet"
          emptyMessage="Add a route before pricing it."
          rowActions={fareRowActions}
        />
      </section>

      <section className="page-section">
        <h2 className="text-heading3">{FINANCE_MESSAGES.transactionsHeading}</h2>
        <div className="button-row">
          {TRANSACTION_STATUS_FILTERS.map((statusFilter) => (
            <Button
              key={statusFilter.label}
              label={statusFilter.label}
              variant={statusFilter.status === transactionStatus ? 'primary' : 'outline'}
              onClick={() => changeFilter(() => setTransactionStatus(statusFilter.status))}
            />
          ))}
        </div>
        <DataTable
          caption={FINANCE_MESSAGES.transactionsCaption}
          columns={transactionColumns}
          rows={financeSummary?.recentTransactions || []}
          isLoading={isLoading}
          emptyTitle="No transactions match"
          emptyMessage="Try a longer period, or clear the status filter."
          rowActions={transactionRowActions}
        />
      </section>

      <FareFormModal
        key={`fare-${fareRowBeingEdited?.routeId || 'none'}`}
        isOpen={Boolean(fareRowBeingEdited)}
        fareRow={fareRowBeingEdited}
        serverFieldErrors={serverFieldErrors}
        isSaving={isSaving}
        onSubmit={saveFares}
        onClose={() => setFareRowBeingEdited(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(paymentPendingRefund)}
        title={FINANCE_MESSAGES.refundTitle}
        message={refundMessage}
        confirmLabel={FINANCE_MESSAGES.refundLabel}
        isDestructive
        isConfirming={isSaving}
        onConfirm={confirmRefund}
        onCancel={() => setPaymentPendingRefund(null)}
      />
    </>
  );
}
