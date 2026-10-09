// API calls for the Tickets & Finance page (Member 03): the takings, a refund, and repricing a route.
import apiClient from '../../services/apiClient';

/**
 * Takings, fares and transactions for the chosen period.
 * @param {object} [summaryFilters] - Page filters.
 * @param {string} [summaryFilters.days] - Period in days; an empty string totals all time.
 * @param {string} [summaryFilters.status] - Narrows the transaction list to one payment status.
 * @returns {Promise<object>} The finance summary.
 */
export async function fetchFinanceSummary({ days, status } = {}) {
  const financeEnvelope = await apiClient.get('/admin/finance', {
    params: { days: days || undefined, status: status || undefined },
  });
  return financeEnvelope.data;
}

/**
 * Refunds one fare.
 * @param {string} paymentId - Payment to refund.
 * @returns {Promise<void>} Resolves once the refund is recorded.
 */
export async function refundPayment(paymentId) {
  await apiClient.post(`/admin/finance/payments/${paymentId}/refund`);
}

/**
 * Reprices a route. Lives on the route endpoint because the fares belong to the route and its stops,
 * even though it is the finance page that edits them.
 * @param {string} routeId - Route to reprice.
 * @param {object} fareChanges - baseFare, perKmRate and/or adjustPercent.
 * @returns {Promise<object>} The repriced route with how many stop fares changed.
 */
export async function adjustRouteFares(routeId, fareChanges) {
  const fareEnvelope = await apiClient.patch(`/admin/routes/${routeId}/fares`, fareChanges);
  return fareEnvelope.data;
}
